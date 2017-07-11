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

function transfer(recipient, sender, amount) {
	return getERC20Token()
	.then((token) => token.transfer(recipient, amount, {from: sender}));
}

function approve(spender, holder, amount) {
	return getERC20Token()
	.then((token) => token.approve(spender, amount, {from: holder}));
}

function distributeAndAllow(origin, actor, spender, amount) {
	return transfer(actor, origin, amount)
	.then(() => approve(spender, actor, amount));
}

module.exports = (deployer, network, accounts) => {
	const owner = accounts[0];
	const users = accounts.slice(1, 10);

	let tokenConf = JSON.parse(fs.readFileSync('./conf/testToken.json'));

	let tokenInstance;

	deployer.deploy(HumanStandardToken,
		tokenConf.initialAmount, 
		tokenConf.tokenName,
		tokenConf.decimalUnits,
		tokenConf.tokenSymbol
	)
	.then(() => deployer.deploy(VotingContract, HumanStandardToken.address))
	.then(() => distributeAndAllow(
		owner, users[0], VotingContract.address, tokenConf.userAmounts[0]
	))
	.then(() => distributeAndAllow(
		owner, users[1], VotingContract.address, tokenConf.userAmounts[1]
	))
	.then(() => distributeAndAllow(
		owner, users[2], VotingContract.address, tokenConf.userAmounts[2]
	))
	.then(() => distributeAndAllow(
		owner, users[3], VotingContract.address, tokenConf.userAmounts[3]
	))
	.then(() => distributeAndAllow(
		owner, users[4], VotingContract.address, tokenConf.userAmounts[4]
	))
	.then(() => distributeAndAllow(
		owner, users[5], VotingContract.address, tokenConf.userAmounts[5]
	))
	.then(() => distributeAndAllow(
		owner, users[6], VotingContract.address, tokenConf.userAmounts[6]
	));
};
