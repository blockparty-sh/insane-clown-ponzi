pragma solidity ^0.8.0;

// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/// original ponzi implementation from adrianbarwicki
/// https://github.com/adrianbarwicki/eth-ponzi-fund
contract InsaneClownPonzi is ERC721Enumerable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    address private _owner; // defi owner receives 5% of all deposits
    uint256 private _totalInvested; // how much people have funded icp
    mapping(address => uint256) private _bchBalances; // what is available for withdrawal
    mapping(address => uint256) private _clownPoints; // use clown points to claim clowns
    mapping(address => uint256) private _invested; // how much initially invested
    address[] private _investors; // for help with iteration

    // this is set by an advanced defi bonding curve
    // it determines cost of clown to buy with clownPoints
    uint256 private _clownPrice = 1e16; // how much bch to create a clown

    // this is where clown icons reside like BASE_URI.id (concat)
    string constant BASE_URI = "https://insaneclownponzi.world/metadata/";

    constructor() ERC721("Insane Clown Ponzi", "ICP") {
        _owner = msg.sender;
    }

    event Deposit(address account, uint256 amount);
    event Withdraw(address account, uint256 amount);

    receive() external payable {
        require(msg.value >= 1e15, "ICP: Minimum value not met");

        uint256 dividend = msg.value;
        uint256 totalFee = dividend / 10;
        dividend -= totalFee;

        if (_investors.length == 0) {
            _bchBalances[_owner] = msg.value;
            _clownPoints[_owner] = msg.value;
        } else {
            // half of fee goes to owner and half is distributed to clown holders
            if (totalSupply() == 0) {
                _bchBalances[_owner] += totalFee;
                _clownPoints[_owner] += totalFee;
            } else {
                // note: a bit gets burnt here prior to first clown
                uint256 ownerFee = totalFee / 2;
                uint256 totalClownFee = totalFee - ownerFee;

                _bchBalances[_owner] += ownerFee;
                _clownPoints[_owner] += ownerFee;

                uint256 rewardPerClown = totalClownFee / totalSupply();
                for (uint256 i = 0; i < totalSupply(); ++i) {
                    address clownOwner = ownerOf(i);

                    _bchBalances[clownOwner] += rewardPerClown;
                    _clownPoints[clownOwner] += rewardPerClown;
                }
            }
        }

        // distribute dividends
        for (uint256 i = 0; i < _investors.length; i++) {
            uint256 payment = (dividend * _invested[_investors[i]]) / _totalInvested;
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
    function claimClown() public {
        require(_clownPoints[msg.sender] >= _clownPrice, "ICP: Insufficent clown points");

        _clownPoints[msg.sender] -= _clownPrice;
        _clownPrice += _clownPrice / 2021; // advanced tokenomics bonding curve

        _tokenIds.increment();
        uint256 clownId = totalSupply();
        _mint(msg.sender, clownId);
    }

    function claimAllClowns() external {
        while(_clownPoints[msg.sender] >= _clownPrice) {
            claimClown();
        }
    }

    // retrieve bch earnings
    function withdraw() external {
        require(_bchBalances[msg.sender] > 0, "ICP: Must have positive balance");

        uint256 amount = _bchBalances[msg.sender];
        _bchBalances[msg.sender] = 0;
        payable(msg.sender).transfer(amount);

        emit Withdraw(msg.sender, amount);
    }

    function transfer(
        address recipient,
        uint256 tokenId
    ) external {
        require(ERC721._isApprovedOrOwner(msg.sender, tokenId), "ERC721: transfer caller is not owner nor approved");

        ERC721._transfer(msg.sender, recipient, tokenId);
    }

    function owner() external view returns (address) {
        return _owner;
    }

    function totalInvested() external view returns (uint256) {
        return _totalInvested;
    }

    function bchBalanceOf(address account) external view returns (uint256) {
        return _bchBalances[account];
    }

    function clownPointsOf(address account) external view returns (uint256) {
        return _clownPoints[account];
    }

    function clownPrice() external view returns (uint256) {
        return _clownPrice;
    }

    function invested(address account) external view returns (uint256) {
        return _invested[account];
    }

    function _baseURI() internal pure override returns (string memory) {
        return BASE_URI;
    }
}
