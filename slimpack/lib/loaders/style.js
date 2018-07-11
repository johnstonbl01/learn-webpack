module.exports = function (file, files) {
  // console.log('beginning', files);
  const cssFile = { ...files.find((prevFile) => prevFile.name === file.name) };
  // console.log('css file', cssFile.name);
  const fileIndex = files.findIndex((prevFile) => prevFile.name === file.name);
  // replace content of original file with reference to add styles
  
  // Scope CSS file to Loader
  cssFile.name = `./css-loader/!${file.name}`;
  const styleRuntime = { name: file.name, content: cssFileTemplate(cssFile.name), loaders: [] };
  const addStylesModule = createStylesModule();
// console.log('***', files);
  const updatedFiles = [...files, addStylesModule, styleRuntime];
  updatedFiles[fileIndex] = cssFile;
  // console.log('****************************************************');
  // console.log('updated files', updatedFiles);
  // console.log('****************************************************');
  return updatedFiles;
};

function cssFileTemplate(cssFileName) {
  return `let content = require('${cssFileName}');
    const update = require('./style-loader/add-styles.js')(content);
  `.replace(/\n/g, '\\n');
}

function createStylesModule(list) {
  return {
    name: './style-loader/add-styles.js',
    content: addStylesTemplate().replace(/\n/g, '\\n').trim(),
    loaders: []
  };
}

function addStylesTemplate() {
  return `module.exports = function (list) {
      const styles = convertListToStyles(list);
      addStylesToDom(styles);
    };
    
    function convertListToStyles(list) {
      return list.reduce((styles, style) => {
        const existingStyle = styles.find((styleObj) => styleObj.id === style[0]);
        const css = style[1];
        const id = style[0];
    
        if (existingStyle) {
          existingStyle.parts.push({ css });
          return styles;
        }
    
        const newStyle = { id, parts: [{ css }] };
    
        return [...styles, newStyle];
      }, []);
    }
    
    function addStylesToDom(styles) {
      styles.forEach((style) => {
        style.parts.forEach(({ css }) => {
          console.log('CSS', css);
          const styleElement = createStyleElement();
          styleElement.appendChild(document.createTextNode(css));
          console.log(styleElement);
          const head = document.querySelector('head');
          head.appendChild(styleElement);
        });
      });
    }
    
    function createStyleElement() {
      const style = document.createElement('style');
      style.setAttribute('type', 'text/css');
      
      return style;
    }`.trim();
}

// module.exports = function (list) {
//   const styles = convertListToStyles(list);
//   addStylesToDom(styles);
// };
// 
// function convertListToStyles(list) {
//   return list.reduce((styles, style) = {
//     const existingStyle = styles.find((styleObj) => styleObj.id === style.id);
//     const css = style[1];
//     const id = style[0];
// 
//     if (existingStyle) {
//       existingStyle.parts.push({ css });
//       return styles;
//     }
// 
//     const newStyle = { id, parts: [{ css }] };
// 
//     return [...styles, newStyle];
//   }, []);
// }
// 
// function addStylesToDom(styles) {
//   styles.forEach((style) => {
//     style.parts.forEach(({ css }) => {
//       const style = createStyleElement();
//       style.appendChild(document.createTextNode(css));
// 
//       const head = document.querySelector('head');
//       head.appendChild(style);
//     });
//   });
// }
// 
// function createStyleElement() {
//   const style = document.createElement('style');
//   style.setAttribute('type', 'text/css');
// }