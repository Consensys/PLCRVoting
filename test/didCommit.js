/* eslint-env mocha */
/* global contract assert */

const utils = require('./utils.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: didCommit', () => {
    const [alice, bob] = accounts;

    it('should return true for a poll that a voter has committed', async () => {
      const plcr = await utils.getPLCRInstance();
      const options = utils.defaultOptions();
      options.actor = alice;

      // alice commits
      const pollID = await utils.startPollAndCommitVote(options);

      // didCommit(alice, pollID)
      const actual = await plcr.didCommit.call(options.actor, pollID.toString());
      const expected = true;
      assert.strictEqual(actual, expected, 'should have returned true because alice DID commit');
    });

    it('should return false for a poll that a voter did not commit', async () => {
      const plcr = await utils.getPLCRInstance();
      const options = utils.defaultOptions();
      options.actor = alice;

      // alice commits
      const pollID = await utils.startPollAndCommitVote(options);

      // didCommit(bob, pollID)
      const actual = await plcr.didCommit.call(bob, pollID.toString());
      const expected = false;
      assert.strictEqual(actual, expected, 'should have returned false because bob did NOT commit');
    });

    it('should revert for a poll that doesnt exist', async () => {
      const plcr = await utils.getPLCRInstance();
      const options = utils.defaultOptions();
      options.actor = alice;

      // alice commits
      const pollID = await utils.startPollAndCommitVote(options);

      try {
        // didCommit(alice, pollID + 420420420)
        await plcr.didCommit.call(options.actor, pollID.add('420420420').toString());
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false, 'should not have been able to successfully call didCommit because the poll doesnt exists');
    });
  });
});
