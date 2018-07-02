const fs = require('fs');
const path = require('path');
const acorn = require('acorn-dynamic-import').default;

const parse = require('./parser');
const bundleDeps = require('./template');

function compiler({ entry, output }) {
  const parserOptions = {
    ranges: true,
    locations: true,
    ecmaVersion: 2019,
    sourceType: 'module',
    onComment: null,
    plugins: { dynamicImport: true }
  };
  
  const ast = createAST(fs.readFileSync(entry), parserOptions);
  const filesToBundle = parse(entry, ast);
  const bundle = bundleDeps(`./${path.basename(entry)}`, filesToBundle);
  
  return fs.writeFileSync(`${output.path}/${output.filename}`, bundle);
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

module.exports = compiler;