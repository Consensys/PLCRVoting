/* eslint-env mocha */
/* global contract assert */

const BigNumber = require('bignumber.js');
const utils = require('./utils.js');

contract('PLCRVoting', () => {
  describe('Property: uint pollNonce', () => {
    it('should initialize the pollNonce to zero', async () => {
      const expectedPollNonce = BigNumber(0);
      const plcr = await utils.getPLCRInstance();
      const initialPollNonce = await plcr.pollNonce.call();

      assert.isOk(
        expectedPollNonce.eq(initialPollNonce),
        'Incorrect poll nonce returned',
      );
    });
  });
});
