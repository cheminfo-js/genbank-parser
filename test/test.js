'use strict';

const fs = require('fs');
const path = require('path');

const parser = require('../src/index');

const filename = process.argv[2] || 'gen1.gb';
let filePath = path.join(__dirname, '../fixtures/', filename);

const genbank = fs.readFileSync(filePath, 'utf-8');

const result = parser(genbank);
console.log(JSON.stringify(result[0].parsedSequence, null, 2));
