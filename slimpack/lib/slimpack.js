const fs = require('fs');
const path = require('path');

const parse = require('./parser');
const createBundle = require('./template');

/**
 * @typedef Loaders
 * @type {object}
 * @property {string} loader - the name of the loader that gets exectued on the file
 */

/**
 * @typedef LoaderRule
 * @type {object}
 * @property {regex} test - A regular expression used to test the file name to determin
 * applicability of the loader
 * @property {Loaders[]} use - A list of loader names to apply to the file
 * (applied from right to left)
 */

/**
 * @typedef LoaderConfig
 * @type {object}
 * @property {LoaderRule[]} rules - A list of loaders to test against each file type
 */

/**
 * compiler - The end-to-end process that controls the end-to-end bundling process
 *
 * @param  {Object} config - The configuration object exported from slimpack.config.js
 * @param  {string} config.entry - The path of the entry file for the dependency graph
 * @param  {output} config.output - The path where the bundle should be written when
 * compilation finishes
 * @param  {output} [config.modules] - The modules object specifying loaders and file types
 * @return {undefined} - The output of fs.writeFileSync is undefined
 */
function compiler({ entry, output, modules }) {
  const entryFile = fs.readFileSync(entry, 'utf-8');
  const dependencyGraph = parse(entry, modules, entryFile);
  const compilation = createBundle(`./${path.basename(entry)}`, dependencyGraph);

  return fs.writeFileSync(`${output.path}/${output.filename}`, compilation);
}

module.exports = compiler;
