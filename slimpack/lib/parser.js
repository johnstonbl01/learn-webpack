const fs = require('fs');
const path = require('path');
const acorn = require('acorn-dynamic-import').default;

const { flatten } = require('./utils');

/**
 * @typedef BundleModule
 * @type {object}
 * @property {string} name - The relative path and name of the file
 * @property {string} absPath - The absolute path to the file
 * @property {Loaders[]} loaders - A list of the loaders that apply to the current file
 * @property {string} content - The content of the file
 */

/**
 * createDependencyGraph - Creates the "dependency" graph, which is a list of objects with
 * information about all the files used in our project. In this example, we're not explicitly
 * capturing dependencies in each of these objects because the projects structure is small
 * and flat. However, actual Webpack does keep track of the relationship of all the files in
 * the project.
 *
 * This function will first use acorn to create an AST (using the ESTree specification --
 * https://github.com/estree/estree), and then walk that tree looking for any require statements
 *
 * The initial module for the entry file can be hard-coded in this instance as an example
 * (there are no loaders that apply to the entry file), but Webpack will dynamically do this for
 * each file (even the entry file)
 *
 * @param  {string} entryPath - The path to the entry file
 * @param  {object} [modules] - The rules object containing information about which loaders to run
 * @param  {string} entryFile - The contents of the entry file
 * @return {BundleModule[]} A list of modules (files with meta information) that represent all the
 * files in the project
 */
function createDependencyGraph(entryPath, modules, entryFile) {
  const ast = createAST(entryFile, defaultParserOptions());
  const moduleList = [{
    name: `./${path.basename(entryPath)}`,
    absPath: entryPath,
    loaders: [],
    content: fs.readFileSync(entryPath, 'utf8')
  }];

  return walkTree(moduleList, ast.body, modules);
}

/**
 * walkTree - Walks the list of files in the dependency graph and looks for any
 * require statements. This file will recursively walk down the dependency tree when it finds a
 * require statement, and gather information about any depedency files.
 *
 * @param  {BundleModule[]} moduleList - A list of modules (files with meta information) that
 * represent all the files in the project
 * @param  {Array} nodes - A list of ESTree nodes from the AST
 * @param  {object} [modules] - The rules object containing information about which loaders to run
 * @return {BundleModule[]} A list of modules (files with meta information) that represent all
 * the files in the project
 */
function walkTree(moduleList, nodes, modules) {
  const entryModule = moduleList[0];

  return nodes.reduce((dependencyList, node) => {
    if (isVariableDeclaration(node)) {
      const requiredFile = parseRequires(entryModule, node, modules);
      const deps = walkDependencyNodes(requiredFile);

      dependencyList.push(requiredFile[0]);
      dependencyList.push(...deps.slice(1));
      return dependencyList;
    }

    return dependencyList;
  }, moduleList);
}

/**
 * walkDependencyNodes - When walkTree finds a dependency (i.e. require statement),
 * it checks to see if it's a JS file and then will look for any dependencies in
 * subsequent files (until it finds no more)
 *
 * @param  {BundleModule} entryModule The module containing information about the file where the
 * require was found
 * @return {BundleModule[] | []} A list of modules found as dependencies, or an empty list if
 * none are found
 */
function walkDependencyNodes(entryModule) {
  const isJsFile = /.js$/.test(entryModule[0].absPath);

  if (isJsFile) {
    const ast = createAST(fs.readFileSync(entryModule[0].absPath), defaultParserOptions());
    return walkTree(entryModule, ast.body);
  }

  return [];
}

function defaultParserOptions() {
  return {
    ranges: true,
    locations: true,
    ecmaVersion: 2019,
    sourceType: 'module',
    onComment: null,
    plugins: { dynamicImport: true }
  };
}

/**
 * isVariableDeclaration - Determines if the AST Node contains a variable declaration
 * (i.e. const / var / let)
 *
 * @param  {object} node - An AST Node
 * @param  {string} node.type - The type of Node
 * @return {boolean}
 */
function isVariableDeclaration({ type }) {
  return type === 'VariableDeclaration';
}

/**
 * isRequireStatement - Determines if the Node is a require statement. Note that Webpack will
 * actually do this for CommonJS, AMD, ES6 imprts, etc.
 *
 * @param  {object} node - An AST Node
 * @param  {string} node.type - The type of Node
 * @param  {object} node.init - An object with initializer information for the node
 * @param  {stirng} node.init.callee - The initiator of the expression (i.e. the require statement
 * was the initator of the variable declaration)
 * @return {boolean}
 */
function isRequireStatement({ type, init: { callee } }) {
  return type === 'VariableDeclarator' && callee.name === 'require';
}

/**
 * parseRequires - Create modules out of any required files found as dependencies in the AST. If
 * the modules parameter is provided, then format the list of loaders to use on the current file
 * and add them to the module
 *
 * @param  {BundleModule} entryModule - The file module where the current file was first included
 * as a dependency
 * @param  {object} node - An AST Node
 * @param  {Array} node.declarations - A list of any VariableDeclaration nodes from within the file
 * @param  {object} [modules] - The rules object containing information about which loaders to run
 * @return {BundleModule[]} Returns the module information for the required dependency
 */
function parseRequires(entryModule, { declarations }, modules) {
  return declarations
    .filter((node) => isRequireStatement(node))
    .map((node) => {
      const rootPath = path.dirname(entryModule.absPath);
      const fileName = node.init.arguments[0].value;
      const absPath = path.resolve(rootPath, fileName);

      const defaultModule = {
        name: fileName,
        content: fs.readFileSync(absPath, 'utf8'),
        absPath,
        loaders: []
      };

      if (modules) {
        const { rules } = modules;
        const loaders = rules
          .filter((rule) => rule.test.test(absPath))
          .map((rule) => rule.use);

        defaultModule.loaders = flatten(loaders);
        return defaultModule;
      }

      return defaultModule;
    });
}

function createAST(code, options) {
  let ast;

  try {
    ast = acorn.parse(code, options);
  } catch (err) {
    throw err;
  }

  return ast;
}

module.exports = createDependencyGraph;
