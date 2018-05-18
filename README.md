# Partial-Lock Commit-Reveal Voting
[ ![Codeship Status for ConsenSys/PLCRVoting](https://app.codeship.com/projects/e58babc0-7647-0135-1b40-3a2518fac0ae/status?branch=master)](https://app.codeship.com/projects/244454)

PLCRVoting is an Ethereum smart contract used as a platform for token-weight voting on a blockchain. 

## quickstart: core steps (& pseudocode)

1. acquire voting contract's intrinsic token

1. `token.approve(voting)`: approve the voting contract, setting an allowance and enabling ERC20 transactions with the voting contract

1. `plcr.requestVotingRights(tokens)`: transfer tokens to the voting contract. in order to be able to lock and unlock tokens during periods, the voting contract must have control over voting tokens

1. `plcr.commitVote(poll, secret, tokens)`: commit tokens and a secret hash that "hides" the vote choice to a poll. tokens are "locked" (not-withdrawable) until the commit period ends

1. `plcr.revealVote(poll, keys)`: reveal the hidden contents of a committed vote. this confirms the secret commit's validity, effectively announcing the voter's choice, and increasing the number of total votes toward that choice.

1. `tcr.claimReward(poll, key)`: claim reward tokens for voting with the winning side (the majority bloc of voters for that poll's ruling)

## core terminology

**voting rights**: tokens that are being controlled by the voting contract. not a part of your account's balance anymore. non-withdrawable; however, you are able to and are highly encouraged to use those same "locked" tokens to vote in multiple polls at the same time (hence "partial-lock")

**commit-reveal voting**: voting that takes place using 2 separate chronologic time periods

- **commit stage**: time period where user can submit secret vote & lock tokens along with the vote
- **reveal stage**: time period where user can unlock their secret vote, confirming the vote's token-weight and option

**votesFor** / **votesAgainst**: vote resolution is binary (1/0, or "for"/"against"). semantically they reference the Candidate i.e. `votesFor` represent tokens voted in **support** for the candidate, while `votesAgainst` represent tokens voted in **opposition** to the candidate

---

## Tools, tips, strategies, idiosyncrasies

#### Forgot to reveal and locked your tokens?

- if you do not reveal a committed vote (perhaps by forgetting to send the transaction or by losing the secret vote contents) you can still retrieve/rescue those tokens which are locked by invoking `plcr.rescueTokens()`. those tokens will not count toward the poll's outcome, as the reveal period must have ended by this point to proceed. they are unlocked and made available to be withdrawn if/when you desire to do so.

#### Save money & time when curating in multiple polls at a time

- PLCRVoting v1.1 supports multi-commit and multi-reveal. if you have more than 1 poll you wish to commit/reveal for, you can save money and time by consolidating the values of the multiple transactions and send the consolidated data

---

## DEPRECATED BELOW THIS SECTION

---

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
