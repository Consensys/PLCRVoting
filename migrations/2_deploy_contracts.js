var PLCRVoting = artifacts.require("./PLCRVoting.sol");

module.exports = function(deployer) {
  deployer.deploy(PLCRVoting);
};