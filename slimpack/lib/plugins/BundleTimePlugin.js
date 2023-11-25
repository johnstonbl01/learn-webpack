/* eslint-disable no-shadow, no-console */

class BundleTimePlugin {
  constructor() {
    this.bundleTime = null;
  }

  /**
   * convertTimeToMilliseconds - Converts the hr time [s, ns] to milliseconds
   *
   * @param  {number[]} hrTime - The time from process.hrtime
   * @return {number} Time in milliseconds
   */
  convertTimeToMilliseconds(hrTime) {
    const NANOSECONDS_IN_MS = 1000000;

    const secondsToMilliseconds = hrTime[0] * 1000;
    const nanosecondsToMilliseconds = hrTime[1] / NANOSECONDS_IN_MS;

    return secondsToMilliseconds + nanosecondsToMilliseconds;
  }

  /**
   * apply - The function used by the compiler to register any listeners for
   * compiler events. setImmediate ensures asynchrony
   *
   * @param  {function} compiler - The current instance of the Slimpack compiler
   * @return {unedefined} Undefined is returned from this function since it's
   * used to register listeners only
   */
  apply(compiler) {
    compiler.plugin('pre-bundle', () => {
      this.bundleTime = process.hrtime();
    });

    compiler.plugin('post-bundle', () => {
      setImmediate(() => {
        this.bundleTime = this.convertTimeToMilliseconds(process.hrtime(this.bundleTime));
        console.log(`Bundling finished after ${this.bundleTime}ms`);
      });
    });
  }
}

module.exports = BundleTimePlugin;
