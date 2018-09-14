/* eslint-env mocha */
/* global contract assert artifacts */

const PLCRVoting = artifacts.require('./PLCRVoting.sol');
const PLCRFactory = artifacts.require('./PLCRFactory.sol');
const EIP20 = artifacts.require('openzeppelin-solidity/contracts/token/ERC20/ERC20.sol');

const utils = require('./utils.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: commitVotes', () => {
    const [alice, bob] = accounts;
    let plcr;
    let token;

    before(async () => {
      const plcrFactory = await PLCRFactory.deployed();
      const receipt = await plcrFactory.newPLCRWithToken('TestToken', 'TEST', '0', '10000');

      plcr = PLCRVoting.at(receipt.logs[0].args.plcr);
      token = EIP20.at(receipt.logs[0].args.token);

      await Promise.all(
        accounts.map(async (user) => {
          await token.transfer(user, 1000);
          await token.approve(plcr.address, 1000, { from: user });
        }),
      );
    });

    it('should commit an array of 1 vote for 1 poll', async () => {
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
      await utils.as(alice, plcr.commitVotes, pollIDs, secretHashes, numsTokens, prevPollIDs);
    });

    it('should commit an array of 2 votes for 2 polls', async () => {
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

      // Alice's secretHashes & prevPollIDs
      const secretHash1a = utils.createVoteHash(options1.vote, options1.salt);
      const secretHash1b = utils.createVoteHash(options1.vote, options1.salt);
      const prevPollID1a =
        await plcr.getInsertPointForNumTokens.call(options1.actor, options1.numTokens, pollID1);
      const prevPollID1b =
        await plcr.getInsertPointForNumTokens.call(options1.actor, options1.numTokens, pollID2);

      // Bob's secretHashes & prevPollIDs
      const secretHash2a = utils.createVoteHash(options2.vote, options2.salt);
      const secretHash2b = utils.createVoteHash(options2.vote, options2.salt);
      const prevPollID2a =
        await plcr.getInsertPointForNumTokens.call(options2.actor, options2.numTokens, pollID1);
      const prevPollID2b =
        await plcr.getInsertPointForNumTokens.call(options2.actor, options2.numTokens, pollID2);

      // Array of poll IDs
      const pollIDs = [pollID1, pollID2];

      // Alice's array of: secretHashes, numsTokens, prevPollIDs
      const secretHashes1 = [secretHash1a, secretHash1b];
      const numsTokens1 = [options1.numTokens, options1.numTokens];
      const prevPollIDs1 = [prevPollID1a, prevPollID1b];

      // Bob's array of: secretHashes, numsTokens, prevPollIDs
      const secretHashes2 = [secretHash2a, secretHash2b];
      const numsTokens2 = [options2.numTokens, options2.numTokens];
      const prevPollIDs2 = [prevPollID2a, prevPollID2b];

      // commit an array of 2 votes as Alice and 2 as Bob
      try {
        await utils.as(alice, plcr.commitVotes, pollIDs, secretHashes1, numsTokens1, prevPollIDs1);
        await utils.as(bob, plcr.commitVotes, pollIDs, secretHashes2, numsTokens2, prevPollIDs2);
      } catch (err) {
        assert(false, 'voter should have been able to commit an array of 2 votes');
      }
    });
  });
});
