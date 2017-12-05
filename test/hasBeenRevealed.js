/* eslint-env mocha */
/* global contract assert */

const utils = require('./utils.js');

contract('PLCRVoting', (accounts) => {
  const [alice] = accounts;

  describe('Function: hasBeenRevealed', () => {
    it('should fail if the poll does not exist', async () => {
      const plcr = await utils.getPLCRInstance();
      try {
        await plcr.hasBeenRevealed(alice, 420);
        assert(false, 'should have failed for non-existant poll 420');
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
      }
    });
    it('should return true if the user has already revealed for this poll');
    it('should return false if the user has not revealed for this poll');
  });
});

