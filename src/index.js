/* eslint no-div-regex: 0*/
/* eslint prefer-named-capture-group: 0 */

'use strict';

const MONTHS = require('./utils/months');

function genbankToJson(sequence) {
  if (typeof sequence !== 'string') {
    throw new TypeError('input must be a string');
  }

  let resultsArray = [];
  let result;
  let currentFeatureNote;

  // Genbank specification: https://www.ncbi.nlm.nih.gov/Sitemap/samplerecord.html
  let genbankAnnotationKey = {
    // Contains in order: locus name, sequence length, molecule type (e.g. DNA), genbank division (see 1-18 below), modification date
    // locus definition has changed with time, use accession number for a unique identifier
    LOCUS_TAG: 'LOCUS',
    DEFINITION_TAG: 'DEFINITION',
    // Accession tag
    // Example: Z78533
    ACCESSION_TAG: 'ACCESSION',
    // The version tag contains 2 informations
    // The accession number with a revision
    // The GI (GenInfo Identifier), a ncbi sequential number
    // Example: Z78533.1  GI:2765658
    // Unicity garanteed with respect to sequence. If 1 nucleotide changes, the version is different.
    VERSION_TAG: 'VERSION',
    KEYWORDS_TAG: 'KEYWORDS',
    // SEGMENT_TAG:"SEGMENT"
    // Source is free text
    SOURCE_TAG: 'SOURCE',
    ORGANISM_TAG: 'ORGANISM',
    REFERENCE_TAG: 'REFERENCE',
    AUTHORS_TAG: 'AUTHORS',
    CONSORTIUM_TAG: 'CONSRTM',
    TITLE_TAG: 'TITLE',
    // Can be multiple journal tags
    JOURNAL_TAG: 'JOURNAL',
    PUBMED_TAG: 'PUBMED',
    REMARK_TAG: 'REMARK',
    FEATURES_TAG: 'FEATURES',
    BASE_COUNT_TAG: 'BASE COUNT',
    // CONTIG_TAG: "CONTIG"
    ORIGIN_TAG: 'ORIGIN',
    END_SEQUENCE_TAG: '//',
  };

  // Genbank divisions
  //   1. PRI - primate sequences
  //   2. ROD - rodent sequences
  //   3. MAM - other mammalian sequences
  //   4. VRT - other vertebrate sequences
  //   5. INV - invertebrate sequences
  //   6. PLN - plant, fungal, and algal sequences
  //   7. BCT - bacterial sequences
  //   8. VRL - viral sequences
  //   9. PHG - bacteriophage sequences
  // 10. SYN - synthetic sequences
  // 11. UNA - unannotated sequences
  // 12. EST - EST sequences (expressed sequence tags)
  // 13. PAT - patent sequences
  // 14. STS - STS sequences (sequence tagged sites)
  // 15. GSS - GSS sequences (genome survey sequences)
  // 16. HTG - HTG sequences (high-throughput genomic sequences)
  // 17. HTC - unfinished high-throughput cDNA sequencing
  // 18. ENV - environmental sampling sequences

  let lines = sequence.split(/\r?\n/);
  let fieldName;
  let subFieldType;
  let featureLocationIndentation;
  let lastLineWasFeaturesTag;
  let lastLineWasLocation;

  let hasFoundLocus = false;

  for (let line of lines) {
    if (line === null) break;
    let lineFieldName = getLineFieldName(line);
    let val = getLineVal(line);
    let isSubKey = isSubKeyword(line);
    let isKey = isKeyword(line);

    if (lineFieldName === genbankAnnotationKey.END_SEQUENCE_TAG || isKey) {
      fieldName = lineFieldName;
      subFieldType = null;
    } else if (isSubKey) {
      subFieldType = lineFieldName;
    }
    // IGNORE LINES: DO NOT EVEN PROCESS
    if (line.trim() === '' || lineFieldName === ';') {
      continue;
    }

    if (!hasFoundLocus && fieldName !== genbankAnnotationKey.LOCUS_TAG) {
      // 'Genbank files must start with a LOCUS tag so this must not be a genbank'
      break;
    }

    switch (fieldName) {
      case genbankAnnotationKey.LOCUS_TAG:
        hasFoundLocus = true;
        parseLocus(line);
        break;
      case genbankAnnotationKey.FEATURES_TAG:
        parseFeatures(line, lineFieldName, val);
        break;
      case genbankAnnotationKey.ORIGIN_TAG:
        parseOrigin(line, lineFieldName);
        break;
      case genbankAnnotationKey.DEFINITION_TAG:
      case genbankAnnotationKey.ACCESSION_TAG:
      case genbankAnnotationKey.VERSION_TAG:
      case genbankAnnotationKey.KEYWORDS_TAG:
        parseMultiLineField(fieldName, line, fieldName.toLowerCase());
        break;
      case genbankAnnotationKey.SOURCE_TAG:
        if (subFieldType === genbankAnnotationKey.ORGANISM_TAG) {
          parseMultiLineField(subFieldType, line, 'organism');
        } else {
          parseMultiLineField(lineFieldName, line, 'source');
        }
        break;
      case genbankAnnotationKey.REFERENCE_TAG:
        if (lineFieldName === genbankAnnotationKey.REFERENCE_TAG) {
          const ref = result.references || [];
          result.references = ref;
          ref.push({});
        }
        parseReference(line, subFieldType);
        break;
      case genbankAnnotationKey.END_SEQUENCE_TAG:
        endSeq();
        break;
      default:
        // Unhandled tag
        break;
    }
  }

  // catch the case where we've successfully started a sequence and parsed it, but endSeq isn't called correctly
  if (resultsArray[resultsArray.length - 1] !== result) {
    // current result isn't in resultsArray yet
    // so we call endSeq here
    endSeq();
  }
  return resultsArray;

  function endSeq() {
    // do some post processing clean-up
    postProcessCurSeq();
    // push the result into the resultsArray
    resultsArray.push(result);
  }

  function getCurrentFeature() {
    return result.features[result.features.length - 1];
  }

  function postProcessCurSeq() {
    if (result && result.features) {
      for (let i = 0; i < result.features.length; i++) {
        result.features[i] = postProcessGenbankFeature(result.features[i]);
      }
    }
  }

  function parseOrigin(line, key) {
    if (key !== genbankAnnotationKey.ORIGIN_TAG) {
      let newLine = line.replace(/[\s]*[0-9]*/g, '');
      result.sequence += newLine;
    }
  }

  function parseLocus(line) {
    result = {
      features: [],
      name: 'Untitled sequence',
      sequence: '',
      references: [],
    };
    line = removeFieldName(genbankAnnotationKey.LOCUS_TAG, line);
    const m = line.match(
      /^([^\s]+)\s+(\d+)\s+bp\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s*([^\s]+)?$/,
    );
    let locusName = m[1];
    let size = +m[2];
    let moleculeType = m[3];
    let circular = m[4] === 'circular';
    const seq = result;
    let dateStr = '';
    if (!m[6]) {
      dateStr = m[5];
    } else {
      seq.genbankDivision = m[5];
      dateStr = m[6];
    }
    seq.circular = circular;
    seq.moleculeType = moleculeType;
    const dateMatch = dateStr.match(/^(\d{2})-(.{3})-(\d{4})$/);
    const date = new Date();
    date.setFullYear(+dateMatch[3]);
    date.setUTCMonth(MONTHS.indexOf(dateMatch[2].toUpperCase()));
    date.setDate(+dateMatch[1]);
    date.setUTCHours(12);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    seq.date = date.toISOString();
    seq.name = locusName;
    seq.size = size;
  }

  function removeFieldName(fName, line) {
    line = line.replace(/^\s*/, '');
    if (line.indexOf(fName) === 0) {
      line = line.replace(fName, '');
    }
    return line.trim();
  }

  function parseReference(line, subType) {
    const refs = result.references;
    let lastRef = refs[refs.length - 1];
    if (!subType) {
      parseMultiLineField(
        genbankAnnotationKey.REFERENCE_TAG,
        line,
        'description',
        lastRef,
      );
    } else {
      parseMultiLineField(subType, line, subType.toLowerCase(), lastRef);
    }
  }

  function parseFeatures(line, key, val) {
    let strand;
    // FOR THE MAIN FEATURES LOCATION/QUALIFIER LINE
    if (key === genbankAnnotationKey.FEATURES_TAG) {
      lastLineWasFeaturesTag = true;
      return;
    }

    if (lastLineWasFeaturesTag) {
      // we need to get the indentation of feature locations
      featureLocationIndentation = getLengthOfWhiteSpaceBeforeStartOfLetters(
        line,
      );
      // set lastLineWasFeaturesTag to false
      lastLineWasFeaturesTag = false;
    }

    // FOR LOCATION && QUALIFIER LINES
    if (isFeatureLineRunon(line, featureLocationIndentation)) {
      // the line is a continuation of the above line
      if (lastLineWasLocation) {
        // the last line was a location, so the run-on line is expected to be a feature location as well
        parseFeatureLocation(line.trim());
        lastLineWasLocation = true;
      } else {
        // the last line was a note
        if (currentFeatureNote) {
          // append to the currentFeatureNote
          currentFeatureNote[
            currentFeatureNote.length - 1
          ] += line.trim().replace(/"/g, '');
        }
        lastLineWasLocation = false;
      }
    } else {
      // New Element/Qualifier lines. Not runon lines.
      if (isNote(line)) {
        // is a new Feature Element (e.g. source, CDS) in the form of  "[\s] KEY  SEQLOCATION"
        // is a FeatureQualifier in the /KEY="BLAH" format; could be multiple per Element
        // Check that feature did not get skipped for missing location
        if (getCurrentFeature()) {
          parseFeatureNote(line);
          lastLineWasLocation = false;
        }
      } else {
        // the line is a location, so we make a new feature from it
        if (val.match(/complement/g)) {
          strand = -1;
        } else {
          strand = 1;
        }

        newFeature();
        let feat = getCurrentFeature();
        feat.type = key;
        feat.strand = strand;

        parseFeatureLocation(val);
        lastLineWasLocation = true;
      }
    }
  }

  function newFeature() {
    result.features.push({
      notes: {},
    });
  }

  function isNote(line) {
    let qual = false;
    /* if (line.charAt(21) === "/") {//T.H. Hard coded method
           qual = true;
         }*/
    if (line.trim().charAt(0).match(/\//)) {
      // searches based on looking for / in beginning of line
      qual = true;
    } else if (line.match(/^[\s]*\/[\w]+=[\S]+/)) {
      // searches based on "   /key=BLAH" regex
      qual = true;
    }
    return qual;
  }

  function parseFeatureLocation(locStr) {
    locStr = locStr.trim();
    let locArr = [];
    locStr.replace(/(\d+)/g, function (string, match) {
      locArr.push(match);
    });
    let feat = getCurrentFeature();
    feat.start = +locArr[0];
    feat.end = locArr[1] === undefined ? +locArr[0] : +locArr[1];
  }

  function parseFeatureNote(line) {
    let newLine, lineArr;

    newLine = line.trim();
    newLine = newLine.replace(/^\/|"$/g, '');
    lineArr = newLine.split(/="|=/);

    let val = lineArr[1];

    if (val) {
      val = val.replace(/\\/g, ' ');

      if (line.match(/="/g)) {
        val = val.replace(/".*/g, '');
      } else if (val.match(/^\d+$/g)) {
        val = +val;
      }
    }
    let key = lineArr[0];
    let currentNotes = getCurrentFeature().notes;
    if (currentNotes[key]) {
      // array already exists, so push value into it
      currentNotes[key].push(val);
    } else {
      // array doesn't exist yet, so create it and populate it with the value
      currentNotes[key] = [val];
    }
    currentFeatureNote = currentNotes[key];
  }

  function getLineFieldName(line) {
    let arr;
    line = line.trim();

    arr = line.split(/[\s]+/);

    return arr[0];
  }

  function parseMultiLineField(fName, line, resultKey, r) {
    r = r || result;
    let fieldValue = removeFieldName(fName, line);
    r[resultKey] = r[resultKey] ? `${r[resultKey]} ` : '';
    r[resultKey] += fieldValue;
  }

  function getLineVal(line) {
    let arr;

    if (line.indexOf('=') < 0) {
      line = line.replace(/^[\s]*[\S]+[\s]+|[\s]+$/, '');
      line = line.trim();
      return line;
    } else {
      arr = line.split(/=/);
      return arr[1];
    }
  }

  function isKeyword(line) {
    let isKey = false;
    if (line.substr(0, 10).match(/^[\S]+/)) {
      isKey = true;
    }
    return isKey;
  }

  function isSubKeyword(line) {
    let isSubKey = false;
    if (line.substr(0, 10).match(/^[\s]+[\S]+/)) {
      isSubKey = true;
    }
    return isSubKey;
  }

  function postProcessGenbankFeature(feat) {
    if (feat.notes.label) {
      feat.name = feat.notes.label[0];
    } else if (feat.notes.gene) {
      feat.name = feat.notes.gene[0];
    } else if (feat.notes.ApEinfo_label) {
      feat.name = feat.notes.ApEinfo_label[0];
    } else if (feat.notes.name) {
      feat.name = feat.notes.name[0];
    } else if (feat.notes.organism) {
      feat.name = feat.notes.organism[0];
    } else if (feat.notes.locus_tag) {
      feat.name = feat.notes.locus_tag[0];
    } else if (feat.notes.note) {
      feat.name = feat.notes.note[0];
    } else {
      feat.name = 'Untitled Feature';
    }
    feat.name = typeof feat.name === 'string' ? feat.name : String(feat.name);
    return feat;
  }
}

function isFeatureLineRunon(line, featureLocationIndentation) {
  let indentationOfLine = getLengthOfWhiteSpaceBeforeStartOfLetters(line);
  if (featureLocationIndentation === indentationOfLine) {
    // the feature location indentation calculated right after the feature tag
    // cannot be the same as the indentation of the line
    //
    // FEATURES             Location/Qualifiers
    //     rep_origin      complement(1074..3302)
    // 01234  <-- this is the indentation we're talking about
    return false; // the line is NOT a run on
  }

  let trimmed = line.trim();
  if (trimmed.charAt(0).match(/\//)) {
    // the first char in the trimmed line cannot be a /
    return false; // the line is NOT a run on
  }
  // the line is a run on
  return true;
  // run-on line example:
  // FEATURES             Location/Qualifiers
  //     rep_origin      complement(1074..3302)
  //                 /label=pSC101**
  //                 /note="REP_ORIGIN REP_ORIGIN pSC101* aka pMPP6, gives plasm
  //                 id number 3 -4 copies per cell, BglII site in pSC101* ori h <--run-on line!
  //                 as been dele ted by quick change agatcT changed to agatcA g <--run-on line!
  //                 iving pSC101* * pSC101* aka pMPP6, gives plasmid number 3-4 <--run-on line!
  //                 copies p er cell, BglII site in pSC101* ori has been delet  <--run-on line!
  //                 ed by quic k change agatcT changed to agatcA giving pSC101* <--run-on line!
  //                 * [pBbS0a-RFP]"                                             <--run-on line!
  //                 /gene="SC101** Ori"
  //                 /note="pSC101* aka pMPP6, gives plasmid number 3-4 copies p
  //                 er cell, BglII site in pSC101* ori has been deleted by qui
  //                 c k change agatcT changed to agatcA giving pSC101**"
  //                 /vntifkey="33"
}

function getLengthOfWhiteSpaceBeforeStartOfLetters(string) {
  let match = /^\s*/.exec(string);
  if (match !== null) {
    return match[0].length;
  } else {
    return 0;
  }
}

module.exports = genbankToJson;
