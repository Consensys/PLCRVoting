const abi = require("ethereumjs-abi");
const HttpProvider = require('ethjs-provider-http');
const EthQuery = require('ethjs-query');
const ethQuery = new EthQuery(new HttpProvider('http://localhost:8545'));
const EthRPC = require('ethjs-rpc');
const ethRPC = new EthRPC(new HttpProvider('http://localhost:8545'));

const HumanStandardToken = artifacts.require("./HumanStandardToken.sol");
const PLCRVoting = artifacts.require("./PLCRVoting.sol");

module.exports = function() {

    // returns the solidity-sha3 output for VoteMap indexing
    this.createIndexHash = function(account, pollID, atr) {
        let hash = "0x" + abi.soliditySHA3([ "address", "uint", "string" ],
            [ account, pollID, atr ]).toString('hex'); 
        return hash;                                   
    }

    // returns the solidity-sha3 output for vote hashing
    this.createVoteHash = function(vote, salt) {
        let hash = "0x" + abi.soliditySHA3([ "uint", "uint" ],
            [ vote, salt ]).toString('hex'); 
        return hash;                                   
    }

    // returns block timestamp
    this.getBlockTimestamp = function() {
        return ethQuery.blockNumber()
            .then((num) => ethQuery.getBlockByNumber(num,true))
            .then((block) => block.timestamp.toString(10));
    }

    // returns Token instance
    this.getERC20Token = function() {
        return getVoteContract()
            .then((vote) => vote.token.call())
            .then((tokenAddr) => HumanStandardToken.at(tokenAddr));
    }

    // returns poll instance
    this.getPoll = function(pollID) {
        return getVoteContract()
            .then((instance) => instance.pollMap.call(pollID));
    }

    // returns deployed vote contract
    this.getVoteContract = function() {
        return PLCRVoting.deployed();
    }

    // increases time
    this.increaseTime = function(seconds) {
        return new Promise((resolve, reject) => { 
            return ethRPC.sendAsync({
                method: 'evm_increaseTime',
                params: [seconds]
            }, (err) => {
                if (err) reject(err)
                resolve()
            })
        })
            .then(() => {
                return new Promise((resolve, reject) => { 
                    return ethRPC.sendAsync({
                        method: 'evm_mine',
                        params: []
                    }, (err) => {
                        if (err) reject(err)
                        resolve()
                    })
                })
            })
    }

    // launches poll and returns pollID as string
    this.launchPoll = function(proposal, commitDuration, revealDuration) {
        return getVoteContract()
            .then((vote) => vote.startPoll(proposal, 50, commitDuration, revealDuration))
            .then((result) => result.logs[0].args.pollID.toString());
    }
}
