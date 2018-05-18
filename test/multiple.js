'use strict';

const fs = require('fs');
const path = require('path');

const parser = require('../src/index');

const genbank = fs.readFileSync(
  path.join(__dirname, '../fixtures/multiple.gb'),
  'utf-8'
);

const result = parser(genbank);
console.log(JSON.stringify(result[0], null, 2));
console.log(result.length);
