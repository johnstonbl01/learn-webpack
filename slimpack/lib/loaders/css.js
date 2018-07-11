const path = require('path');
const csstree = require('css-tree');

module.exports = function (file) {
  const cssRuntime = { ...file };
  const ast = csstree.parse(file.content);
  const imports = [];
  
  csstree.walk(ast, (node) => {
    if (node.type === 'Url') {
      imports.push(`@import url(${node.value.value})`);
    }
  });
  
  const cssBaseModule = { name: './css-loader/css-base.js', content: cssBaseTemplate(), loaders: [] };
  const cssString = removeImportsFromFile(file.content).replace(/\n/g, '\\\\n');
  const importString = createImportsString(imports);

  // Embed Loader Runtime in Original CSS File
  cssRuntime.content = cssFileTemplate(cssString, importString).replace(/ {2,}/g,'').replace(/\n/g, '\n');
  // scope css file (css-loader/css-file.css)
  // replace contents of css file with style loader content that requires the scoped css file
  // scoped file executes base css and adds import statement and css to the exports object as an array
  // style loader function takes in the list created from the css loader output (overloaded module.exports) and does its thang.
  return [cssBaseModule, cssRuntime];
};

function cssBaseTemplate() {
  return `module.exports = function () { return []; };`;
}

function cssFileTemplate(cssString, importString) {
  return `exports = module.exports = require('./css-loader/css-base.js')();
    // imports
    ${importString}
    // module
    exports.push([module.id, \\"${cssString}\\"]);`;
}

function removeImportsFromFile(cssString) {
  const css = cssString.split('\n');
  
  return css.reduce((newCss, line) => {
    if (line.includes('@import') || line === '') {
      return newCss;
    }
    
    return [...newCss, line];
  }, []).join('\n');
}

function createImportsString(imports) {
  return imports.reduce((importString, importStatement) => {
    return `${importString}exports.push([module.id, \\"${importStatement}\\"]);\n`;
  }, '');
}