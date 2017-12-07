/* eslint-env mocha */
/* global contract assert */

const utils = require('./utils.js');
const abi = require('ethereumjs-abi');

contract('PLCRVoting', (accounts) => {
  describe('Function: attrUUID', () => {
    it('should generate the keccak256 hash of the provided values', async () => {
      const plcr = await utils.getPLCRInstance();
      const alice = accounts[0];

      const attrUUID = await plcr.attrUUID.call(alice, '420');
      const expectedAttrUUID =
        `0x${abi.soliditySHA3(['address', 'uint'], [alice, '420']).toString('hex')}`;

      assert.strictEqual(attrUUID, expectedAttrUUID, 'attrUUID was computed incorrectly!');
    });

    it('should generate divergent keccak256 hashes of divergent values', async () => {
      const plcr = await utils.getPLCRInstance();
      const alice = accounts[0];

      const attrUUID0 = await plcr.attrUUID.call(alice, '420');
      const attrUUID1 = await plcr.attrUUID.call(alice, '421');

      assert.notEqual(attrUUID0, attrUUID1, 'Divergent values were given the same attrUUID!');
    });
  });
});

