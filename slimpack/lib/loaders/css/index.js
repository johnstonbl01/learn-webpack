const path = require('path');
const fs = require('fs');
const csstree = require('css-tree');
const cssFileTemplate = require('./template');
const { trimString } = require('../../utils');

/**
 * cssLoader - The CSS loader function. Injects the CSS loader runtime into the
 * list of modules. Separates any import statements from the CSS and interpolates the import
 * and CSS string into the template
 *
 * @param  {BundleModule} file - The file module that the loader will be applied to
 * @return {BundleModule[]} A list of file modules -- this will contain both the affected file and
 * the runtime for the CSS loader
 */
module.exports = function cssLoader(file) {
  const cssRuntime = { ...file };
  const ast = csstree.parse(file.content);
  const imports = [];

  csstree.walk(ast, (node) => {
    if (node.type === 'Url') {
      imports.push(`@import url(${node.value.value})`);
    }
  });

  const cssBase = fs.readFileSync(path.resolve(`${__dirname}/css-base.js`), 'utf-8');
  const cssBaseModule = { name: './css-loader/css-base.js', content: cssBase, loaders: [] };

  const cssString = trimString(removeImportsFromFile(file.content));
  const importString = createImportsString(imports);

  cssRuntime.content = cssFileTemplate(cssString, importString);

  return [cssBaseModule, cssRuntime];
};

/**
 * removeImportsFromFile - Separate the CSS from any imports included in the CSS file
 *
 * @param  {string} cssString - The contents of the CSS file
 * @return {string} The contents of the CSS file, excluding any import statements
 */
function removeImportsFromFile(cssString) {
  const css = cssString.split('\n');

  return css.reduce((newCss, line) => {
    if (line.includes('@import') || line === '') {
      return newCss;
    }

    return [...newCss, line];
  }, []).join('\n');
}

/**
 * createImportsString - Create a template string for each import
 *
 * @param  {string[]} imports - A list of any imports extracted from the CSS file
 * @return {string} An string that has been interpolated for each import statement
 */
function createImportsString(imports) {
  return imports.reduce((importString, importStatement) => {
    return `${importString}exports.push([module.id, \\"${importStatement}\\"]);\n`;
  }, '');
}
