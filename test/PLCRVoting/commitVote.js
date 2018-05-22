/* eslint-env mocha */
/* global contract assert artifacts */

const PLCRVoting = artifacts.require('./PLCRVoting.sol');
const PLCRFactory = artifacts.require('./PLCRFactory.sol');
const EIP20 = artifacts.require('tokens/eip20/EIP20.sol');

const utils = require('./utils.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: commitVote', () => {
    const [alice, bob] = accounts;
    let plcr;
    let token;

    before(async () => {
      const plcrFactory = await PLCRFactory.deployed();
      const receipt = await plcrFactory.newPLCRWithToken('10000', 'TestToken', '0', 'TEST');

      plcr = PLCRVoting.at(receipt.logs[0].args.plcr);
      token = EIP20.at(receipt.logs[0].args.token);

      await Promise.all(
        accounts.map(async (user) => {
          await token.transfer(user, 1000);
          await token.approve(plcr.address, 1000, { from: user });
        }),
      );
    });

    it('should commit a vote for a poll', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;

      const pollID = await utils.startPollAndCommitVote(options, plcr);
      const secretHash = utils.createVoteHash(options.vote, options.salt);
      const storedHash = await plcr.getCommitHash.call(options.actor, pollID.toString(10));

      assert.strictEqual(storedHash, secretHash, 'The secretHash was not stored properly');
    });

    it('should update a commit for a poll by changing the secretHash', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;
      options.vote = '0';

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
      const options = utils.defaultOptions();
      options.actor = bob;
      options.numTokens = '10';

      const startingBalance = await token.balanceOf.call(bob);

      const pollID = await utils.startPollAndCommitVote(options, plcr);
      const secretHash = utils.createVoteHash(options.vote, options.salt);
      await utils.as(bob, plcr.commitVote, pollID, secretHash, '20', 0);

      await utils.increaseTime(101);

      await utils.as(bob, plcr.revealVote, pollID, options.vote, options.salt);
      await utils.as(bob, plcr.withdrawVotingRights, options.votingRights);

      const finalBalance = await token.balanceOf.call(bob);
      assert.strictEqual(startingBalance.toString(10), finalBalance.toString(10),
        'Bob locked tokens by changing his commit');
    });

    it('should request for voting rights if voteTokenBalance is less than numTokens', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;

      // calculate a number of tokens greater than the balance
      const startingBalance = await plcr.voteTokenBalance.call(options.actor);
      options.numTokens = startingBalance.add('1').toString();

      // start a poll
      const receipt = await utils.as(options.actor, plcr.startPoll, options.quorum,
        options.commitPeriod, options.revealPeriod);
      const pollID = utils.getPollIDFromReceipt(receipt);

      // verify that the commit period is active
      const isActive = await plcr.commitPeriodActive(pollID);
      assert(isActive, 'poll\'s commit period is not active');

      // try to commit a vote
      const secretHash = utils.createVoteHash(options.vote, options.salt);
      const prevPollID =
        await plcr.getInsertPointForNumTokens.call(options.actor, options.numTokens, pollID);

      try {
        await utils.as(alice, plcr.commitVote, pollID, secretHash, options.numTokens, prevPollID);
      } catch (err) {
        assert(false, 'voter should have been able to commit more tokens than their balance');
      }

      // verify that the ending votingRights balance was increased
      const endingBalance = await plcr.voteTokenBalance.call(options.actor);
      assert(endingBalance.toString(), startingBalance.add('1').toString(),
        'ending balance should have been the starting balance + 1');
    });

    it('should revert if pollID is 0', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;
      options.numTokens = '1';

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
