/* eslint-env mocha */
/* global contract */

contract('PLCRVoting', () => {
  describe('Function: isPassed', () => {
    it('should return true if the poll passed');
    it('should return false if the poll ended in a tie');
    it('should return false if the poll did not pass');
  });
});

