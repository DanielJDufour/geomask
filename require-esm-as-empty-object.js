const Module = require("module");

const __require__ = Module.prototype.require;

Module.prototype.require = function () {
  try {
    return __require__.apply(this, arguments);
  } catch (error) {
    if (error.message.includes("require() of ES Module")) {
      return {};
    } else {
      throw error;
    }
  }
};
