const PonziFund = artifacts.require('./PonziFund.sol');

contract('PonziFund', function(accounts) {
  let contract

  beforeEach('setup contract for each test', async function () {
    contract = await PonziFund.new()
  });

  it("has the right interface", async function() {
      // assert.isDefined(contract.invest);
      assert.isDefined(contract.withdraw);
  });

  it("has the right owner", async function() {
    assert.equal(await contract.owner(), accounts[0])
  });

  it("accepts investments and distributes it to investors", async function() {
    await contract.sendTransaction({ value: web3.toWei(1, "ether"), from: accounts[1] })

    let invested1 = await contract.invested(accounts[1])
    let balances0 = await contract.balances(accounts[0])
    let balances1 = await contract.balances(accounts[1])

    assert.equal(invested1.toNumber(), web3.toWei(1, "ether"))

    // first investment goes directly to fund manager
    assert.equal(balances0.toNumber(), web3.toWei(1, "ether"))
    assert.equal(balances1.toNumber(), 0)

   
    await contract.sendTransaction({ value: web3.toWei(1, "ether"), from: accounts[2] })


    balances1 = await contract.balances(accounts[1])

    assert.equal(balances1.toNumber(), web3.toWei(0.9, "ether"))
  });

  it("can withdraw fees", async function() {
    await contract.sendTransaction({ value: web3.toWei(1, "ether"), from: accounts[1] })
    await contract.sendTransaction({ value: web3.toWei(1, "ether"), from: accounts[2] })

    let balances0 = await contract.balances(accounts[0])
    
    assert.equal(balances0.toNumber(), web3.toWei(1.1, "ether"))

    let startBalance = web3.fromWei(web3.eth.getBalance(web3.eth.accounts[0]), "ether");

    await contract.withdraw();

    let endBalance = web3.fromWei(web3.eth.getBalance(web3.eth.accounts[0]), "ether");

    balances0 = await contract.balances(accounts[0])
    assert.equal(balances0.toNumber(), web3.toWei(0, "ether"))

    assert.isTrue(startBalance.toNumber() < endBalance.toNumber())
  });
});