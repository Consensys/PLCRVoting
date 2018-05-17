pragma solidity ^0.4.20;

import "tokens/eip20/EIP20.sol";
import "./PLCRVoting.sol";
import "./ProxyFactory.sol";

contract PLCRFactory {

  event newPLCR(address creator, EIP20 token, address plcr);

  struct PLCR {
    address creator;
    EIP20 token;
    PLCRVoting plcr;
  }

  ProxyFactory proxyFactory;
  PLCRVoting canonizedPLCR;

  /// @dev constructor deploys a new canonical PLCRVoting contract and a proxyFactory.
  constructor() {
    canonizedPLCR = new PLCRVoting();
    proxyFactory = new ProxyFactory();
  }

  /*
  @dev deploys and initializes a new PLCRVoting contract that consumes a token at an address
  supplied by the user.
  @param _token an EIP20 token to be consumed by the new PLCR contract
  */
  function newPLCRBYOToken(EIP20 _token) public returns (PLCRVoting) {
    PLCR memory plcr = PLCR({
      creator: msg.sender,
      token: _token,
      plcr: PLCRVoting(proxyFactory.createProxy(canonizedPLCR, ""))
    });

    plcr.plcr.init(plcr.token);

    emit newPLCR(plcr.creator, plcr.token, plcr.plcr);

    return plcr.plcr;
  }
  
  /*
  @dev deploys and initializes a new PLCRVoting contract and an EIP20 to be consumed by the PLCR's
  initializer.
  @param _supply the total number of tokens to mint in the EIP20 contract
  @param _name the name of the new EIP20 token
  @param _decimals the decimal precision to be used in rendering balances in the EIP20 token
  @param _symbol the symbol of the new EIP20 token
  */
  function newPLCRWithToken(
    uint _supply,
    string _name,
    uint8 _decimals,
    string _symbol
  ) public returns (PLCRVoting) {
    PLCR memory plcr = PLCR({
      creator: msg.sender,
      token: new EIP20(_supply, _name, _decimals, _symbol),
      plcr: PLCRVoting(proxyFactory.createProxy(canonizedPLCR, ""))
    });

    plcr.plcr.init(plcr.token);

    // Give all the tokens to the PLCR creator
    plcr.token.transfer(plcr.creator, _supply);

    emit newPLCR(plcr.creator, plcr.token, plcr.plcr);

    return plcr.plcr;
  }
}

