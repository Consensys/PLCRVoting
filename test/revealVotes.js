/* eslint-env mocha */
/* global contract assert */

const utils = require('./utils.js');
const BN = require('bignumber.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: revealVotes', () => {
    const [alice] = accounts;

    it('should reveal an array of 1 vote', async () => {
      const plcr = await utils.getPLCRInstance();
      const options = utils.defaultOptions();
      options.actor = alice;

      const pollID = await utils.startPollAndCommitVote(options);

      const pollIDs = [pollID];
      const votes = [options.vote];
      const salts = [options.salt];

      await utils.increaseTime(new BN(options.commitPeriod, 10).add(new BN('1', 10)).toNumber(10));
      await utils.as(options.actor, plcr.revealVotes,
        pollIDs, votes, salts);

      const votesFor = await utils.getVotesFor(pollID);
      const errMsg = 'votesFor should be equal to numTokens';
      assert.strictEqual(options.numTokens, votesFor.toString(10), errMsg);
    });

    it('should reveal an array of 2 votes in 2 polls', async () => {
      const plcr = await utils.getPLCRInstance();
      const options1 = utils.defaultOptions();
      options1.actor = alice;
      options1.vote = '1';
      options1.salt = '420';
      const pollID1 = await utils.startPollAndCommitVote(options1);

      const options2 = utils.defaultOptions();
      options2.actor = alice;
      options2.vote = '1';
      options2.salt = '9001';
      const pollID2 = await utils.startPollAndCommitVote(options2);

      const pollIDs = [pollID1, pollID2];
      const votes = [options1.vote, options2.vote];
      const salts = [options1.salt, options2.salt];

      await utils.increaseTime(new BN(options1.commitPeriod, 10).add(new BN('1', 10)).toNumber(10));
      await utils.as(options1.actor, plcr.revealVotes,
        pollIDs, votes, salts);

      const errMsg = 'votesFor should be equal to numTokens';

      const votesFor1 = await utils.getVotesFor(pollID1);
      assert.strictEqual(options1.numTokens, votesFor1.toString(10), errMsg);

      const votesFor2 = await utils.getVotesFor(pollID2);
      assert.strictEqual(options2.numTokens, votesFor2.toString(10), errMsg);
    });
  });
});

