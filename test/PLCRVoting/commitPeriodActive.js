/* eslint-env mocha */
/* global contract assert artifacts */

const PLCRVoting = artifacts.require('./PLCRVoting.sol');
const PLCRFactory = artifacts.require('./PLCRFactory.sol');

const utils = require('./utils.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: commitPeriodActive', () => {
    const alice = accounts[0];
    let plcr;

    before(async () => {
      const plcrFactory = await PLCRFactory.deployed();
      const receipt = await plcrFactory.newPLCRWithToken('1000', 'TestToken', '0', 'TEST');
      plcr = PLCRVoting.at(receipt.logs[0].args.plcr);
    });

    it('should return true if the commit period is active', async () => {
      const defaultOptions = utils.defaultOptions();

      const pollID = utils.getPollIDFromReceipt(
        await utils.as(alice, plcr.startPoll, defaultOptions.quorum,
          defaultOptions.commitPeriod, defaultOptions.revealPeriod),
      );

      const commitPeriodActive = await plcr.commitPeriodActive.call(pollID);

      assert.strictEqual(commitPeriodActive, true, 'The commit period did not begin on poll ' +
        'instantiation');
    });

    it('should return false if the commit period is not active', async () => {
      const defaultOptions = utils.defaultOptions();

      try {
        await plcr.commitPeriodActive.call('420');
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
      }

      const pollID = utils.getPollIDFromReceipt(
        await utils.as(alice, plcr.startPoll, defaultOptions.quorum,
          defaultOptions.commitPeriod, defaultOptions.revealPeriod),
      );

      await utils.increaseTime(parseInt(defaultOptions.commitPeriod, 10) + 1);

      const commitPeriodActive = await plcr.commitPeriodActive.call(pollID);

      assert.strictEqual(commitPeriodActive, false,
        'The commit period was active for a poll where it should have ended');
    });
  });
});

