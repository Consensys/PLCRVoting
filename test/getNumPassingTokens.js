/* eslint-env mocha */
/* global contract assert */

const utils = require('./utils.js');
const BN = require('bignumber.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: getNumPassingTokens', () => {
    const [alice] = accounts;

    describe('should correctly return the number of tokens that voted for the winning option', () => {
      it('voting for', async () => {
        const options = utils.defaultOptions();
        options.actor = alice;
        options.vote = '1';

        const plcr = await utils.getPLCRInstance();
        const pollID = await utils.startPollAndCommitVote(options);
        await utils.increaseTime(new BN(options.commitPeriod, 10).add(new BN('1', 10)).toNumber(10));

        await utils.as(options.actor, plcr.revealVote, pollID, options.vote, options.salt);
        await utils.increaseTime(new BN(options.revealPeriod, 10).add(new BN('1', 10)).toNumber(10));

        const passingTokens = await plcr.getNumPassingTokens
          .call(options.actor, pollID, options.salt);

        assert.strictEqual(passingTokens.toString(), options.numTokens,
          'number of winning tokens were not equal to commited tokens');
      });

      it('voting against', async () => {
        const options = utils.defaultOptions();
        options.actor = alice;
        options.vote = '0';

        const plcr = await utils.getPLCRInstance();
        const pollID = await utils.startPollAndCommitVote(options);
        await utils.increaseTime(new BN(options.commitPeriod, 10).add(new BN('1', 10)).toNumber(10));

        await utils.as(options.actor, plcr.revealVote, pollID, options.vote, options.salt);
        await utils.increaseTime(new BN(options.revealPeriod, 10).add(new BN('1', 10)).toNumber(10));

        const passingTokens = await plcr.getNumPassingTokens
          .call(options.actor, pollID, options.salt);

        assert.strictEqual(passingTokens.toString(), options.numTokens,
          'number of winning tokens were not equal to commited tokens');
      });
    });

    it('should revert if the poll queried has not yet ended', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;
      options.vote = '0';

      // make a poll and commit
      const plcr = await utils.getPLCRInstance();
      const pollID = await utils.startPollAndCommitVote(options);

      // call before reveal end date
      try {
        await plcr.getNumPassingTokens.call(options.actor, pollID, options.salt);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false, 'was able to call getNumPassingTokens on a poll that was not finished');
    });

    it('should revert if the voter has not yet revealed a vote for the given poll', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;
      options.vote = '0';

      // make a poll and commit
      const plcr = await utils.getPLCRInstance();
      const pollID = await utils.startPollAndCommitVote(options);

      // end the poll, but do not reveal
      const increase = new BN(options.commitPeriod, 10)
        .add(new BN(options.revealPeriod, 10))
        .add('1');
      await utils.increaseTime(increase.toNumber(10));

      // make sure the poll has ended
      const ended = plcr.pollEnded.call(pollID);
      assert(ended, 'poll has not ended!');

      // call
      try {
        await plcr.getNumPassingTokens.call(options.actor, pollID, options.salt);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false, 'was able to call getNumPassingTokens on a poll without revealing a vote');
    });

    it('should revert if the calculated commitHash does not match the original', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;
      options.vote = '0';

      // commit and reveal a vote
      const plcr = await utils.getPLCRInstance();
      const pollID = await utils.startPollAndCommitVote(options);
      await utils.increaseTime(new BN(options.commitPeriod, 10).add('1').toNumber(10));

      await utils.as(options.actor, plcr.revealVote, pollID, options.vote, options.salt);
      await utils.increaseTime(new BN(options.revealPeriod, 10).add(new BN('1', 10)).toNumber(10));

      // call with some other salt
      const salt = '1776';
      assert.notStrictEqual(salt, options.salt);

      try {
        await plcr.getNumPassingTokens.call(options.actor, pollID, salt);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false, 'was able to call getNumPassingTokens with a bad salt');
    });

    it('should return 0 if the queried tokens were committed to the minority bloc');
  });
});

