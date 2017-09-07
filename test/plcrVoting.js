/* eslint-env mocha */
/* global contract assert */


const utils = require('./utils.js');

contract('PLCRVoting', (accounts) => {
  describe('Function: requestVotingRights', async () => {
    const plcr = await utils.getPLCRInstance();
    const [alice, bob] = accounts;

    it('should grant voting rights for 10 tokens', async () => {
      await utils.as(alice, plcr.requestVotingRights, 10);
      const voteTokenBalance = await plcr.voteTokenBalance.call(alice);
      assert.strictEqual(voteTokenBalance.toNumber(10), 10,
        'Voting rights were not properly assigned');
    });

    it('should grant voting rights for 25 more tokens', async () => {
      await utils.as(alice, plcr.requestVotingRights, 25);
      const voteTokenBalance = await plcr.voteTokenBalance.call(alice);
      assert.strictEqual(voteTokenBalance.toNumber(10), 35,
        'Voting rights were not properly assigned');
    });

    it('should not grant voting rights for more tokens than the user has', async () => {
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
  describe('Function: withdrawVotingRights', async () => {
    const plcr = await utils.getPLCRInstance();
    const [alice] = accounts;

    it('should withdraw voting rights for 10 tokens', async () => {
      await utils.as(alice, plcr.requestVotingRights, 11);
      await utils.as(alice, plcr.withdrawVotingRights, 10);
      const voteTokenBalance = await plcr.voteTokenBalance.call(alice);
      assert.strictEqual(voteTokenBalance.toNumber(10), 1,
        'Alice could not withdraw voting rights');
    });

    it('should withdraw voting rights for all remaining tokens');
    it('should fail when the user requests to withdraw more tokens than are available to them');
  });
});

contract('PLCRVoting', () => {
  describe('Function: rescueTokens', () => {
    it('should enable the user to withdraw tokens they committed but did not reveal after ' +
       'a poll has ended');
    it('should not allow users to withdraw tokens they committed before a poll has ended');
  });
});

contract('PLCRVoting', () => {
  describe('Function: commitVote', () => {
    it('should commit a vote for a poll');
    it('should update a commit for a poll');
    it('should not allow a user to commit in a poll for which the commit period has ended');
    it('should not allow a user to commit for a poll which does not exist');
  });
});

contract('PLCRVoting', () => {
  describe('Function: validPosition', () => {
    it('should affirm that a position is valid');
    it('should reject a position that is valid');
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

