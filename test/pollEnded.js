/* eslint-env mocha */
/* global contract assert */

const utils = require('./utils.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: pollEnded', () => {
    const [alice, bob] = accounts;

    it('should return true if the poll has ended', async () => {
      const plcr = await utils.getPLCRInstance();

      const options = utils.defaultOptions();
      options.actor = alice;

      const pollID = await utils.startPollAndCommitVote(options);

      // End the poll
      await utils.increaseTime(201);

      // Poll has already ended
      const pollEnded = await plcr.pollEnded.call(pollID);
      assert.strictEqual(pollEnded, true, 'poll should have ended.');
    });

    it('should return false if the poll has not ended', async () => {
      const plcr = await utils.getPLCRInstance();

      const options = utils.defaultOptions();
      options.actor = alice;
      options.votingRights = '20';
      options.prevPollID = '1';

      const pollID = await utils.startPollAndCommitVote(options);

      await utils.increaseTime(101);

      const pollEnded = await plcr.pollEnded.call(pollID);
      assert.strictEqual(pollEnded, false, 'poll should still be active');
    });

    it('should throw an error if the poll does not exist', async () => {
      const plcr = await utils.getPLCRInstance();

      const options = utils.defaultOptions();
      options.actor = bob;

      try {
        await plcr.pollEnded.call('9001');
        assert(false, 'should have thrown error for non-existant poll #9001');
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
      }
    });
  });
});

