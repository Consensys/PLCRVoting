// CONTRACTS:
const VotingContract = artifacts.require("./PLCRVoting.sol");
const HumanStandardToken = artifacts.require("./HumanStandardToken.sol");

// NODE VARS:
const fs = require(`fs`);

function getVoteContract() {
	return VotingContract.deployed();
}
	
function getERC20Token() {
	return getVoteContract()
	.then((vote) => vote.token.call())
	.then((tokenAddr) => HumanStandardToken.at(tokenAddr));
}

function transfer(recipient, amount, sender) {
	return getERC20Token()
	.then((token) => token.transfer(recipient, amount, {from: sender}));
}

function approve(spender, amount, holder) {
	return getERC20Token()
	.then((token) => token.approve(spender, amount, {from: holder}));
}

module.exports = (deployer, network, accounts) => {
	const owner = accounts[0];
	const users = accounts.slice(1, 4);

	let tokenConf = JSON.parse(fs.readFileSync('./conf/testToken.json'));

	let tokenInstance;

	deployer.deploy(HumanStandardToken,
		tokenConf.initialAmount, 
		tokenConf.tokenName,
		tokenConf.decimalUnits,
		tokenConf.tokenSymbol
	)
	.then(() => deployer.deploy(VotingContract, HumanStandardToken.address))
	.then(() => {
		for (var idx = 1; idx < users.length; idx++) {
			return transfer(users[idx], tokenConf.userAmounts[idx], owner)
			.then(() => getVoteContract())
			.then((vote) => approve(vote.address, tokenConf.userAmounts[idx], users[idx]));
		}
	});
	
};

