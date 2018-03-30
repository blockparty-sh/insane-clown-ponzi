var Migrations = artifacts.require("./Migrations.sol");
var PonziFund = artifacts.require("./PonziFund.sol");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(PonziFund);
};
