const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CoinmanlabsLCO", function () {
  let Token, token, ICO, ico;
  let owner, addr1, addr2, addr3;

  const cap = ethers.parseEther("10"); // 设置上限
  const goal = ethers.parseEther("5"); // 设置下限
  const maxTokenSale = ethers.parseUnits("10000", 18); // 最大可出售的代币
  const rateStage1 = 120; // 第一阶段是 1 ETH = 120 Tokens
  const rateStage2 = 100; // 第二阶段是 1 ETH = 100 Tokens

  // ICO 时间设置
  const now = Math.floor(Date.now() / 1000); // 当前时间戳
  const startTime = now - 60; // 1分钟后开始
  const endTime = now + 3600; // 1小时后结束

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // 部署进行ICO的代币
    Token = await ethers.getContractFactory("CoinmanlabsToken");
    token = await Token.deploy("1000000");
    await token.waitForDeployment();
    console.log("Token deployed at:", token.target);

    // 部署ICO的合约
    ICO = await ethers.getContractFactory("CoinmanlabsICO");
    ico = await ICO.deploy(token.target, cap, goal, startTime, endTime, owner);
    await ico.waitForDeployment();

    // 添加兑换比例
    await ico.addGoalStage(ethers.parseEther("5"), rateStage1);
    await ico.addGoalStage(ethers.parseEther("10"), rateStage2);

    // 给ICO的合约打入需要进行ICO的代币
    await token.transfer(ico.target, maxTokenSale);

  });

  it('Users purchase tokens and are charged at a rate calculated by stage.', async function () {
    // addr1 购买2 ETH
    await ico.connect(addr1).buyToken({value: ethers.parseEther("2")});

    const purchaseETH = await ico.buyerAddress(addr1);
    const purchaseToken = await ico.pendingTokens(addr1);
    expect(purchaseETH).to.equal(ethers.parseEther("2"));
    expect(purchaseToken).to.equal(ethers.parseUnits("240", 18))


    await ico.connect(addr2).buyToken({value: ethers.parseEther("4")});
    const purchaseETH1 = await ico.buyerAddress(addr2);
    const purchaseToken1 = await ico.pendingTokens(addr2);
    expect(purchaseETH1).to.equal(ethers.parseEther("4"));
    expect(purchaseToken1).to.equal(ethers.parseUnits("480", 18))
  })
});
