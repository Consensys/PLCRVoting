/* eslint-env mocha */
/* global contract */

contract('PLCRVoting', () => {
  describe('Function: isExpired', () => {
    it('should return true if the provided timestamp is greater than the current block timestamp');
    it('should return false if the provided timestamp is less than the current block timestamp');
  });
});

