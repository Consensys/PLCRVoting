/* eslint-env mocha */
/* global contract assert */

const utils = require('./utils.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: rescueTokensInMultiplePolls', () => {
    const [alice, bob] = accounts;

    it('should enable the user to withdraw tokens they committed but did not reveal after ' +
    'an array of 1 poll has ended', async () => {
      const plcr = await utils.getPLCRInstance();
      const token = await utils.getERC20Token();
      const options = utils.defaultOptions();
      options.actor = alice;

      const startingBalance = await token.balanceOf.call(alice);
      const pollID = await utils.startPollAndCommitVote(options);
      const pollIDs = [pollID];

      await utils.increaseTime(201);
      await utils.as(alice, plcr.rescueTokensInMultiplePolls, pollIDs);
      await utils.as(alice, plcr.withdrawVotingRights, 50);

      const finalBalance = await token.balanceOf.call(alice);
      assert.strictEqual(finalBalance.toString(10), startingBalance.toString(10),
        'Alice was not able to rescue unrevealed tokens for a poll which had ended');
    });

    it('should enable the user to withdraw tokens they committed but did not reveal after ' +
    'an array of 2 polls have ended', async () => {
      const plcr = await utils.getPLCRInstance();
      const token = await utils.getERC20Token();
      const options = utils.defaultOptions();
      options.actor = alice;

      const startingBalance = await token.balanceOf.call(alice);
      const pollID1 = await utils.startPollAndCommitVote(options);
      const pollID2 = await utils.startPollAndCommitVote(options);

      const pollIDs = [pollID1, pollID2];

      await utils.increaseTime(201);
      await utils.as(alice, plcr.rescueTokensInMultiplePolls, pollIDs);
      await utils.as(alice, plcr.withdrawVotingRights, 100);

      const finalBalance = await token.balanceOf.call(alice);
      assert.strictEqual(finalBalance.toString(10), startingBalance.toString(10),
        'Alice was not able to rescue unrevealed tokens for a poll which had ended');
    });

    it('should not allow users to rescue tokens they committed before any polls in an array have ended',
      async () => {
        const plcr = await utils.getPLCRInstance();
        const options = utils.defaultOptions();
        options.actor = bob;

        const pollID1 = await utils.startPollAndCommitVote(options);
        await utils.increaseTime(50);

        const pollID2 = await utils.startPollAndCommitVote(options);
        await utils.increaseTime(151);

        // pollID1 has ended
        const poll1Ended = await plcr.pollEnded.call(pollID1);
        assert.strictEqual(poll1Ended, true, 'poll 1 should have ended');
        // pollID2 still on-going
        const poll2Ended = await plcr.pollEnded.call(pollID2);
        assert.strictEqual(poll2Ended, false, 'poll 2 should still be active');

        const pollIDs = [pollID1, pollID2];

        try {
          await utils.as(bob, plcr.rescueTokensInMultiplePolls, pollIDs);
        } catch (err) {
          assert(utils.isEVMException(err), err.toString());
          return;
        }
        assert(false, 'Bob was able to rescue unrevealed tokens before a poll ended');
      });

    it('should throw an error when attempting to rescue tokens from an array of 1 non-existant poll',
      async () => {
        const plcr = await utils.getPLCRInstance();
        const options = utils.defaultOptions();
        options.actor = bob;
        const pollID = '667';
        const pollIDs = [pollID];

        try {
          await utils.as(bob, plcr.rescueTokensInMultiplePolls, pollIDs);
        } catch (err) {
          assert(utils.isEVMException(err), err.toString());
          return;
        }
        assert(false, 'should not have been able to call rescueTokens for a non-existant poll');
      });
  });
});

