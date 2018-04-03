/* eslint-env mocha */
/* global contract assert */

const utils = require('./utils.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: commitVote', () => {
    const [alice, bob] = accounts;

    it('should commit a vote for a poll', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;

      const plcr = await utils.getPLCRInstance();
      const pollID = await utils.startPollAndCommitVote(options);
      const secretHash = utils.createVoteHash(options.vote, options.salt);
      const storedHash = await plcr.getCommitHash.call(options.actor, pollID.toString(10));

      assert.strictEqual(storedHash, secretHash, 'The secretHash was not stored properly');
    });

    it('should update a commit for a poll by changing the secretHash', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;
      options.vote = '0';

      const plcr = await utils.getPLCRInstance();
      const errMsg = 'Alice was not able to update her commit';
      const pollID = '1';

      const originalHash = await plcr.getCommitHash.call(alice, pollID);
      const secretHash = utils.createVoteHash(options.vote, options.salt);
      const prevPollID =
        await plcr.getInsertPointForNumTokens.call(options.actor, options.numTokens, pollID);

      await utils.as(alice, plcr.commitVote, pollID, secretHash, options.numTokens,
        prevPollID);

      const storedHash = await plcr.getCommitHash.call(alice, pollID);

      assert.notEqual(originalHash, storedHash, errMsg);
      assert.strictEqual(storedHash, secretHash, errMsg);
    });

    it('should not allow a user to commit in a poll for which the commit period has ended',
      async () => {
        const plcr = await utils.getPLCRInstance();
        const pollID = 1;
        const errMsg = 'Alice was able to commit to a poll after its commit period ended';
        const options = utils.defaultOptions();
        options.vote = '0';

        await utils.increaseTime(101);

        const originalHash = await plcr.getCommitHash.call(alice, pollID);
        const secretHash = utils.createVoteHash(options.vote, options.salt);
        try {
          await utils.as(alice, plcr.commitVote, pollID, secretHash, options.numTokens, 0);
          assert(false, errMsg);
        } catch (err) {
          assert(utils.isEVMException(err), err.toString());
        }
        const storedHash = await plcr.getCommitHash.call(alice, pollID);

        assert.strictEqual(storedHash, originalHash, errMsg);
      });

    it('should not allow a user to commit for a poll which does not exist', async () => {
      const plcr = await utils.getPLCRInstance();
      const errMsg = 'Alice was able to commit to a poll which does not exist';
      const options = utils.defaultOptions();

      const secretHash = utils.createVoteHash(options.vote, options.salt);

      // The zero poll does not exist
      try {
        await utils.as(alice, plcr.commitVote, 0, secretHash, options.numTokens, 1);
        assert(false, errMsg);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
      }

      const tokensCommitted = await plcr.getLockedTokens.call(alice);
      assert.strictEqual(tokensCommitted.toString(10), options.numTokens, errMsg);
    });

    it('should update a commit for a poll by changing the numTokens, and allow the user to ' +
       'withdraw all their tokens when the poll ends', async () => {
      const plcr = await utils.getPLCRInstance();
      const token = await utils.getERC20Token();
      const options = utils.defaultOptions();
      options.actor = bob;
      options.numTokens = '10';

      const startingBalance = await token.balanceOf.call(bob);

      const pollID = await utils.startPollAndCommitVote(options);
      const secretHash = utils.createVoteHash(options.vote, options.salt);
      await utils.as(bob, plcr.commitVote, pollID, secretHash, '20', 0);

      await utils.increaseTime(101);

      await utils.as(bob, plcr.revealVote, pollID, options.vote, options.salt);
      await utils.as(bob, plcr.withdrawVotingRights, options.votingRights);

      const finalBalance = await token.balanceOf.call(bob);
      assert.strictEqual(startingBalance.toString(10), finalBalance.toString(10),
        'Bob locked tokens by changing his commit');
    });

    it('should revert if the voter\'s voteTokenBalance is less than numTokens', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;
      options.numTokens = '1000000';

      const plcr = await utils.getPLCRInstance();

      const pollID = '8';

      const secretHash = utils.createVoteHash(options.vote, options.salt);
      const prevPollID =
        await plcr.getInsertPointForNumTokens.call(options.actor, options.numTokens, pollID);

      try {
        await utils.as(alice, plcr.commitVote, pollID, secretHash, options.numTokens, prevPollID);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false, 'voter was able to commit more tokens than their balance');
    });

    it('should revert if pollID is 0', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;
      options.numTokens = '1';

      const plcr = await utils.getPLCRInstance();

      const pollID = '0';

      const secretHash = utils.createVoteHash(options.vote, options.salt);
      const prevPollID =
        await plcr.getInsertPointForNumTokens.call(options.actor, options.numTokens, pollID);

      try {
        await utils.as(alice, plcr.commitVote, pollID, secretHash, options.numTokens, prevPollID);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false, 'vote commited in poll with pollID 0');
    });
  });
});
