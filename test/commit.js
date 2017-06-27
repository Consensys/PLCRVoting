const VotingContract = artifacts.require("./PLCRVoting.sol");
const PLCRVoting = artifacts.require("./PLCRVoting.sol");
const HumanStandardToken = artifacts.require("./HumanStandardToken.sol");

/*
contract('Token Testing', (accounts) => {
        const [owner, user1, user2, user3] = accounts;

            function getVoteContract() {
                        return VotingContract.deployed();
                            }

                function getERC20Token() {
                            return getVoteContract()
            .then((vote) => vote.token.call())
            .then((tokenAddr) => HumanStandardToken.at(tokenAddr));
    }

                    it("should exchange 25 of user1's ERC20 for 25 voting tokens", () => {
                                return getVoteContract()
                                .then((vote) => vote.loadTokens(25, {from: user1}));
                        });
});
*/

contract('Voting', function(accounts) {
 
	const [owner, user1, user2, user3] = accounts;
	const tokenAmt = 10;


  
  it("validate node, empty double linked-list", function() {
        let voter;
	return VotingContract.deployed()
	.then(function(instance) {
            voter = instance;
            voter.loadTokens(10, {from: user1})
            //startPoll
            //instance.voteTokenBalance.call(owner)
        })
        .then(function () {
            return voter.startPoll("potato", 50);
        }).then(function () {
        
        });
  });
      
  it("validate node, single element double linked-list", function() {
	return PLCRVoting.deployed()
	.then(function(instance) {

	});
  });
  it("validate node, 5 elements double linked-list", function() {
	return PLCRVoting.deployed()
	.then(function(instance) {

	});
  });
  it("validate node, single node deleted from 5 elements double linked-list", function() {
	return PLCRVoting.deployed()
	.then(function(instance) {

	});
  });
  it("validate node, multiple nodes deleted from 5 elements double linked-list", function() {
	return PLCRVoting.deployed()
	.then(function(instance) {
		
	});
  });
  it("single commit to a single poll (commit period active)", function() {
  	var pollId;
    return PLCRVoting.deployed()
    .then(function(instance) {
    })
  });
  it("multiple commits to a single poll (commit period active)", function() {
	return PLCRVoting.deployed()
	.then(function(instance) {

	});
  });
  it("single commit to 2 polls (commit periods active)", function() {
	return PLCRVoting.deployed()
	.then(function(instance) {

	});
  });
  it("single commit to a single poll (commit period inactive)", function() {
	return PLCRVoting.deployed()
	.then(function(instance) {

	});
  });
  it("single commit to 3 polls (2 commit periods inactive)", function() {
	return PLCRVoting.deployed()
	.then(function(instance) {

	});
  });
  it("single commit, exceeded number of spendable tokens for address", function() {
	return PLCRVoting.deployed()
	.then(function(instance) {

	});
  });
});

var solidityVoteHasher = function (vote, salt) {
	return 0;
}

var solidityMapHasher = function (msgSender, pollId, attr) {
	return 0;
}
