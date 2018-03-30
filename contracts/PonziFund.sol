pragma solidity ^0.4.0;

/// @title PonziFund
///  @author adrianbarwicki
contract PonziFund {
    address public owner;
    uint public total;
    mapping (address => uint) public invested;
    mapping (address => uint) public balances;
    

    address[] investors;

	function PonziFund() public {
		owner = msg.sender;
	}

    // fund manager fee
    function ownerFee(uint amount) private returns (uint fee) {
        fee = amount / 10;
        balances[owner] += fee;

        return;
    }

    function withdraw() public
    {
        require(balances[msg.sender] != 0);

        uint amount = balances[msg.sender];
        balances[msg.sender] = 0;

        if (!msg.sender.send(amount)) {
            balances[msg.sender] = amount;
        }
    }

    // fallback to accept funds
	function () public payable
    {
        uint dividend = msg.value;

        // first investment goes completely to the fund manager.
        if (investors.length == 0) {
            balances[owner] = msg.value;
        } else {
            uint fee = ownerFee(dividend);

            dividend -= fee;
        }
        
     
         // distribute dividends
         for (uint i = 0; i < investors.length; i++) {
           if (balances[investors[i]] == 0) {
                balances[investors[i]] = dividend * invested[investors[i]] / total;
           } else {
               balances[investors[i]] += dividend * invested[investors[i]] / total;
           }
         }

        if (invested[msg.sender] == 0) {
            investors.push(msg.sender);
            invested[msg.sender] = msg.value;
        } else {
            invested[msg.sender] += msg.value;
        }

        total += msg.value;
	}
}