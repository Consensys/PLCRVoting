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

    plcr.token.transfer(msg.sender, _supply);

    plcr.plcr.init(plcr.token);

    emit newPLCR(plcr.creator, plcr.token, plcr.plcr);

    return plcr.plcr;
  }
}

