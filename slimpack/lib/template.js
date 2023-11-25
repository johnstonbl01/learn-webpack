const cssLoader = require('./loaders/css');
const styleLoader = require('./loaders/style');
const { flatten } = require('./utils');

/**
 * createBaseTemplate - The base code used in the output bundle for Slimpack
 *
 * @param  {string} entry - The relative file path for the entry file
 * @return {string} The interpolated template
 */
function createBaseTemplate(entry) {
  return `(function (modules) {
      const cachedModules = {};

      function __slimpack_require__(moduleId) {
        if (cachedModules[moduleId]) {
          return cachedModules[moduleId].exports;
        }

        const module = { id: moduleId, exports: {} };

        modules[moduleId].call(module.exports, module, module.exports, __slimpack_require__);

        return module.exports;
      }

      return __slimpack_require__('${entry}')
    })`;
}

/**
 * finalizeTemplate - Create the final output bundle by bringing together the
 * individual module asset files from the project and the base tempalte
 *
 * @param  {string} entry - The relative file path for the entry file
 * @param  {BundleModule[]} moduleList - The list of file modules created by the cmopiler & parser
 * @return {string} The finalized bundle string
 */
function finalizeTemplate(compiler, entry, moduleList) {
  compiler.events.emit('pre-bundle');
  const baseTemplate = createBaseTemplate(entry);
  const moduleAssets = createModuleAssets(moduleList);

  const template = `
    ${baseTemplate}
    ${moduleAssets}
  `;

  compiler.events.emit('post-bundle');
  return template;
}

/**
 * createModuleAssets - Take each file module, apply any loaders to it and create the module
 * output for the bundle. The bundle output interpolates the content from the file into an
 * eval statement for evaluation when the scriot is run in the browser
 *
 * @param  {BundleModule[]} moduleList - The list of file modules created by the cmopiler & parser
 * @return {string} A string with the formatted bundle content for each file
 */
function createModuleAssets(moduleList) {
  const modules = processLoaders(moduleList)
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


/**
 * processLoaders - For any module where the loaders list is populated (note that for the example,
 * JS files are not being run through any loaders), run the content of the file through each
 * individual loader and pass the result to the subsequent loader. Loaders run from right
 * to left in the list
 *
 * @param  {BundleModule[]} moduleList - The list of file modules created by the cmopiler & parser
 * @return {BundleModule[]} The list of modified modules after being processed through any
 * required loaders
 */
function processLoaders(moduleList) {
  const jsFiles = moduleList.filter(({ loaders }) => loaders.length === 0);

  const loaderFiles = moduleList
    .filter(({ loaders }) => loaders.length > 0)
    .reduce((modules, file) => {
      let result = [];

      for (let i = file.loaders.length - 1; i >= 0; i -= 1) {
        const loader = determineLoaderModule(file.loaders[i]);
        result = [...loader(file, flatten(result))];
      }

      return [...modules, ...flatten(result)];
    }, []);

  return [...jsFiles, ...loaderFiles];
}


/**
 * determineLoaderModule - A naive implementation for determining which loader function
 * to use based on the name provided
 *
 * @param  {object} loaders - The loaders object from the BundleModule
 * @param  {string} loaders.loader - The name of the loader
 * @return {Function} The exported loader module function
 */
function determineLoaderModule({ loader }) {
  switch (loader) {
    case 'css-loader':
      return cssLoader;
    case 'style-loader':
    default:
      return styleLoader;
  }
}

module.exports = finalizeTemplate;
