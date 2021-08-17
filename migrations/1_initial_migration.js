var Migrations = artifacts.require("./Migrations.sol");
var InsaneClownPonzi = artifacts.require("./InsaneClownPonzi.sol");

module.exports = function(deployer) {
    deployer.deploy(Migrations);
    deployer.deploy(InsaneClownPonzi);
};
