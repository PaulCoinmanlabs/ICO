const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const contractName = "CoinmanlabsToken"; // 合约名

  // 获取 buildInfo
  const buildInfo = await hre.artifacts.getBuildInfo(`contracts/${contractName}.sol:${contractName}`);
  if (!buildInfo) {
    throw new Error("Build info not found. 请先运行 npx hardhat compile");
  }

  // 标准 JSON Input
  const jsonInput = buildInfo.input;

  // 保存到文件
  const outputPath = path.join(__dirname, `${contractName}-json-input.json`);
  fs.writeFileSync(outputPath, JSON.stringify(jsonInput, null, 2), "utf8");

  console.log("标准 JSON Input 已生成:", outputPath);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
