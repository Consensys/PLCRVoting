/* eslint-env mocha */
/* global contract assert artifacts */

const PLCRVoting = artifacts.require('./PLCRVoting.sol');
const PLCRFactory = artifacts.require('./PLCRFactory.sol');
const EIP20 = artifacts.require('openzeppelin-solidity/contracts/token/ERC20/ERC20.sol');

const utils = require('./utils.js');

contract('PLCRVoting', (accounts) => {
  describe('LIST SANITY', () => {
    const [alice] = accounts;

    let plcr;
    let token;

    beforeEach(async () => {
      const plcrFactory = await PLCRFactory.deployed();
      const factoryReceipt = await plcrFactory.newPLCRWithToken('TestToken', 'TEST', '0', '1000');
      plcr = PLCRVoting.at(factoryReceipt.logs[0].args.plcr);
      token = EIP20.at(factoryReceipt.logs[0].args.token);

      // Create { A: 1, B: 5, C: 10 }
      // Then insert { A: 1, D: 3, B: 5, C: 10 }
      // And then { A: 1, D: 3, B: 5, E: 7, C: 10 }
      await token.approve(plcr.address, '1000');
      await utils.as(alice, plcr.requestVotingRights, 50);

      let receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      let pollID = utils.getPollIDFromReceipt(receipt);
      let secretHash = utils.createVoteHash(1, 420);
      let numTokens = 1;
      let insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens, pollID);
      await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);

      // { A: 1 }

      receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      pollID = utils.getPollIDFromReceipt(receipt);
      secretHash = utils.createVoteHash(1, 420);
      numTokens = 5;
      insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens, pollID);
      await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);

      // { A: 1, B: 5 }

      receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      pollID = utils.getPollIDFromReceipt(receipt);
      secretHash = utils.createVoteHash(1, 420);
      numTokens = 10;
      insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens, pollID);
      await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);

      // { A: 1, B: 5, C: 10 }

      receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      pollID = utils.getPollIDFromReceipt(receipt);
      secretHash = utils.createVoteHash(1, 420);
      numTokens = 3;
      insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens, pollID);
      await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);

      // { A: 1, D: 3, B: 5, C: 10 }

      receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      pollID = utils.getPollIDFromReceipt(receipt);
      secretHash = utils.createVoteHash(1, 420);
      numTokens = 7;
      insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens, pollID);
      await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);

      // { A: 1, D: 3, B: 5, E: 7, C: 10 }
    });

    it('should revert when updating poll 1 to a smaller value with prevPollID 3', async () => {
      // { A: 1, D: 3, B: 5, E: 7, C: 10 }
      // { 1: 1, 4: 3, 2: 5, 5: 7, 3: 10 }
      const pollID = '1';
      const secretHash = '1';

      const numTokens = '0';
      const insertPoint = '3';

      try {
        await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false, 'LIST CORRUPT');
    });

    it('should revert when updating poll 1 to a greater value with prevPollID 1', async () => {
      // { A: 1, D: 3, B: 5, E: 7, C: 10 }
      // { 1: 1, 4: 3, 2: 5, 5: 7, 3: 10 }
      const pollID = '1';
      const secretHash = '1';

      const numTokens = '2';
      const insertPoint = '1';

      try {
        await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false, 'LIST CORRUPT');
    });

    it('should revert when updating poll 2 to a greater value with prevPollID 2', async () => {
      // { A: 1, D: 3, B: 5, E: 7, C: 10 }
      // { 1: 1, 4: 3, 2: 5, 5: 7, 3: 10 }
      const pollID = '2';
      const secretHash = '1';

      const numTokens = '6';
      const insertPoint = '2';

      try {
        await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false, 'LIST CORRUPT');
    });

    it('should revert when updating poll 3 to a greater value with prevPollID 3', async () => {
      // { A: 1, D: 3, B: 5, E: 7, C: 10 }
      // { 1: 1, 4: 3, 2: 5, 5: 7, 3: 10 }
      const pollID = '3';
      const secretHash = '1';

      const numTokens = '11';
      const insertPoint = '3';

      try {
        await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false, 'LIST CORRUPT');
    });
  });
});
