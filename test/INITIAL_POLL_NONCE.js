/* eslint-env mocha */
/* global contract assert */

const utils = require('./utils.js');

contract('PLCRVoting', () => {
  describe('Function: INITIAL_POLL_NONCE', () => {
    it('should be zero', async () => {
      const plcr = await utils.getPLCRInstance();

      assert.strictEqual((await plcr.INITIAL_POLL_NONCE.call()).toString(10), '0',
        'The INITIAL_POLL_NONCE was not initialized to zero');
    });
  });
});

