module.exports = (cssString, importString) => [
  'exports = module.exports = require(\'./css-loader/css-base.js\')();',
  '// imports',
  `${importString}`,
  '// modules',
  `exports.push([module.id, \\"${cssString}\\"]);`
].join('\n');
