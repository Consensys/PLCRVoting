// CONTRACTS:
const VotingContract = artifacts.require("./PLCRVoting.sol");
const TokenContract = artifacts.require("./HumanStandardToken.sol");

// NODE VARS:
const fs = require(`fs`);

module.exports = (deployer, network, accounts) => {
	let tokenConf = JSON.parse(fs.readFileSync('./conf/testToken.json'));

	return deployer.deploy(
		TokenContract,
		tokenConf.initialAmount,
		tokenConf.tokenName,
		tokenConf.decimalUnits,
		tokenConf.tokenSymbol
	)
	.then(() => TokenContract.deployed())
	.then((token) => deployer.deploy(VotingContract, token));
};