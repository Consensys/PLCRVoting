/* global artifacts */

const HumanStandardToken = artifacts.require('./HumanStandardToken.sol');
const PLCRVoting = artifacts.require('./PLCRVoting.sol');

const abi = require('ethereumjs-abi');
const HttpProvider = require('ethjs-provider-http');
const EthQuery = require('ethjs-query');
const EthRPC = require('ethjs-rpc');

const ethRPC = new EthRPC(new HttpProvider('http://localhost:8545'));
const ethQuery = new EthQuery(new HttpProvider('http://localhost:8545'));

const utils = {
  // returns the solidity-sha3 output for VoteMap indexing
  createIndexHash(account, pollID, atr) {
    const hash = `0x${abi.soliditySHA3(['address', 'uint', 'string'],
      [account, pollID, atr]).toString('hex')}`;
    return hash;
  },

  // returns the solidity-sha3 output for vote hashing
  createVoteHash(vote, salt) {
    const hash = `0x${abi.soliditySHA3(['uint', 'uint'],
      [vote, salt]).toString('hex')}`;
    return hash;
  },

  // returns block timestamp
  getBlockTimestamp() {
    return ethQuery.blockNumber()
      .then(num => ethQuery.getBlockByNumber(num, true))
      .then(block => block.timestamp.toString(10));
  },

  // returns Token instance
  getERC20Token() {
    return this.getVoteContract()
      .then(vote => vote.token.call())
      .then(tokenAddr => HumanStandardToken.at(tokenAddr));
  },

  // returns poll instance
  getPoll(pollID) {
    return this.getVoteContract()
      .then(instance => instance.pollMap.call(pollID));
  },

  // returns deployed vote contract
  getVoteContract() {
    return PLCRVoting.deployed();
  },

  // increases time
  increaseTime(seconds) {
    return new Promise((resolve, reject) => ethRPC.sendAsync({
      method: 'evm_increaseTime',
      params: [seconds],
    }, (err) => {
      if (err) reject(err);
      resolve();
    }))
      .then(() => new Promise((resolve, reject) => ethRPC.sendAsync({
        method: 'evm_mine',
        params: [],
      }, (err) => {
        if (err) reject(err);
        resolve();
      })));
  },

  // launches poll and returns pollID as string
  launchPoll(proposal, commitDuration, revealDuration) {
    return this.getVoteContract()
      .then(vote => vote.startPoll(0, commitDuration, revealDuration))
      .then(result => result.logs[0].args.pollID.toString());
  },

};

module.exports = utils;

