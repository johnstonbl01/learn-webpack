const fs = require('fs');
const path = require('path');
const cssLoader = require('./loaders/css');
const styleLoader = require('./loaders/style');

const parse = require('./parser');
const bundleDeps = require('./template');

function compiler({ entry, output, modules }) {
  const filesToBundle = parse(entry, modules, fs.readFileSync(entry));
  const jsBundle = bundleDeps(`./${path.basename(entry)}`, filesToBundle);
  // const bundle = processLoaders(modules, filesToBundle, jsBundle);
  
  
  return fs.writeFileSync(`${output.path}/${output.filename}`, jsBundle);
}

// function processLoaders({ rules }, fileList, bundle) {
//   const x = rules.forEach((rule) => {
//     const regex = rule.test;
//     const loaders = rules.use.map((loader) => loader.loader);
//     const filesToProcess = fileList.filter((fileInfo) => regex.test(fileInfo.absPath));
// 
//     for (let i = filesToProcess.length - 1; i >= 0; i--) {
// 
//     }
//   });
// }

// function determineLoaderModule(loaderName) {
//   switch(loaderName) {
//     case 'css-loader':
// 
//   }
// }

module.exports = compiler;

// modules: {
//   rules: [
//     {
//       test: /.css/,
//       use: [{ loader: 'css-loader' }]
//     }
//   ]
// }