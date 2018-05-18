/* eslint no-div-regex: 0*/

'use strict';

var splitStringIntoLines = require('./utils/splitStringIntoLines.js');
var createInitialSequence = require('./utils/createInitialSequence');

function genbankToJson(string) {
  var resultsArray = [];
  var result;
  var currentFeatureNote;

  // Genbank specification: https://www.ncbi.nlm.nih.gov/Sitemap/samplerecord.html
  var genbankAnnotationKey = {
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
    END_SEQUENCE_TAG: '//'
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

  try {
    var lines = splitStringIntoLines(string);
    var fieldName;
    let subFieldType;
    var featureLocationIndentation;

    if (lines === null) {
      addMessage('Import Error: Sequence file is empty');
    }
    var hasFoundLocus = false;

    for (let line of lines) {
      if (line === null) break;
      var lineFieldName = getLineFieldName(line);
      var val = getLineVal(line);
      var isSubKey = isSubKeyword(line);
      var isKey = isKeyword(line);

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
          // If no location is specified, exclude feature and return messages
          if (val === '') {
            addMessage(
              `Warning: The feature '${lineFieldName}'' has no location specified. This line has been ignored: line${line}`
            );
            break;
          }
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
            const ref = result.parsedSequence.references || [];
            result.parsedSequence.references = ref;
            ref.push({});
          }
          parseReference(line, subFieldType);
          break;
        case genbankAnnotationKey.END_SEQUENCE_TAG:
          endSeq();
          break;
        default:
          // FOLLOWING FOR KEYWORDS NOT PREVIOUSLY DEFINED IN CASES
          addMessage(`Warning: This line has been ignored: ${line}`);
      }
    }
  } catch (e) {
    // catch any errors and set the result
    result = {
      success: false,
      messages: ['Import Error: Invalid File']
    };
  }

  // catch the case where we've successfully started a sequence and parsed it, but endSeq isn't called correctly
  if (result.success && resultsArray[resultsArray.length - 1] !== result) {
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
    return result.parsedSequence.features[
      result.parsedSequence.features.length - 1
    ];
  }

  function addMessage(msg) {
    if (result.messages.indexOf(msg === -1)) {
      result.messages.push(msg);
    }
  }

  function postProcessCurSeq() {
    if (result.parsedSequence && result.parsedSequence.features) {
      for (var i = 0; i < result.parsedSequence.features.length; i++) {
        result.parsedSequence.features[i] = postProcessGenbankFeature(
          result.parsedSequence.features[i]
        );
      }
    }
  }

  function parseOrigin(line, key) {
    if (key !== genbankAnnotationKey.ORIGIN_TAG) {
      var newLine = line.replace(/[\s]*[0-9]*/g, '');
      result.parsedSequence.sequence += newLine;
    }
  }

  function parseLocus(line) {
    result = createInitialSequence();
    line = removeFieldName(genbankAnnotationKey.LOCUS_TAG, line);
    const m = line.match(
      /^([^\s]+)\s+(\d+)\s+bp\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)$/
    );
    let locusName = m[1];
    let size = +m[2];
    let moleculeType = m[3];
    let circular = m[4] === 'circular';
    let genbankDivision = m[5];
    let date = new Date(m[6]);

    const seq = result.parsedSequence;
    seq.circular = circular;
    seq.moleculeType = moleculeType;
    seq.genbankDivision = genbankDivision;
    seq.date = isNaN(date) ? null : date;
    seq.name = locusName;
    seq.size = size;
  }

  function removeFieldName(fieldName, line) {
    line = line.replace(/^\s*/, '');
    if (line.indexOf(fieldName) === 0) {
      line = line.replace(fieldName, '');
    }
    return line.trim();
  }

  function parseReference(line, subType) {
    const refs = result.parsedSequence.references;
    let lastRef = refs[refs.length - 1];
    if (!subType) {
      parseMultiLineField(
        genbankAnnotationKey.REFERENCE_TAG,
        line,
        'description',
        lastRef
      );
    } else {
      parseMultiLineField(subType, line, subType.toLowerCase(), lastRef);
    }
  }

  var lastLineWasFeaturesTag;
  var lastLineWasLocation;
  function parseFeatures(line, key, val) {
    var strand;
    // FOR THE MAIN FEATURES LOCATION/QUALIFIER LINE
    if (key === genbankAnnotationKey.FEATURES_TAG) {
      lastLineWasFeaturesTag = true;
      return;
    }

    if (lastLineWasFeaturesTag) {
      // we need to get the indentation of feature locations
      featureLocationIndentation = getLengthOfWhiteSpaceBeforeStartOfLetters(
        line
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
        var feat = getCurrentFeature();
        feat.type = key;
        feat.strand = strand;

        parseFeatureLocation(val);
        lastLineWasLocation = true;
      }
    }
  }

  function newFeature() {
    result.parsedSequence.features.push({
      locations: [],
      notes: {}
    });
  }

  function isNote(line) {
    var qual = false;
    /* if (line.charAt(21) === "/") {//T.H. Hard coded method
           qual = true;
         }*/
    if (
      line
        .trim()
        .charAt(0)
        .match(/\//)
    ) {
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
    var locArr = [];
    locStr.replace(/(\d+)/g, function (string, match) {
      locArr.push(match);
    });
    let feat = getCurrentFeature();
    feat.start = +locArr[0];
    feat.end = +locArr[1];
  }

  function parseFeatureNote(line) {
    var newLine, lineArr;

    newLine = line.trim();
    newLine = newLine.replace(/^\/|"$/g, '');
    lineArr = newLine.split(/="|=/);

    var val = lineArr[1];

    if (val) {
      val = val.replace(/\\/g, ' ');

      if (line.match(/="/g)) {
        val = val.replace(/".*/g, '');
      } else if (val.match(/^\d+$/g)) {
        val = +val;
      }
    }
    var key = lineArr[0];
    var currentNotes = getCurrentFeature().notes;
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
    var arr;
    line = line.replace(/^[\s]*/, '');

    if (line.indexOf('=') < 0) {
      arr = line.split(/[\s]+/);
    } else {
      arr = line.split(/=/);
    }

    return arr[0];
  }

  function parseMultiLineField(fieldName, line, resultKey, r) {
    r = r || result.parsedSequence;
    let fieldValue = removeFieldName(fieldName, line);
    r[resultKey] = r[resultKey] ? `${r[resultKey]} ` : '';
    r[resultKey] += fieldValue;
  }

  function getLineVal(line) {
    var arr;

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
    var isKey = false;
    if (line.substr(0, 10).match(/^[\S]+/)) {
      isKey = true;
    }
    return isKey;
  }

  function isSubKeyword(line) {
    var isSubKey = false;
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
      // if the name is coming from a note, shorten the name to 100 chars long
      feat.name = feat.notes.note[0].substr(0, 100);
    } else {
      feat.name = '';
    }
    // shorten the name to a reasonable length if necessary and warn the user about it
    var oldName = feat.name;
    if (feat.name !== 0 && !feat.name) {
      feat.name = 'Untitled Feature';
    }
    feat.name = typeof feat.name === 'string' ? feat.name : String(feat.name);
    feat.name = feat.name.substr(0, 100);
    if (feat.name !== oldName) {
      addMessage('Warning: Shortening name of sequence (max 100 chars)');
    }
    return feat;
  }
}

function isFeatureLineRunon(line, featureLocationIndentation) {
  var indentationOfLine = getLengthOfWhiteSpaceBeforeStartOfLetters(line);
  if (featureLocationIndentation === indentationOfLine) {
    // the feature location indentation calculated right after the feature tag
    // cannot be the same as the indentation of the line
    //
    // FEATURES             Location/Qualifiers
    //     rep_origin      complement(1074..3302)
    // 01234  <-- this is the indentation we're talking about
    return false; // the line is NOT a run on
  }

  var trimmed = line.trim();
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
  var match = /^\s*/.exec(string);
  if (match !== null) {
    return match[0].length;
  } else {
    return 0;
  }
}

module.exports = genbankToJson;
