require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    bscTest: {
      url: process.env.BSC_TESTNET_RPC,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 97
    },
  },
  etherscan: {
    apiKey: {
      bscTest: process.env.BSCSCAN_API_KEY
    }
  }
};
