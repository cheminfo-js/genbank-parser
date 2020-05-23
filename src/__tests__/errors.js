'use strict';

const genbankParser = require('..');

describe('genbank parsing snapshots', () => {
  it('must be a string', () => {
    expect(() => genbankParser(42)).toThrow(/input must be a string/);
  });
});
