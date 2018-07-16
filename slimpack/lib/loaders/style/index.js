const path = require('path');
const fs = require('fs');

const styleTemplate = require('./template');
const { trimString } = require('../../utils');

/**
 * anonymous function - The style loader function. Scopes any CSS files and injects the
 * style loader runtime in its place. This creates a dependency chain in the bundle that
 * ensures the style loader code gets run and references the existing CSS files.
 *
 * @param  {BundleModule} file - The current file module that the loader will be applied to
 * @param  {BundleModule[]} files - The list of all file modules. This is used to find and
 * update the existing CSS file
 * @return {BundleModule[]} An updated list of of file modules where the style loader
 * runtime has been injected
 */
module.exports = function styleLoader(file, files) {
  const cssFile = { ...files.find((prevFile) => prevFile.name === file.name) };
  const fileIndex = files.findIndex((prevFile) => prevFile.name === file.name);

  cssFile.name = `./css-loader/!${file.name}`;

  const styleRuntime = { name: file.name, content: styleTemplate(cssFile.name), loaders: [] };
  const addStylesModule = createStylesModule();

  const updatedFiles = [...files, addStylesModule, styleRuntime];
  updatedFiles[fileIndex] = cssFile;

  return updatedFiles;
};


/**
 * createStylesModule - Creates a module for the style loader runtime
 *
 * @return {BundleModule} The module that includes the script that adds styles to the DOM
 */
function createStylesModule() {
  const addStyles = fs.readFileSync(path.resolve(`${__dirname}/add-styles.js`), 'utf-8');

  return {
    name: './style-loader/add-styles.js',
    content: trimString(addStyles),
    loaders: []
  };
}
