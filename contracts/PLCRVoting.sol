pragma solidity ^0.4.8;

import "./HumanStandardToken.sol";

contract PLCRVoting {
  
  struct Poll {
    uint commitEndDate;     /// expiration date of commit period for 
    uint revealEndDate;     /// expiration date of reveal period for 
    uint voteQuota;         /// snapshot of canonical voteQ
    uint votesFor;          /// tally of votes supporting prop
    uint votesAgainst;      /// tally of votes countering proposal
  }
  // maps pollID to Poll struct
  mapping(uint => Poll) public pollMap; 

  /// maps user's address to voteToken balance
  mapping(address => uint) public voteTokenBalance;

  HumanStandardToken public token;

  // represent a double linked list through mapping
  // sha3(userAddress, pollID, "prevID") => byte32 prevID
  // sha3(userAddress, pollID, "nextID") => byte32 nextID
  // sha3(userAddress, pollID, "numTokens") => byte32 numTokens
  // sha3(userAddress, pollID, "commitHash") => byte32 commitHash
  mapping(bytes32 => uint) public voteMap;  

  uint commitDuration;      /// length of commit period
  uint revealDuration;      /// length of reveal period
  uint voteQuota;           /// type of majority necessary for winning poll
  address[] trusted;        /// list of trusted addresses

  function PLCRVoting(address tokenAddr) {
    token = HumanStandardToken(tokenAddr);
  }

  /// interface for users to purchase votingTokens by exchanging ERC20 token
  function loadTokens(uint numTokens) {
    require(token.balanceOf(msg.sender) >= numTokens);
    require(token.transferFrom(msg.sender, this, numTokens));
    voteTokenBalance[msg.sender] += numTokens;
  }

  /// interface for users to withdraw votingTokens and exchange for ERC20 token
  function withdrawTokens(uint numTokens) {
    uint availableTokens = voteTokenBalance[msg.sender] - getMaxVoted(msg.sender);
    require(availableTokens >= numTokens);
    require(token.transfer(msg.sender, numTokens));
    voteTokenBalance[msg.sender] -= numTokens;
  }
  
  // insert to double-linked-list given that the prevID is valid
  function insertToDll(uint pollID, uint prevID, uint numTokens, bytes32 commitHash){
    uint nextID = uint(getAttribute(prevID, "nextID"));

    // make nextNode.prev point to newNode
    setAttribute(nextID, "prevID", pollID);

    // make prevNode.next point to newNode
    setAttribute(prevID, "nextID", pollID);

    // make newNode point to next and prev 
    setAttribute(pollID, "prevID", prevID); 
    setAttribute(pollID, "nextID", nextID); 

    // set properties of newNode
    setAttribute(pollID, "numTokens", numTokens);
    setAttribute(pollID, "commitHash", uint(commitHash));
  }

  /*
   *  Helper Functions
   */
 
  // get any attribute that is not commitHash
  function getAttribute(uint pollID, string attrName) returns (uint) {
    return voteMap[sha3(msg.sender, pollID, attrName)];
  }

  function getCommitHash(uint pollID) returns (bytes32) {
    return bytes32(voteMap[sha3(msg.sender, pollID, 'commitHash')]);
  }

  function setAttribute(uint pollID, string attrName, uint attrVal) {
    voteMap[sha3(msg.sender, pollID, attrName)] = attrVal;
  }

  function getMaxVoted(address user) returns (uint) {
    user = user;
    return 0; //just for testing
  }
}
