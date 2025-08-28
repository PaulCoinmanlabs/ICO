const { ethers } = require("hardhat");

async function main() {
    const [ deployer ] = await ethers.getSigners();
    console.log("deployer address :", deployer.address);

    const CoinmanlabsToken = await ethers.getContractFactory("CoinmanlabsToken");
    const coinmanlabs = await CoinmanlabsToken.deploy("1000000");

    await coinmanlabs.waitForDeployment();
    console.log("token address:",coinmanlabs.target) // 0x308f2F66536F8d246F032a7Dc90173d23c0B3F0E
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
