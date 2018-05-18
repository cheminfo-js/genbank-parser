'use strict';

module.exports = function createInitialSequence() {
  return {
    messages: [],
    success: true,
    parsedSequence: {
      features: [],
      name: 'Untitled sequence',
      sequence: ''
    }
  };
};
