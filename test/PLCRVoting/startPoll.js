/* eslint-env mocha */
/* global contract assert artifacts */

const PLCRVoting = artifacts.require('./PLCRVoting.sol');
const PLCRFactory = artifacts.require('./PLCRFactory.sol');

const utils = require('./utils.js');
const BN = require('bignumber.js');

contract('PLCRVoting', () => {
  describe('Function: startPoll', () => {
    let plcr;

    before(async () => {
      const plcrFactory = await PLCRFactory.deployed();
      const receipt = await plcrFactory.newPLCRWithToken('1000', 'TestToken', '0', 'TEST');
      plcr = PLCRVoting.at(receipt.logs[0].args.plcr);
    });

    it('should return a poll with ID 1 for the first poll created', async () => {
      const receipt = await plcr.startPoll('50', '100', '100');
      const pollID = receipt.logs[0].args.pollID;
      const storedPollNonce = await plcr.pollNonce.call();

      const errMsg = 'the poll nonce may not have been initialized correctly';
      assert.strictEqual(storedPollNonce.toString(), '1', errMsg);
      assert.strictEqual(pollID.toString(), '1', errMsg);
    });

    it('should return a poll with ID 5 for the fifth poll created');
    it('should create a poll with a 50% vote quorum and 100 second commit/reveal durations');
    it('should create a poll with a 60% vote quorum, a 100 second commit duration and ' +
       'a 200 second reveal duration');

    it('should revert if block timestamp plus provided _commitDuration is greater than 2^256-1', async () => {
      // getting the maximum of uint and storing in maxEVMuint
      const maxEVMuint = new BN('2').pow('256').minus('1');
      const blockTimestamp = await utils.getBlockTimestamp();
      // setting commitDuration to block macEVMuint - blockTimestamp
      const commitDuration = maxEVMuint.minus(blockTimestamp).plus('1');

      try {
        await plcr.startPoll('50', commitDuration, '0');
      } catch (err) {
        assert(err.toString().includes('revert'), err.toString());
        return;
      }
      assert(false, 'Expected revert not recieved.');
    });

    it('should revert if (block timestamp + _commitDuration) plus provided _revealDuration is greater than 2^256-1', async () => {
      // getting the maximum of uint and storing in maxEVMuint
      const maxEVMuint = new BN('2').pow('256').minus('1');
      const blockTimestamp = await utils.getBlockTimestamp();
      // setting revealDuration to block macEVMuint - blockTimestamp
      const revealDuration = maxEVMuint.minus(blockTimestamp).plus('1');

      try {
        await plcr.startPoll('50', '0', revealDuration);
      } catch (err) {
        assert(err.toString().includes('revert'), err.toString());
        return;
      }
      assert(false, 'Expected revert not recieved.');
    });
  });
});
