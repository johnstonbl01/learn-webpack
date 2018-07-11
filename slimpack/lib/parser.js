const fs = require('fs');
const path = require('path');
const acorn = require('acorn-dynamic-import').default;

function createBundleFileList(entryPath, modules, entryFile) {  
  const ast = createAST(entryFile, defaultParserOptions());
  const fileList = [{
    name: `./${path.basename(entryPath)}`,
    absPath: entryPath,
    loaders: [],
    content: fs.readFileSync(entryPath, 'utf8')
  }];
  
  return walkTree(fileList, ast.body, modules);
}

function walkTree(fileList, nodes, modules) {
  const entryFile = fileList[0];
  return nodes.reduce((dependencyList, node) => {
    if (isVariableDeclaration(node)) {
      const requiredFile = parseRequires(entryFile, node, modules);
      const deps = walkDependencyNodes(requiredFile)

      dependencyList.push(requiredFile[0]);
      dependencyList.push(...deps.slice(1));
      return dependencyList;
    }
    
    return dependencyList;
  }, fileList);
}

function walkDependencyNodes(entryFile) {
  const isJsFile = /.js/.test(entryFile[0].absPath);
  
  if (isJsFile) {
    const ast = createAST(fs.readFileSync(entryFile[0].absPath), defaultParserOptions());
    return walkTree(entryFile, ast.body);
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

function isJsFile(path) {
  return /.js/.test(path);
}

function isVariableDeclaration({ type }) {
  return type === 'VariableDeclaration';
}

function isRequireStatement({ type, init: { callee } }) {
  return type === 'VariableDeclarator' && callee.name === 'require';
}

function parseRequires(entryFile, { declarations }, modules) {
  return declarations
    .filter((node) => isRequireStatement(node))
    .map((node) => {
      const rootPath = path.dirname(entryFile.absPath);
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
          
        defaultModule.loaders = [].concat.apply([], loaders);
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

module.exports = createBundleFileList;