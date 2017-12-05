/* eslint-env mocha */
/* global contract */

contract('PLCRVoting', () => {
  describe('Function: getTotalNumberOfTokensForWinningOption', () => {
    it('should return the total number of votes for if the poll passed');
    it('should return the total number of votes against if the poll did not pass');
    it('should fail if the poll has not yet ended');
  });
});

