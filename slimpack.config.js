const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, './js/index.js'),
  output: { path: path.resolve(__dirname), filename: 'slimbundle.js' }
}