const fs = require('fs');

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
  const modules = fileList.reduce((template, fileInfo) => {
    const fileContent = fs.readFileSync(fileInfo.absPath, 'utf8').replace(/\n/g, '\\n');
    
    const moduleAsset = `\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'${fileInfo.name}': (function(module, exports, __slimpack_require__) {
        eval("${fileContent.replace(/require/, '__slimpack_require__')}");
      }),
    `;
    
    return `${template}\n${moduleAsset}`;
  }, '');
  
  return `({
    ${modules}
  })`;
}

module.exports = finalizeTemplate;