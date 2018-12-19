/* eslint-env mocha */
/* global contract assert artifacts */

const PLCRFactory = artifacts.require('./PLCRFactory.sol');
const PLCRVoting = artifacts.require('./PLCRVoting.sol');
const EIP20 = artifacts.require('tokens/eip20/EIP20.sol');

const utils = require('./utils.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: rescueTokensInMultiplePolls', () => {
    const [alice, bob] = accounts;
    let plcr;
    let token;

    before(async () => {
      const plcrFactory = await PLCRFactory.deployed();
      const factoryReceipt = await plcrFactory.newPLCRWithToken('10000', 'TestToken', '0', 'TEST');
      plcr = await PLCRVoting.at(factoryReceipt.logs[0].args.plcr);
      token = await EIP20.at(factoryReceipt.logs[0].args.token);

      await Promise.all(
        accounts.map(async (user) => {
          await token.transfer(user, 1000);
          await token.approve(plcr.address, 1000, { from: user });
        }),
      );
    });

    it('should enable the user to withdraw tokens they committed but did not reveal after ' +
    'an array of 1 poll has ended', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;

      const startingBalance = await token.balanceOf.call(alice);
      const pollID = await utils.startPollAndCommitVote(options, plcr);
      const pollIDs = [pollID];

      await utils.increaseTime(parseInt(options.commitPeriod, 10) +
        parseInt(options.revealPeriod, 10) + 1);
      await utils.as(alice, plcr.rescueTokensInMultiplePolls, pollIDs);
      await utils.as(alice, plcr.withdrawVotingRights, options.votingRights.toString());

      const finalBalance = await token.balanceOf.call(alice);
      assert.strictEqual(finalBalance.toString(10), startingBalance.toString(10),
        'Alice was not able to rescue unrevealed tokens for a poll which had ended');
    });

    it('should enable the user to withdraw tokens they committed but did not reveal after ' +
    'an array of 2 polls have ended', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;

      const startingBalance = await token.balanceOf.call(alice);
      const pollID1 = await utils.startPollAndCommitVote(options, plcr);
      const pollID2 = await utils.startPollAndCommitVote(options, plcr);

      const pollIDs = [pollID1, pollID2];

      await utils.increaseTime(parseInt(options.commitPeriod, 10) +
        parseInt(options.revealPeriod, 10) + 1);
      await utils.as(alice, plcr.rescueTokensInMultiplePolls, pollIDs);
      await utils.as(alice, plcr.withdrawVotingRights,
        (parseInt(options.votingRights, 10) * 2).toString());

      const finalBalance = await token.balanceOf.call(alice);
      assert.strictEqual(finalBalance.toString(10), startingBalance.toString(10),
        'Alice was not able to rescue unrevealed tokens for a poll which had ended');
    });

    it('should not allow users to rescue tokens they committed before any polls in an array have ended',
      async () => {
        const options = utils.defaultOptions();
        options.actor = bob;

        const pollID1 = await utils.startPollAndCommitVote(options, plcr);
        // Increase time by half of the commit period
        await utils.increaseTime(50);

        const pollID2 = await utils.startPollAndCommitVote(options, plcr);
        // Increase time such that poll 1's reveal period ends, but poll 2's reveal period remains
        // in-flight. At this point 201 seconds have elapsed since poll 1 began, so it's over.
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

    it('should throw an error when attempting to rescue tokens from an array of 1 non-existant polls',
      async () => {
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

