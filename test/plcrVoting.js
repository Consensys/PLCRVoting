/* eslint-env mocha */
/* global contract assert */

const BN = require('bn.js');
const utils = require('./utils.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: requestVotingRights', () => {
    const [alice, bob] = accounts;

    it('should grant voting rights for 10 tokens', async () => {
      const plcr = await utils.getPLCRInstance();
      await utils.as(alice, plcr.requestVotingRights, 10);
      const voteTokenBalance = await plcr.voteTokenBalance.call(alice);
      assert.strictEqual(voteTokenBalance.toNumber(10), 10,
        'Voting rights were not properly assigned');
    });

    it('should grant voting rights for 25 more tokens', async () => {
      const plcr = await utils.getPLCRInstance();
      await utils.as(alice, plcr.requestVotingRights, 25);
      const voteTokenBalance = await plcr.voteTokenBalance.call(alice);
      assert.strictEqual(voteTokenBalance.toNumber(10), 35,
        'Voting rights were not properly assigned');
    });

    it('should not grant voting rights for more tokens than the user has', async () => {
      const plcr = await utils.getPLCRInstance();
      const errMsg = 'Alice was able to acquire more voting rights than she has tokens';
      try {
        await utils.as(alice, plcr.requestVotingRights, 200);
        assert(false, errMsg);
      } catch (err) {
        assert(utils.isEVMException, err);
        const voteTokenBalance = await plcr.voteTokenBalance.call(alice);
        assert.strictEqual(voteTokenBalance.toNumber(10), 35, errMsg);
      }
    });

    it('should not grant voting rights for more tokens than the user has approved ' +
       'plcr for', async () => {
      const plcr = await utils.getPLCRInstance();
      const errMsg = 'Bob was able to acquire more voting rights than he had approved the PLCR for';
      try {
        await utils.as(bob, plcr.requestVotingRights, 95);
        assert(false, errMsg);
      } catch (err) {
        assert(utils.isEVMException, err);
        const voteTokenBalance = await plcr.voteTokenBalance.call(bob);
        assert.strictEqual(voteTokenBalance.toNumber(10), 0, errMsg);
      }
    });
  });
});

contract('PLCRVoting', (accounts) => {
  describe('Function: withdrawVotingRights', () => {
    const [alice] = accounts;

    it('should withdraw voting rights for 10 tokens', async () => {
      const plcr = await utils.getPLCRInstance();
      await utils.as(alice, plcr.requestVotingRights, 11);
      await utils.as(alice, plcr.withdrawVotingRights, 10);
      const voteTokenBalance = await plcr.voteTokenBalance.call(alice);
      assert.strictEqual(voteTokenBalance.toNumber(10), 1,
        'Alice could not withdraw voting rights');
    });

    it('should fail when the user requests to withdraw more tokens than are available to them',
      async () => {
        const plcr = await utils.getPLCRInstance();
        const errMsg = 'Alice was able to withdraw more voting rights than she should have had';
        try {
          await utils.as(alice, plcr.withdrawVotingRights, 10);
          assert(false, errMsg);
        } catch (err) {
          assert(utils.isEVMException(err), err);
        }
        const voteTokenBalance = await plcr.voteTokenBalance.call(alice);
        assert.strictEqual(voteTokenBalance.toNumber(10), 1, errMsg);
      });

    it('should withdraw voting rights for all remaining tokens', async () => {
      const plcr = await utils.getPLCRInstance();
      await utils.as(alice, plcr.withdrawVotingRights, 1);
      const voteTokenBalance = await plcr.voteTokenBalance.call(alice);
      assert.strictEqual(voteTokenBalance.toNumber(10), 0,
        'Alice has voting rights when she should have none');
    });
  });
});

contract('PLCRVoting', (accounts) => {
  describe('Function: rescueTokens', () => {
    const [alice, bob] = accounts;

    it('should enable the user to withdraw tokens they committed but did not reveal after ' +
      'a poll has ended', async () => {
      const plcr = await utils.getPLCRInstance();
      const token = await utils.getERC20Token();

      const startingBalance = await token.balanceOf.call(alice);
      await utils.as(alice, plcr.requestVotingRights, 50);
      const receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      const pollID = utils.getPollIDFromReceipt(receipt);
      const secretHash = utils.createVoteHash(1, 420);
      await utils.as(alice, plcr.commitVote, pollID, secretHash, 50, 0);
      await utils.increaseTime(201);
      await utils.as(alice, plcr.rescueTokens, pollID);
      await utils.as(alice, plcr.withdrawVotingRights, 50);
      const finalBalance = await token.balanceOf.call(alice);
      assert.strictEqual(finalBalance.toString(10), startingBalance.toString(10),
        'Alice was not able to rescue unrevealed tokens for a poll which had ended');
    });

    it('should not allow users to withdraw tokens they committed before a poll has ended',
      async () => {
        const plcr = await utils.getPLCRInstance();
        const token = await utils.getERC20Token();
        const errMsg = 'Bob was able to withdraw unrevealed tokens before a poll ended';

        const startingBalance = await token.balanceOf.call(bob);
        await utils.as(bob, plcr.requestVotingRights, 50);
        const receipt = await utils.as(bob, plcr.startPoll, 50, 100, 100);
        const pollID = utils.getPollIDFromReceipt(receipt);
        const secretHash = utils.createVoteHash(1, 420);
        await utils.as(bob, plcr.commitVote, pollID, secretHash, 50, 0);
        await utils.increaseTime(150);
        try {
          await utils.as(bob, plcr.rescueTokens, pollID);
          assert(false, errMsg);
        } catch (err) {
          assert(utils.isEVMException(err), err.toString());
        }
        try {
          await utils.as(bob, plcr.withdrawVotingRights, 50);
          assert(false, errMsg);
        } catch (err) {
          assert(utils.isEVMException(err), err.toString());
        }
        const finalBalance = await token.balanceOf.call(bob);
        assert.strictEqual(finalBalance.toString(10),
          startingBalance.sub(new BN('50', 10)).toString(10), errMsg);
      });
  });
});

contract('PLCRVoting', (accounts) => {
  describe('Function: commitVote', () => {
    const [alice, bob] = accounts;

    it('should commit a vote for a poll', async () => {
      const plcr = await utils.getPLCRInstance();

      await utils.as(alice, plcr.requestVotingRights, 50);
      const pollID = await utils.as(alice, utils.launchPoll, 50, 100, 100);
      const secretHash = utils.createVoteHash(1, 420);
      await utils.as(alice, plcr.commitVote, pollID, secretHash, 50, 0);
      const storedHash = await plcr.getCommitHash.call(alice, pollID.toNumber(10));

      assert.strictEqual(storedHash, secretHash, 'The secretHash was not stored properly');
    });

    it('should update a commit for a poll by changing the secretHash', async () => {
      const plcr = await utils.getPLCRInstance();
      const errMsg = 'Alice was not able to update her commit';
      const pollID = 1;

      const originalHash = await plcr.getCommitHash.call(alice, pollID);
      const secretHash = utils.createVoteHash(0, 420);
      await utils.as(alice, plcr.commitVote, pollID, secretHash, 50, 0);
      const storedHash = await plcr.getCommitHash.call(alice, pollID);

      assert.notEqual(originalHash, storedHash, errMsg);
      assert.strictEqual(storedHash, secretHash, errMsg);
    });

    it('should not allow a user to commit in a poll for which the commit period has ended',
      async () => {
        const plcr = await utils.getPLCRInstance();
        const pollID = 1;
        const errMsg = 'Alice was able to commit to a poll after its commit period ended';

        await utils.increaseTime(101);

        const originalHash = await plcr.getCommitHash.call(alice, pollID);
        const secretHash = utils.createVoteHash(1, 420);
        try {
          await utils.as(alice, plcr.commitVote, pollID, secretHash, 50, 0);
          assert(false, errMsg);
        } catch (err) {
          assert(utils.isEVMException(err), err.toString());
        }
        const storedHash = await plcr.getCommitHash.call(alice, pollID);

        assert.strictEqual(storedHash, originalHash, errMsg);
      });

    it('should not allow a user to commit for a poll which does not exist', async () => {
      const plcr = await utils.getPLCRInstance();
      const errMsg = 'Alice was able to commit to a poll which does not exist';

      await utils.as(alice, plcr.requestVotingRights, 40);
      const secretHash = utils.createVoteHash(1, 420);
      try {
        await utils.as(alice, plcr.commitVote, 0, secretHash, 20, 1);
        assert(false, errMsg);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
      }

      try {
        await utils.as(alice, plcr.commitVote, 1, secretHash, 20, 1);
        assert(false, errMsg);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
      }

      const tokensCommitted = await plcr.getLockedTokens.call(alice);
      assert.strictEqual(tokensCommitted.toNumber(10), 50, errMsg);
    });

    it('should update a commit for a poll by changing the numTokens, and allow the user to ' +
       'withdraw all their tokens when the poll ends', async () => {
      const plcr = await utils.getPLCRInstance();
      const token = await utils.getERC20Token();

      const startingBalance = await token.balanceOf.call(bob);
      await utils.as(bob, plcr.requestVotingRights, 50);
      const receipt = await utils.as(bob, plcr.startPoll, 50, 100, 100);
      const pollID = utils.getPollIDFromReceipt(receipt);
      const secretHash = utils.createVoteHash(1, 420);
      await utils.as(bob, plcr.commitVote, pollID, secretHash, 10, 0);
      await utils.as(bob, plcr.commitVote, pollID, secretHash, 20, 1);

      await utils.increaseTime(101);

      await utils.as(bob, plcr.revealVote, pollID, 1, 420);

      await utils.as(bob, plcr.withdrawVotingRights, 50);

      const finalBalance = await token.balanceOf.call(bob);
      assert.strictEqual(startingBalance.toString(10), finalBalance.toString(10),
        'Bob locked tokens by changing his commit');
    });
  });
});

contract('PLCRVoting', (accounts) => {
  describe('Function: validPosition', () => {
    const [alice] = accounts;

    it('should affirm that a position is valid', async () => {
      const plcr = await utils.getPLCRInstance();
      const errMsg = 'Did not get proper insertion point';

      await utils.as(alice, plcr.requestVotingRights, 50);

      const receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      const pollID = utils.getPollIDFromReceipt(receipt);
      const secretHash = utils.createVoteHash(1, 420);
      const numTokens = 1;
      const insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens);
      assert(insertPoint.toString(10), '0', errMsg); // after root
      await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);
    });

    it('should reject a position that is not valid', async () => {
      const plcr = await utils.getPLCRInstance();

      const receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      const pollID = utils.getPollIDFromReceipt(receipt);
      const secretHash = utils.createVoteHash(1, 420);
      const numTokens = 10;
      try {
        await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, 0);
        assert(false, 'Alice was able to unsort her DLL');
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
      }
    });
  });
});

contract('PLCRVoting', () => {
  describe('Function: revealVote', () => {
    it('should reveal a vote for a poll');
    it('should fail if the user has already revealed for this poll');
    it('should fail if the provided salt or hash do not match those committed');
    it('should fail if the reveal period is not active or the poll has ended');
    it('should fail for polls which do not exist');
  });
});

contract('PLCRVoting', () => {
  describe('Function: getNumPassingTokens', () => {
    it('should return the number of tokens a voter committed in the winning bloc for a poll');
    it('should fail if the poll queried has not yet ended');
    it('should fail if the voter queried has not yer revealed');
    it('should return 0 if the queried tokens were committed to the minority bloc');
  });
});

contract('PLCRVoting', () => {
  describe('Function: startPoll', () => {
    it('should return a poll with ID 1 for the first poll created');
    it('should return a poll with ID 5 for the fifth poll created');
    it('should create a poll with a 50% vote quorum and 100 second commit/reveal durations');
    it('should create a poll with a 60% vote quorum, a 100 second commit duration and ' +
       'a 200 second reveal duration');
  });
});

contract('PLCRVoting', () => {
  describe('Function: isPassed', () => {
    it('should return true if the poll passed');
    it('should return false if the poll ended in a tie');
    it('should return false if the poll did not pass');
  });
});

contract('PLCRVoting', () => {
  describe('Function: getTotalNumberOfTokensForWinningOption', () => {
    it('should return the total number of votes for if the poll passed');
    it('should return the total number of votes against if the poll did not pass');
    it('should fail if the poll has not yet ended');
  });
});

contract('PLCRVoting', () => {
  describe('Function: pollEnded', () => {
    it('should return true if the poll has ended');
    it('should return false if the poll has not ended');
  });
});

contract('PLCRVoting', () => {
  describe('Function: commitPeriodActive', () => {
    it('should return true if the commit period is active');
    it('should return false if the commit period is not active');
  });
});

contract('PLCRVoting', () => {
  describe('Function: revealPeriodActive', () => {
    it('should return true if the reveal period is active');
    it('should return false if the reveal period is not active');
  });
});

contract('PLCRVoting', () => {
  describe('Function: hasBeenRevealed', () => {
    it('should return true if the user has already revealed for this poll');
    it('should return false if the user has not revealed for this poll');
  });
});

contract('PLCRVoting', () => {
  describe('Function: getCommitHash', () => {
    it('should return the commit hash stored by the voter for some pollID');
    it('should fail if the user has not stored any commit hash for some pollID');
  });
});

contract('PLCRVoting', () => {
  describe('Function: getNumTokens', () => {
    it('should return the number of tokens committed by the voter for some pollID');
  });
});

contract('PLCRVoting', () => {
  describe('Function: getLastNode', () => {
    it('should return the poll for which the user has the greatest number of tokens committed');
  });
});

contract('PLCRVoting', () => {
  describe('Function: getLockedTokens', () => {
    it('should return the number of tokens the user has locked in polls');
  });
});

contract('PLCRVoting', (accounts) => {
  describe('Function: getInsertPointForNumTokens', () => {
    const [alice] = accounts;

    it('should return the correct insert point for a new node in a DLL', async () => {
      // Create { A: 1, B: 5, C: 10 }
      // Then insert { A: 1, D: 3, B: 5, C: 10 }
      // And then { A: 1, D: 3, B: 5, E: 7, C: 10 }
      const plcr = await utils.getPLCRInstance();
      const errMsg = 'Did not get proper insertion point';

      await utils.as(alice, plcr.requestVotingRights, 50);

      let receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      let pollID = utils.getPollIDFromReceipt(receipt);
      let secretHash = utils.createVoteHash(1, 420);
      let numTokens = 1;
      let insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens);
      assert(insertPoint.toString(10), '0', errMsg); // after root
      await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);

      // { A: 1 }

      receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      pollID = utils.getPollIDFromReceipt(receipt);
      secretHash = utils.createVoteHash(1, 420);
      numTokens = 5;
      insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens);
      assert(insertPoint.toString(10), '1', errMsg); // after A
      await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);

      // { A: 1, B: 5 }

      receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      pollID = utils.getPollIDFromReceipt(receipt);
      secretHash = utils.createVoteHash(1, 420);
      numTokens = 10;
      insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens);
      assert(insertPoint.toString(10), '2', errMsg); // after B
      await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);

      // { A: 1, B: 5, C: 10 }

      receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      pollID = utils.getPollIDFromReceipt(receipt);
      secretHash = utils.createVoteHash(1, 420);
      numTokens = 3;
      insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens);
      assert(insertPoint.toString(10), '1', errMsg); // after A 
      await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);

      // { A: 1, D: 3, B: 5, C: 10 }

      receipt = await utils.as(alice, plcr.startPoll, 50, 100, 100);
      pollID = utils.getPollIDFromReceipt(receipt);
      secretHash = utils.createVoteHash(1, 420);
      numTokens = 7;
      insertPoint = await plcr.getInsertPointForNumTokens.call(alice, numTokens);
      assert(insertPoint.toString(10), '2', errMsg); // after B 
      await utils.as(alice, plcr.commitVote, pollID, secretHash, numTokens, insertPoint);

      // { A: 1, D: 3, B: 5, E: 7, C: 10 }
    });
  });
});

contract('PLCRVoting', () => {
  describe('Function: isExpired', () => {
    it('should return true if the provided timestamp is greater than the current block timestamp');
    it('should return false if the provided timestamp is less than the current block timestamp');
  });
});

contract('PLCRVoting', () => {
  describe('Function: attrUUID', () => {
    it('should generate a sha3 hash of the provided values');
  });
});

