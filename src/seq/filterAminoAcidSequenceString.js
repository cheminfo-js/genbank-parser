'use strict';

module.exports = function filterAminoAcidSequenceString(
  sequenceString,
  options
) {
  options = options || {};
  if (options.includeStopCodon) {
    return sequenceString.replace(/[^xtgalmfwkqespvicyhrndu\.]/gi, '');
  }
  return sequenceString.replace(/[^xtgalmfwkqespvicyhrndu]/gi, '');
};
