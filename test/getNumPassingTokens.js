/* eslint-env mocha */
/* global contract */

contract('PLCRVoting', () => {
  describe('Function: getNumPassingTokens', () => {
    it('should return the number of tokens a voter committed in the winning bloc for a poll');
    it('should fail if the poll queried has not yet ended');
    it('should fail if the voter queried has not yer revealed');
    it('should return 0 if the queried tokens were committed to the minority bloc');
  });
});

