// CONTRACTS:
const VotingContract = artifacts.require("./PLCRVoting.sol");
const HumanStandardToken = artifacts.require("./HumanStandardToken.sol");
const DLL = artifacts.require("./DLL.sol");
const AttributeStore = artifacts.require("./AttributeStore.sol");

// NODE VARS:
const fs = require("fs");

function getVoteContract() {
    return VotingContract.deployed();
}

function getERC20Token() {
    return getVoteContract()
        .then((vote) => vote.token.call())
        .then((tokenAddr) => HumanStandardToken.at(tokenAddr));
}

module.exports = (deployer, network, accounts) => {
    const owner = accounts[0];
    const users = accounts.slice(1, 10);

    let tokenConf = JSON.parse(fs.readFileSync('./conf/testToken.json'));

    // deploy libraries
    deployer.deploy(DLL);
    deployer.deploy(AttributeStore);

    // link libraries
    deployer.link(DLL, VotingContract);
    deployer.link(AttributeStore, VotingContract);

    // deploy the HumanStandardToken contract
    deployer.deploy(
    	HumanStandardToken,
        tokenConf.initialAmount, 
        tokenConf.tokenName,
        tokenConf.decimalUnits,
        tokenConf.tokenSymbol,
        {from: owner}
    )

    // deploy the PLCRVoting contract
    .then(() => deployer.deploy(
    	VotingContract, 
    	HumanStandardToken.address,
    	{from: owner}
    ))

    // distribute token 
    .then(async () => {
    	let token = await getERC20Token();

    	console.log("  Distributing tokens to users...");

    	return await Promise.all(
    		users.map(async (user, idx) => {
                if (tokenConf.userAmounts[idx] != 0){
        			await token.transfer(user, tokenConf.userAmounts[idx], {from: owner}) 
         			await token.approve(VotingContract.address, tokenConf.userAmounts[idx], {from: user})
                }
    		})
    	);
    });
};
