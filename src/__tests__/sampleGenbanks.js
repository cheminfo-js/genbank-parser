'use strict';

const fs = require('fs');
const path = require('path');

const genbankParser = require('..');

describe('genbank parsing snapshots', () => {
  it('ncbi genbank example', () => {
    expect(genbankParser(readFile('gen2.gb'))).toMatchSnapshot();
  });

  it('MPI genbank example', () => {
    expect(genbankParser(readFile('gen1.gb'))).toMatchSnapshot();
  });

  it('geneious example 2', () => {
    expect(genbankParser(readFile('geneious2.gb'))).toMatchSnapshot();
  });

  it('p5', () => {
    expect(genbankParser(readFile('JHp0005.gb'))).toMatchSnapshot();
  });
});

function readFile(filename) {
  const filePath = path.join(__dirname, '../../fixtures', filename);
  return fs.readFileSync(filePath, 'utf-8');
}
