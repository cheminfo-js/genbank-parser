const fs = require('fs');
const path = require('path');

const parser = require('./index');

const genbank = fs.readFileSync(
  path.join(__dirname, '../fixtures/gen1.gb'),
  'utf-8'
);

const result = parser(genbank);
console.log(result);
