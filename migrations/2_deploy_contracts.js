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

async function multipleDistributeAndAllow(owner, userArray, spender, amountsArray, numUsers){
        let newUserArray = userArray.slice(0, numUsers); 

        return await Promise.all(newUserArray.map(async (user, index) => {
            await distributeAndAllow(owner, user, spender, amountsArray[index])
        }));
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
        .then(() => multipleDistributeAndAllow(owner, users, VotingContract.address, tokenConf.userAmounts, 7));
};
