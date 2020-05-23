'use strict';

module.exports = {
  /**
   * Reformat name to replaces whitespace with underscores.
   * @param {string} pName
   * @return {string} New name.
   */
  reformatName: function (pName) {
    return pName.toString().replace(/ /g, '_');
  },
};
