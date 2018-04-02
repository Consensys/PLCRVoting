/* global artifacts */

const PLCRVoting = artifacts.require('./PLCRVoting.sol');
const EIP20 = artifacts.require('tokens/eip20/EIP20.sol');
const DLL = artifacts.require('./DLL.sol');
const AttributeStore = artifacts.require('./AttributeStore.sol');

const fs = require('fs');

module.exports = (deployer, network, accounts) => {
  // deploy libraries
  deployer.deploy(DLL);
  deployer.deploy(AttributeStore);

  // link libraries
  deployer.link(DLL, PLCRVoting);
  deployer.link(AttributeStore, PLCRVoting);

  if (network === 'test' || network === 'coverage') {
    const tokenConf = {
      initialAmount: '10000',
      tokenName: 'TestToken',
      decimalUnits: '0',
      tokenSymbol: 'TEST',
    };

    let plcr;
    let token;

    deployer.deploy(
      EIP20,
      tokenConf.initialAmount,
      tokenConf.tokenName,
      tokenConf.decimalUnits,
      tokenConf.tokenSymbol,
    )
      .then(() => deployer.deploy(
        PLCRVoting,
        EIP20.address,
      ))
      .then(() => PLCRVoting.deployed())
      .then((_plcr) => {
        plcr = _plcr;
      })
      .then(() => plcr.token.call())
      .then((_token) => {
        token = EIP20.at(_token);
      })
      .then(() => Promise.all(
        accounts.map(async (user) => {
          await token.transfer(user, 1000);
          await token.approve(plcr.address, 900, { from: user });
        }),
      ));
  } else {
    const conf = JSON.parse(fs.readFileSync('conf/config.json'));
    deployer.deploy(PLCRVoting, conf.token);
  }
};
