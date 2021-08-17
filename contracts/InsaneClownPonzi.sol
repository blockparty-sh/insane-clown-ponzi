pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/// original ponzi implementation from adrianbarwicki
/// https://github.com/adrianbarwicki/eth-ponzi-fund
contract InsaneClownPonzi is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    address private _owner; // defi owner receives 5% of all deposits
    uint private _totalInvested; // how much people have funded icp
    mapping (address => uint) private _bchBalances; // what is available for withdrawal
    mapping (address => uint) private _clownPoints; // use clown points to claim clowns
    mapping (address => uint) private _invested; // how much initially invested
    address[] private _investors; // for help with iteration

    // this is set by an advanced defi bonding curve
    // it determines cost of clown to buy with clownPoints
    uint private _clownPrice = 1e16; // how much bch to create a clown

    // this is where clown icons reside like BASE_URI.id (concat)
    string constant BASE_URI = "ipfs whatever";

    constructor() ERC721("Insane Clown Ponzi", "ICP") {
        _owner = msg.sender;
    }

    event Deposit(address account,  uint amount);
    event Withdraw(address account, uint amount);

    receive() external payable
    {
        uint dividend = msg.value;
        uint totalFee = dividend / 10;
        dividend -= totalFee;

        if (_investors.length == 0) {
            _bchBalances[_owner] = msg.value;
            _clownPoints[_owner] = msg.value;
        } else {
            // half of fee goes to owner and half is distributed to clown holders
            // unless there are no clowns yet, then all fees go to owner
            if (totalSupply() == 0) {
                _bchBalances[_owner] += totalFee;
                _clownPoints[_owner] += totalFee;
            } else {
                uint ownerFee = totalFee / 2;
                uint totalClownFee = totalFee - ownerFee;

                _bchBalances[_owner] += ownerFee;
                _clownPoints[_owner] += ownerFee;

                uint rewardPerClown = totalClownFee / totalSupply();
                for (uint i = 0; i < totalSupply(); ++i) {
                    address clownOwner = ownerOf(i);

                    _bchBalances[clownOwner] += rewardPerClown;
                    _clownPoints[clownOwner] += rewardPerClown;
                }
            }
        }

        // distribute dividends
        for (uint i = 0; i < _investors.length; i++) {
            uint payment = dividend * _invested[_investors[i]] / _totalInvested;
           _bchBalances[_investors[i]] += payment;
           _clownPoints[_investors[i]] += payment;
        }

        // allow for iteration over invested
        if (_invested[msg.sender] == 0) {
            _investors.push(msg.sender);
        }

        _invested[msg.sender] += msg.value;

        _totalInvested += msg.value;

        emit Deposit(msg.sender, msg.value);
    }

    // this is where defi clown birth occurs
    function claimClowns() external {
        while (_clownPoints[msg.sender] > clownPrice) {
            _clownPoints[msg.sender] -= clownPrice;
            _clownPrice *= 1.0005; // advanced tokenomics bonding curve

            _tokenIds.increment();
            uint clownId = totalSupply();
            _mint(msg.sender, clownId);
        }
    }

    // retrieve bch earnings
    function withdraw() external {
        require(_bchBalances[msg.sender] > 0);

        uint amount = _bchBalances[msg.sender];
        _bchBalances[msg.sender] = 0;
        payable(msg.sender).transfer(amount);

        emit Withdraw(msg.sender, amount);
    }

    function owner() external view returns (address) {
        return _owner;
    }

    function totalInvested() external view returns (uint) {
        return _totalInvested;
    }

    function bchBalanceOf(address account) external view returns (uint) {
        return _bchBalances[account];
    }

    function clownPointsOf(address account) external view returns (uint) {
        return _clownPoints[account];
    }

    function clownPrice() external view returns (uint) {
        return _clownPrice;
    }

    function invested(address account) external view returns (uint) {
        return _invested[account];
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }

    function _baseURI() internal pure override returns (string memory) {
        return BASE_URI;
    }
}
