/* eslint-env mocha */
/* global contract assert artifacts */

const PLCRVoting = artifacts.require('./PLCRVoting.sol');
const PLCRFactory = artifacts.require('./PLCRFactory.sol');

const abi = require('ethereumjs-abi');

contract('PLCRVoting', (accounts) => {
  describe('Function: attrUUID', () => {
    let plcr;

    beforeEach(async () => {
      const plcrFactory = await PLCRFactory.deployed();
      const receipt = await plcrFactory.newPLCRWithToken('TestToken', 'TEST', '0', '1000');
      plcr = PLCRVoting.at(receipt.logs[0].args.plcr);
    });

    it('should generate the keccak256 hash of the provided values', async () => {
      const alice = accounts[0];

      const attrUUID = await plcr.attrUUID.call(alice, '420');
      const expectedAttrUUID =
        `0x${abi.soliditySHA3(['address', 'uint'], [alice, '420']).toString('hex')}`;

      assert.strictEqual(attrUUID, expectedAttrUUID, 'attrUUID was computed incorrectly!');
    });

    it('should generate divergent keccak256 hashes of divergent values', async () => {
      const alice = accounts[0];

      const attrUUID0 = await plcr.attrUUID.call(alice, '420');
      const attrUUID1 = await plcr.attrUUID.call(alice, '421');

      assert.notEqual(attrUUID0, attrUUID1, 'Divergent values were given the same attrUUID!');
    });
  });
});

