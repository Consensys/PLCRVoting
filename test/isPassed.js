/* eslint-env mocha */
/* global contract assert */

const utils = require('./utils.js');
const BN = require('bignumber.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: isPassed', () => {
    const [alice, bob] = accounts;

    it('should return true if the poll passed', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;
      options.vote = '1';

      // make a poll and commit a vote for
      const plcr = await utils.getPLCRInstance();
      const pollID = await utils.startPollAndCommitVote(options);
      await utils.increaseTime(new BN(options.commitPeriod, 10).add(new BN('1', 10)).toNumber(10));

      await utils.as(options.actor, plcr.revealVote, pollID, options.vote, options.salt);
      await utils.increaseTime(new BN(options.revealPeriod, 10).add(new BN('1', 10)).toNumber(10));

      const isPassed = await plcr.isPassed.call(pollID);
      assert.strictEqual(isPassed, true, 'isPassed should have returned true for a passing poll');
    });

    it('should return false if the poll ended in a tie', async () => {
      const plcr = await utils.getPLCRInstance();
      const aliceOptions = utils.defaultOptions();
      aliceOptions.actor = alice;
      aliceOptions.vote = '0';

      const bobOptions = utils.defaultOptions();
      bobOptions.actor = bob;
      bobOptions.vote = '1';

      const options = utils.defaultOptions();

      // start the poll as alice
      const receipt = await utils.as(alice, plcr.startPoll, options.quorum,
        options.commitPeriod, options.revealPeriod);
      const pollID = utils.getPollIDFromReceipt(receipt);

      // commit for each voter
      await utils.commitAs(pollID, aliceOptions);
      await utils.commitAs(pollID, bobOptions);
      await utils.increaseTime(new BN(options.commitPeriod, 10).add(new BN('1', 10)).toNumber(10));

      // reveal for each voter
      await utils.as(aliceOptions.actor, plcr.revealVote, pollID, aliceOptions.vote,
        aliceOptions.salt);
      await utils.as(bobOptions.actor, plcr.revealVote, pollID, bobOptions.vote, bobOptions.salt);
      await utils.increaseTime(new BN(options.revealPeriod, 10).add(new BN('1', 10)).toNumber(10));

      // should be 1-1 tie
      const isPassed = await plcr.isPassed.call(pollID);
      assert.strictEqual(isPassed, false, 'isPassed should have returned false for a tie');
    });

    it('should return false if the nobody voted', async () => {
      const plcr = await utils.getPLCRInstance();
      const options = utils.defaultOptions();
      options.actor = alice;

      // start the poll
      const receipt = await utils.as(options.actor, plcr.startPoll, options.quorum,
        options.commitPeriod, options.revealPeriod);
      const pollID = utils.getPollIDFromReceipt(receipt);

      // go to the end of the time period
      const increase = new BN(options.commitPeriod, 10)
        .add(new BN(options.revealPeriod, 10))
        .add('1');
      await utils.increaseTime(increase.toNumber(10));

      const isPassed = await plcr.isPassed.call(pollID);
      assert.strictEqual(isPassed, false, 'isPassed should have returned false for a tie');
    });


    it('should return false if the poll did not pass', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;
      options.vote = '0';

      // make a poll and commit a vote against
      const plcr = await utils.getPLCRInstance();
      const pollID = await utils.startPollAndCommitVote(options);
      await utils.increaseTime(new BN(options.commitPeriod, 10).add(new BN('1', 10)).toNumber(10));

      await utils.as(options.actor, plcr.revealVote, pollID, options.vote, options.salt);
      await utils.increaseTime(new BN(options.revealPeriod, 10).add(new BN('1', 10)).toNumber(10));

      const isPassed = await plcr.isPassed.call(pollID);
      assert.strictEqual(isPassed, false, 'isPassed should have returned false for a passing poll');
    });

    it('should revert if the poll has not ended', async () => {
      // create a poll
      const options = utils.defaultOptions();
      options.actor = alice;
      options.vote = '0';

      // make a poll and commit
      const plcr = await utils.getPLCRInstance();
      const pollID = await utils.startPollAndCommitVote(options);

      // call before reveal end date
      try {
        await plcr.isPassed.call(pollID);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false, 'was able to call isPassed on a poll that was not finished');
    });
  });
});

