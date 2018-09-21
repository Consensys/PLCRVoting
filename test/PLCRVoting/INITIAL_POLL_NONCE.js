/* eslint-env mocha */
/* global contract assert artifacts */

const PLCRVoting = artifacts.require('./PLCRVoting.sol');
const PLCRFactory = artifacts.require('./PLCRFactory.sol');

contract('PLCRVoting', () => {
  describe('Function: INITIAL_POLL_NONCE', () => {
    let plcr;

    beforeEach(async () => {
      const plcrFactory = await PLCRFactory.deployed();
      const receipt = await plcrFactory.newPLCRWithToken('TestToken', 'TEST', '0', '1000');
      plcr = PLCRVoting.at(receipt.logs[0].args.plcr);
    });

    it('should be zero', async () => {
      assert.strictEqual((await plcr.INITIAL_POLL_NONCE.call()).toString(10), '0',
        'The INITIAL_POLL_NONCE was not initialized to zero');
    });
  });
});

