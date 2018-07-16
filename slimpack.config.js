const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, './src/js/index.js'),
  output: {
    path: `${path.resolve(__dirname)}/dist`,
    filename: 'slimbundle.js'
  },
  modules: {
    rules: [
      {
        test: /.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }]
      }
    ]
  }
}