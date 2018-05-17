pragma solidity ^0.4.20;

import "tokens/eip20/EIP20.sol";
import "./PLCRVoting.sol";
import "./ProxyFactory.sol";

contract PLCRFactory {

  event newPLCR(address creator, EIP20 token, address plcr, uint plcrNonce);

  struct PLCR {
    address creator;
    EIP20 token;
    PLCRVoting plcr;
  }

  uint plcrNonce;

  ProxyFactory pf;
  PLCRVoting canonizedPLCR;

  mapping(uint => PLCR) public plcrs;

  constructor() {
    canonizedPLCR = new PLCRVoting();

    pf = new ProxyFactory();

    plcrNonce = 0;
  }

  function newPLCRBYOToken(EIP20 _token) public returns (uint) {
    PLCR storage plcr = plcrs[plcrNonce];

    plcr.creator = msg.sender;
    plcr.token = _token;

    plcr.plcr = PLCRVoting(pf.createProxy(canonizedPLCR, ""));
    plcr.plcr.init(_token);

    emit newPLCR(plcr.creator, plcr.token, plcr.plcr, plcrNonce);

    plcrNonce++;
    return plcrNonce - 1;
  }

  function newPLCRWithToken(
    uint _supply,
    string _name,
    uint8 _decimals,
    string _symbol
  ) public returns (uint) {
    PLCR storage plcr = plcrs[plcrNonce];

    plcr.creator = msg.sender;
    plcr.token = new EIP20(_supply, _name, _decimals, _symbol);
    plcr.token.transfer(msg.sender, _supply);

    plcr.plcr = PLCRVoting(pf.createProxy(canonizedPLCR, ""));
    plcr.plcr.init(plcr.token);

    emit newPLCR(plcr.creator, plcr.token, plcr.plcr, plcrNonce);

    plcrNonce++;
    return plcrNonce - 1;
  }
}

