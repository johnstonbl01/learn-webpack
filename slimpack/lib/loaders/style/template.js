module.exports = (cssFileName) => [
  `let content = require('${cssFileName}');`,
  'const update = require(\'./style-loader/add-styles.js\')(content);'
].join('\n');
