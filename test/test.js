const fs = require('fs');
const path = require('path');

const parser = require('../src/index');

const genbank = fs.readFileSync(
  path.join(__dirname, '../fixtures/gen2.gb'),
  'utf-8'
);

const result = parser(genbank);
console.log(JSON.stringify(result[0].parsedSequence, null, 2));
