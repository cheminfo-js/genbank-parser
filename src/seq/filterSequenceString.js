'use strict';

// this is throwing a weird eslint error

// var ac = require('ve-api-check');
module.exports = function filterSequenceString(sequenceString) {
  var additionalValidChars =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

  // ac.throw(ac.string,sequenceString);
  if (sequenceString) {
    return sequenceString.replace(
      new RegExp(
        '[^atgcyrswkmbvdhn' + additionalValidChars.split('').join('\\') + ']',
        'gi'
      ),
      ''
    );
  } else {
    return sequenceString;
  }
};
