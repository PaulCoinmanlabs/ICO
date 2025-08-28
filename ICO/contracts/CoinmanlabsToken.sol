// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CoinmanlabsToken is ERC20{
    

   constructor(uint256 initalSupply) ERC20("CoinmanlabsToken", "CML"){
      // 默认开始的时候就将所有的代币给到部署者 总量是1,000,000,000
      _mint(msg.sender, initalSupply * 10 ** decimals());
   }

}