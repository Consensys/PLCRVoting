/* eslint-env mocha */
/* global contract */

contract('PLCRVoting', () => {
  describe('Function: getCommitHash', () => {
    it('should return the commit hash stored by the voter for some pollID');
    it('should fail if the user has not stored any commit hash for some pollID');
  });
});

