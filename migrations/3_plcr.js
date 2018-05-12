/* global artifacts */

const PLCRVoting = artifacts.require('./PLCRVoting.sol');
const DLL = artifacts.require('./DLL.sol');
const AttributeStore = artifacts.require('./AttributeStore.sol');

module.exports = (deployer) => {
  // link libraries
  deployer.link(DLL, PLCRVoting);
  deployer.link(AttributeStore, PLCRVoting);

  deployer.deploy(PLCRVoting);
};

