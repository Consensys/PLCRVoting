/* eslint-env mocha */
/* global contract assert artifacts */

const PLCRVoting = artifacts.require('./PLCRVoting.sol');
const PLCRFactory = artifacts.require('./PLCRFactory.sol');
const EIP20 = artifacts.require('tokens/eip20/EIP20.sol');

const utils = require('./utils.js');
const BN = require('bignumber.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: revealVote', () => {
    const [alice] = accounts;
    let plcr;
    let token;

    before(async () => {
      const plcrFactory = await PLCRFactory.deployed();
      const factoryReceipt = await plcrFactory.newPLCRWithToken('10000', 'TestToken', '0', 'TEST');
      plcr = PLCRVoting.at(factoryReceipt.logs[0].args.plcr);
      token = EIP20.at(factoryReceipt.logs[0].args.token);

      await Promise.all(
        accounts.map(async (user) => {
          await token.transfer(user, 1000);
          await token.approve(plcr.address, 1000, { from: user });
        }),
      );
    });

    it('should reveal a vote for a poll', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;

      const pollID = await utils.startPollAndCommitVote(options, plcr);

      await utils.increaseTime(new BN(options.commitPeriod, 10).add(new BN('1', 10)).toNumber(10));
      await utils.as(options.actor, plcr.revealVote, pollID, options.vote, options.salt);

      const votesFor = await utils.getVotesFor(pollID, plcr);
      const errMsg = 'votesFor should be equal to numTokens';
      assert.strictEqual(options.numTokens, votesFor.toString(10), errMsg);
    });

    it('should fail if the user has already revealed for some poll', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;

      const pollID = '1';

      try {
        await utils.as(alice, plcr.revealVote, pollID, options.vote, options.salt);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());

        const votesFor = await utils.getVotesFor(pollID, plcr);
        assert.strictEqual(options.numTokens, votesFor.toString(10),
          'votesFor should be equal to numTokens');
        return;
      }
      assert(false, 'the same vote was revealed twice');
    });

    it('should fail if the provided vote does not match that committed', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;

      const pollID = await utils.startPollAndCommitVote(options, plcr);
      await utils.increaseTime(new BN(options.commitPeriod, 10).add(new BN('1', 10)).toNumber(10));

      try {
        await utils.as(options.actor, plcr.revealVote, pollID, options.vote.concat('1'),
          options.salt);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false, 'should not have been able to reveal with a different vote option');
    });

    it('should fail if the provided salt does not match that committed', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;

      const pollID = await utils.startPollAndCommitVote(options, plcr);
      await utils.increaseTime(new BN(options.commitPeriod, 10).add(new BN('1', 10)).toNumber(10));

      try {
        await utils.as(options.actor, plcr.revealVote, pollID, options.vote,
          options.salt.concat('1'));
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false, 'should not have been able to reveal with a different salt');
    });

    it('should fail if the reveal period has not begun', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;

      const pollID = await utils.startPollAndCommitVote(options, plcr);

      try {
        await utils.as(alice, plcr.revealVote, pollID, options.vote, options.salt);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false, 'should not have been able to reveal early');
    });

    it('should fail if the reveal period has ended', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;

      const pollID = await utils.startPollAndCommitVote(options, plcr);
      await utils.increaseTime(new BN(options.commitPeriod, 10).toNumber(10));
      await utils.increaseTime(new BN(options.revealPeriod).add(new BN('1', 10)).toNumber(10));

      const pollEnded = await plcr.pollEnded.call(pollID, plcr);
      assert.strictEqual(pollEnded, true, 'poll should have ended.');

      try {
        await utils.as(alice, plcr.revealVote, pollID, options.vote, options.salt);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false, 'should not have been able to reveal after poll ended');
    });

    it('should fail for polls which do not exist', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;

      try {
        await utils.as(options.actor, plcr.revealVote, '420', options.vote, options.salt);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false, 'Should not have been able to reveal for a non-existant poll');
    });

    it('should revert if the voter has not commited a vote for the provided poll', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;

      const receipt = await utils.as(options.actor, plcr.startPoll, options.quorum,
        options.commitPeriod, options.revealPeriod);
      const pollID = utils.getPollIDFromReceipt(receipt);

      await utils.increaseTime(new BN(options.commitPeriod, 10).add(new BN('1', 10)).toNumber(10));

      try {
        await utils.as(options.actor, plcr.revealVote, pollID, options.vote, options.salt);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false, 'user was able to reveal a vote without commiting first');
    });

    it('should be able to reveal an against vote', async () => {
      const options = utils.defaultOptions();
      options.actor = alice;
      options.vote = '0';

      const pollID = await utils.startPollAndCommitVote(options, plcr);

      await utils.increaseTime(new BN(options.commitPeriod, 10).add(new BN('1', 10)).toNumber(10));
      await utils.as(options.actor, plcr.revealVote, pollID, options.vote, options.salt);

      const votesAgainst = await utils.getVotesAgainst(pollID, plcr);
      const errMsg = 'votesAgainst should be equal to numTokens';
      assert.strictEqual(options.numTokens, votesAgainst.toString(10), errMsg);
    });
  });
});

