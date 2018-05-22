/* eslint-env mocha */
/* global contract */

contract('PLCRVoting', () => {
  describe('Function: pollMap', () => {
    it('should return an uninitialized poll for an unused pollID');
    it('should return a correctly instantiated Poll for some pollID whose commitEndDate has not ' +
       'passed');
    it('should return a correctly instantiated Poll for some pollID whose revealEndDate has ' +
       'passed');
  });
});

