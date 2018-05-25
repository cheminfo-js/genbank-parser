'use strict';
/* eslint-disable no-console */
// Used to generate the readme example

const path = require('path');
const fs = require('fs');
const util = require('util');

const genbankParser = require('..');

function readFile(filename) {
  const filePath = path.join(__dirname, '../fixtures', filename);
  return fs.readFileSync(filePath, 'utf-8');
}

const parsed = genbankParser(readFile('gen2.gb'));

console.log(util.inspect(parsed, false, null));
