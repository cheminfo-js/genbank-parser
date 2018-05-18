'use strict';

const path = require('path');
const fs = require('fs');

const genbankParser = require('..');

it('parse genbank with multiple records', () => {
  const parsed = genbankParser(readFile('multiple.gb'));
  expect(parsed).toHaveLength(94);
});

function readFile(filename) {
  const filePath = path.join(__dirname, '../../fixtures', filename);
  return fs.readFileSync(filePath, 'utf-8');
}
