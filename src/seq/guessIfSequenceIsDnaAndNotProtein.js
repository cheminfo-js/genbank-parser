'use strict';

module.exports = function guessIfSequenceIsDnaAndNotProtein(seq) {
  var options =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var _options$threshold = options.threshold,
    threshold = _options$threshold === undefined ? 0.9 : _options$threshold,
    _options$dnaLetters = options.dnaLetters,
    dnaLetters =
      _options$dnaLetters === undefined
        ? ['G', 'A', 'T', 'C']
        : _options$dnaLetters;

  // Guess if the given sequence is DNA or Protein.

  //   It's considered DNA if more than 90% of the sequence is GATCs. The threshold
  //   is configurable via the threshold parameter. dnaLetters can be used to configure
  //   which letters are considered DNA; for instance, adding N might be useful if
  //   you are expecting data with ambiguous bases.

  var dnaLetterMap = dnaLetters.reduce(function(acc, letter) {
    acc[letter.toUpperCase()] = true;
    return acc;
  }, {});
  var count = 0;
  for (var index = 0; index < seq.length; index++) {
    var letter = seq[index];
    if (dnaLetterMap[letter.toUpperCase()]) {
      count = count + 1;
    }
  }
  if (count / seq.length > threshold) {
    return true; //it is DNA
  }
  return false; //it is protein
};
