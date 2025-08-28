const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("deployer address :", deployer.address);

  const cap = ethers.parseEther("0.1"); // 设置上限
  const goal = ethers.parseEther("0.05"); // 设置下限
  const maxTokenSale = ethers.parseUnits("10000", 18); // 最大可出售的代币
  const rateStage1 = 1200; // 第一阶段是 1 ETH = 120 Tokens
  const rateStage2 = 1000; // 第二阶段是 1 ETH = 100 Tokens
  const rateStage3 = 800;
  let ICO, ico;

  // ICO 时间设置
  const now = Math.floor(Date.now() / 1000); // 当前时间戳
  const startTime = now - 60; // 1分钟后开始
  const endTime = now + 3600 * 24 * 7; // 1小时后结束

  ICO = await ethers.getContractFactory("CoinmanlabsICO");
  ico = await ICO.deploy(
    "0x308f2F66536F8d246F032a7Dc90173d23c0B3F0E",
    cap,
    goal,
    startTime,
    endTime,
    deployer.address
  );
  await ico.waitForDeployment();
  console.log("ico address:", ico.target); // 0x308f2F66536F8d246F032a7Dc90173d23c0B3F0E

  await ico.addGoalStage(ethers.parseEther("0.02"), rateStage1);
  await ico.addGoalStage(ethers.parseEther("0.05"), rateStage2);
  await ico.addGoalStage(ethers.parseEther("0.1"), rateStage3);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
