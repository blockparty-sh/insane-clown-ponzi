const InsaneClownPonzi = artifacts.require('./InsaneClownPonzi.sol');
const truffleAssert = require('truffle-assertions');

contract('InsaneClownPonzi', function(accounts) {
    let contract;

    beforeEach('setup contract for each test', async function () {
        contract = await InsaneClownPonzi.new({ from: accounts[0] });
    });

    it("has the right interface", async function() {
        // assert.isDefined(contract.invest);
        assert.isDefined(contract.withdraw);
    });

    it("has the right owner", async function() {
        assert.equal(await contract.owner(), accounts[0]);
    });

    it("accepts investments and distributes it to investors", async function() {
        await contract.sendTransaction({
            value: web3.utils.toWei("1", "ether"),
            from: accounts[1],
        });

        const invested1 = await contract.invested(accounts[1]);
        const balances0 = await contract.bchBalanceOf(accounts[0]);
        let   balances1 = await contract.bchBalanceOf(accounts[1]);

        assert.equal(invested1.toString(), web3.utils.toWei("1", "ether"));

        // first investment goes directly to fund manager
        assert.equal(balances0.toString(), web3.utils.toWei("1", "ether"));
        assert.equal(balances1.toString(), 0);

     
        await contract.sendTransaction({
            value: web3.utils.toWei("1", "ether"),
            from: accounts[2]
        });


        balances1 = await contract.bchBalanceOf(accounts[1]);

        assert.equal(balances1.toString(), web3.utils.toWei("0.9", "ether"));
    });

    it("can withdraw fees", async function() {
        await contract.sendTransaction({
            value: web3.utils.toWei("1", "ether"),
            from: accounts[1],
        });
        await contract.sendTransaction({
            value: web3.utils.toWei("1", "ether"),
            from: accounts[2]
        });

        let balances0 = await contract.bchBalanceOf(accounts[0]);
        
        assert.equal(balances0.toString(), web3.utils.toWei("1.1", "ether"));

        const startBalance = new web3.utils.BN(await web3.eth.getBalance(accounts[0]));

        await contract.withdraw({ from: accounts[0] });

        const endBalance = new web3.utils.BN(await web3.eth.getBalance(accounts[0]));

        balances0 = await contract.bchBalanceOf(accounts[0]);
        assert.equal(balances0.toString(), web3.utils.toWei("0", "ether"));

        assert.isTrue(startBalance.lt(endBalance));
        
        const diff = endBalance.sub(startBalance);
        assert.isTrue(diff.gte(new web3.utils.BN('1050000000000000000')));
        assert.isTrue(diff.lte(new web3.utils.BN('1100000000000000000')));
    });
});
