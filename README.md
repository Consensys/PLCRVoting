# Partial-Lock Commit-Reveal Voting
[ ![Codeship Status for ConsenSys/PLCRVoting](https://app.codeship.com/projects/e58babc0-7647-0135-1b40-3a2518fac0ae/status?branch=master)](https://app.codeship.com/projects/244454)

## Summary

Smart contract for voting on the Ethereum blockchain

* <b>Trustless</b> platform ensures only properly cast votes are counted.
* <b>Secure</b> token-weighting mechanism prevents the same tokens from being used by different users in the same poll.
* <b>Unbiased</b> voting allows for users to vote without being able to see the votes of others, removing groupthink and implicit biases.

## The Voting Process

### Poll

#### Start Poll
The process begins with a poll, which only the contract owner can create, centered upon some proposal. The proposal can be anything, but for now we will use the following as our proposal: "John gets employee of the month." So in the most basic sense, users vote either for or against the proposal. In this case, people vote for or against John getting the employee of the month award.

### Submitting Votes

The submission of a vote to a given poll is separated into two stages: the commit stage and the reveal stage. The commit stage is when a user locks some number of their tokens and associates those tokens with a given vote. The reveal stage is comprised of unlocking those tokens and counting those tokens either for or against the poll. The separation of voting into these two stages prevents potential voters from being swayed by the votes of others and prevents two different entities from voting with the same tokens.

#### Commit

The commit stage is the period during which any user who would like to vote in a poll can send (1) the hash of their vote (which is yes or no) and some salt (which is an arbitrary number that the user chooses) and (2) the number of tokens they want to commit to that vote. The number of tokens that are committed with a user's vote is equal to the number of tokens that will be locked from that moment until the poll ends. When tokens are locked, that means that those tokens can not be withdrawn until they are unlocked. 

#### Reveal

The reveal stage is the period during which any user who has committed to a poll can have their commited vote count in the poll. A user who has committed a vote must call reveal on the contract and must pass in the vote that he/she committed and the salt that was used in computing the commit hash. This forces anonymity because a given user's vote is only counted if his/her revealed vote, which is public, is the same as his/her committed vote, which is anonymized (i.e. the committed vote is a hash computed with a salt that only the user knows, so somebody can only compute that hash if they know both the user's vote and the user's salt). When a vote is revealed, all tokens associated with that vote are unlocked (i.e. can be withdrawn if they are not also locked in some other poll).

#### Poll Ended

Once the reveal stage of a poll finishes, all voting for the poll has finished. All tokens that were  At this point, anybody can check what the results of the poll are. Also, one can check how many tokens in agreement with the poll outcome one were committed by a given address. This is useful if some outside entity wanted to issue rewards or incentives to those who vote in agreement with the poll outcome. 


# API

## Reference

PLCRVoting
* [Constructor](#plcrvoting)
* [Token Interface](#token-interface)
    * [requestVotingRights](#requestvotingrights)
    * [withdrawVotingRights](#withdrawvotingrights)
    * [rescueTokens](#rescuetokens)
    * [getLockedTokens](getlockedtokens)
* [Voting Interface](#voting-interface)
    * [startPoll](#startpoll)
    * [isPassed](#ispassed)
## Constructor

### PLCRVoting
```jsx
address tokenAddr = 0xABC;
PLCRVoting plcr = new PLCRVoting(tokenAddr);
```

Constructs PLCR scheme to use ERC20 token deployed at `tokenAddr`

## Token Interface

### requestVotingRights

```jsx
uint numTokens = 100;
plcr.requestVotingRights(numTokens);
``` 
   
Exchanges `numTokens` ERC20 tokens for `numTokens` voting rights

### withdrawVotingRights

```jsx
uint numTokens = 100;
plcr.withdrawVotingRights(numTokens);
``` 
   
Withdraws `numTokens` voting rights back to `numTokens` ERC20 tokens

### rescueTokens

```jsx
uint pollID = 777;
plcr.rescueTokens(pollID);
```

Rescues by unlocking votes committed to poll labelled by `pollID` that were never revealed
* requires that the poll labelled by `pollID` has ended

## Voting Interface

### commitVote

```jsx
uint choice = 1;
uint randromSalt = 54321;
bytes32 secretHash = sha3(choice, randomSalt);
uint pollID = 777;
uint prevID = 555;
uint numTokens = 100;
plcr.commitVote(pollID, secretHash, numTokens, prevID);
```
   
Commits `numTokens` votes to poll labelled with `pollID` for choice hidden beneath `secretHash`
* requires that the committed tokens at poll labelled with `prevID` < `numTokens` < the committed tokens at `nextID` (computed within by getting next of `prevID`)
* requires that the poll labelled by `pollID` is in the configured commit period

### revealVote

```jsx
uint pollID = 777;
uint salt = randomSalt;
uint voteOption = choice;
plcr.revealVote(pollID, salt, voteOption);
```

Attributes `numTokens` votes for option `voteOption` committed to poll labelled by `pollID`, and unlocks these votes for withdrawal
* requires that `salt` and `voteOption` match salt and choice used to generate committed `secretHash`
* requires that the poll labelled by `pollID` is in the configured reveal period

## Polling Interface

### startPoll

```jsx
uint quorum = 50;
uint commitDuration = 100;
uint revealDuration = 100;
uint pollID = plcr.startPoll(quorum, commitDuration, revealDuration);
```

Generates a poll labelled by `pollID` requiring a percentage majority of `quorum` configuring `commitDuration` and `revealDuration`
* requires that the `msg.sender` is the deployer (owner) of the `plcr` instance

### isPassed

```jsx
uint pollID = 777;
plcr.isPassed(pollID);
```

Indicates whether a poll labelled by `pollID` has been approved
* requires that the poll labelled by `pollID` has ended
