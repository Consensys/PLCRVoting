/* eslint-env mocha */
/* global contract assert artifacts */

const PLCRFactory = artifacts.require('./PLCRFactory.sol');
const PLCRVoting = artifacts.require('./PLCRVoting.sol');
const EIP20 = artifacts.require('tokens/eip20/EIP20.sol');

contract('PLCRFactory', () => {
  describe('Function: newPLCRBYOToken', () => {
    let plcrFactory;

    before(async () => {
      plcrFactory = await PLCRFactory.deployed();
    });

    it('should deploy and initialize a new PLCRVoting contract using the token at the passed-in ' +
      'address', async () => {
      const tokenParams = {
        supply: '1000',
        name: 'TEST',
        decimals: '2',
        symbol: 'TST',
      };
      const token = await EIP20.new(tokenParams.supply, tokenParams.name, tokenParams.decimals,
        tokenParams.symbol);

      const receipt = await plcrFactory.newPLCRBYOToken(token.address);
      const plcr = await PLCRVoting.at(receipt.logs[0].args.plcr);

      const plcrToken = await plcr.token.call();

      assert.strictEqual(plcrToken, token.address, 'the token attached to the PLCR contract does ' +
        'not correspond to the one the user specified');
    });
  });
});

