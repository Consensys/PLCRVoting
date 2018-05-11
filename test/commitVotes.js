/* eslint-env mocha */
/* global contract assert */

const utils = require('./utils.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: commitVotes', () => {
    const [alice, bob] = accounts;

    it('should commit an array of 1 vote for 1 poll', async () => {
      const plcr = await utils.getPLCRInstance();

      const options = utils.defaultOptions();
      options.actor = alice;

      // start a poll
      const receipt = await utils.as(options.actor, plcr.startPoll, options.quorum,
        options.commitPeriod, options.revealPeriod);
      const pollID = utils.getPollIDFromReceipt(receipt);

      // verify that the commit period is active
      const isActive = await plcr.commitPeriodActive(pollID);
      assert(isActive, 'poll\'s commit period is not active');

      // commit an array of 1 vote
      const secretHash = utils.createVoteHash(options.vote, options.salt);
      const prevPollID =
        await plcr.getInsertPointForNumTokens.call(options.actor, options.numTokens, pollID);

      const pollIDs = [pollID];
      const secretHashes = [secretHash];
      const numsTokens = [options.numTokens];
      const prevPollIDs = [prevPollID];
      try {
        await utils.as(alice, plcr.commitVotes, pollIDs, secretHashes, numsTokens, prevPollIDs);
      } catch (err) {
        assert(false, 'voter should have been able to commit an array of 1 vote');
      }
    });

    it('should commit an array of 2 votes for 2 polls', async () => {
      const plcr = await utils.getPLCRInstance();

      const options1 = utils.defaultOptions();
      options1.actor = alice;
      const options2 = utils.defaultOptions();
      options2.actor = bob;

      // start polls
      const receipt1 = await utils.as(options1.actor, plcr.startPoll, options1.quorum,
        options1.commitPeriod, options1.revealPeriod);
      const receipt2 = await utils.as(options2.actor, plcr.startPoll, options2.quorum,
        options2.commitPeriod, options2.revealPeriod);

      const pollID1 = utils.getPollIDFromReceipt(receipt1);
      const pollID2 = utils.getPollIDFromReceipt(receipt2);

      // verify that the commit period is active
      const isActive1 = await plcr.commitPeriodActive(pollID1);
      const isActive2 = await plcr.commitPeriodActive(pollID2);
      assert(isActive1, 'poll1\'s commit period is not active');
      assert(isActive2, 'poll2\'s commit period is not active');

      // commit an array of 2 votes
      const secretHash1 = utils.createVoteHash(options1.vote, options1.salt);
      const prevPollID1 =
        await plcr.getInsertPointForNumTokens.call(options1.actor, options1.numTokens, pollID1);
      const secretHash2 = utils.createVoteHash(options2.vote, options2.salt);
      const prevPollID2 =
        await plcr.getInsertPointForNumTokens.call(options2.actor, options2.numTokens, pollID2);

      const pollIDs = [pollID1, pollID2];
      const secretHashes = [secretHash1, secretHash2];
      const numsTokens = [options1.numTokens, options2.numTokens];
      const prevPollIDs = [prevPollID1, prevPollID2];
      try {
        await utils.as(alice, plcr.commitVotes, pollIDs, secretHashes, numsTokens, prevPollIDs);
      } catch (err) {
        assert(false, 'voter should have been able to commit an array of 2 votes');
      }
    });
  });
});
