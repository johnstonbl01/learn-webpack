const fs = require('fs');
const cssLoader = require('./loaders/css');
const styleLoader = require('./loaders/style');

function createBaseTemplate(entry) {
  return `(function (modules) {
      const cachedModules = {};
      
      function __slimpack_require__(moduleId) {
        if (cachedModules[moduleId]) {
          return cachedModules[moduleId].exports;
        }
        
        const module = { id: moduleId, loaded: false, exports: {} };
        
        modules[moduleId].call(module.exports, module, module.exports, __slimpack_require__);
        
        return module.exports;
      }
      
      __slimpack_require__.modules = modules;
      __slimpack_require__.cache = cachedModules;
      __slimpack_require__.entry = '${entry}';
      
      return __slimpack_require__(__slimpack_require__.entry)
    })`;
}

function finalizeTemplate(entry, fileList) {
  const baseTemplate = createBaseTemplate(entry);
  const moduleAssets = createModuleAssets(fileList);
  
  return `
    ${baseTemplate}
    ${moduleAssets}
  `;
}

function createModuleAssets(fileList) {
  const modules = processLoaders(fileList)
    .reduce((template, { name, content }) => {
      const fileContent = content.replace(/\n/g, '\\n');

      const moduleAsset = `\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'${name}': (function(module, exports, __slimpack_require__) {
          eval("${fileContent.replace(/require/g, '__slimpack_require__')}");
        }),
      `;
      
      return `${template}\n${moduleAsset}`;
    }, '');
  
  return `({
    ${modules}
  })`;
}

function processLoaders(fileList) {
  const jsFiles = fileList.filter(({ loaders }) => loaders.length === 0);
  const loaderFiles = fileList
    .filter(({ loaders }) => loaders.length > 0)
    .reduce((files, file) => {
      let result = [];
    
      for (let i = file.loaders.length - 1; i >= 0; i--) {
        let loader = determineLoaderModule(file.loaders[i]);
        result = [...loader(file, flatten(result))];
      }

      return [...files, ...flatten(result)];
    }, []);
    
  return [...jsFiles, ...loaderFiles];
}

function determineLoaderModule({ loader }) {
  switch (loader) {
    case 'css-loader':
      return cssLoader;
    case 'style-loader':
    default:
      return styleLoader;
  }
}

function flatten(list) {
  return [].concat.apply([], list);
}

module.exports = finalizeTemplate;