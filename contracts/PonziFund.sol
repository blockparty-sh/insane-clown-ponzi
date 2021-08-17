pragma solidity ^0.8.0;

/// @title PonziFund
/// @author adrianbarwicki
contract PonziFund {
    address private _owner;
    uint private _totalInvested;
    mapping (address => uint) private _balances;

    mapping (address => uint) private _invested;
    address[] private _investors;

    constructor () {
        _owner = msg.sender;
    }

    event Deposit(address account,  uint amount);
    event Withdraw(address account, uint amount);

    receive() external payable
    {
        uint dividend = msg.value;
        uint fee = ownerFee(dividend);
        dividend -= fee;

        if (_investors.length == 0) {
            balances[msg.sender] = msg.value;
        } else {
            balances[_owner] += fee;
        }

        // distribute dividends
        for (uint i = 0; i < _investors.length; i++) {
           _balances[_investors[i]] += dividend * _invested[_investors[i]] / _totalInvested;
        }

        // 
        // _invested[msg.sender] += dividend;
        // _invested[_owner] += fee;
        _invested[msg.sender] += msg.value;

        // allow for iteration over invested
        if (_invested[msg.sender] == 0) {
            _investors.push(msg.sender);
        }

        _totalInvested += msg.value;

        emit Deposit(msg.sender, msg.value);
    }

    function withdraw() external
    {
        require(_balances[msg.sender] > 0);

        uint amount = _balances[msg.sender];
        _balances[msg.sender] = 0;
        payable(msg.sender).transfer(amount);

        emit Withdraw(msg.sender, amount);
    }

    function owner() external view returns (address) {
        return _owner;
    }

    function totalInvested() external view returns (uint) {
        return _totalInvested;
    }

    function balanceOf(address account) external view returns (uint) {
        return _balances[account];
    }

    function investedOf(address account) external view returns (uint) {
        return _invested[account];
    }

    // fund manager fee 💰
    function ownerFee(uint amount) internal pure returns (uint) {
        return amount / 10;
    }
}
