// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract CoinmanlabsICO is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    IERC20 public token; // 进行ICO代币的合约地址
    uint256 public moneyRaised; // 已筹集的资金
    uint256 public cap; // 募资上限
    uint256 public goal; // 募资下限
    uint256 public startTime; // 募资开始时间
    uint256 public endTime; // 募资结束时间
    bool public finalized;
    mapping(address => uint256) public buyerAddress; // 用于后续在结束时间后不满足则退款的记录
    mapping(address => uint256) public pendingTokens; // 用户可以领取的代币

    uint8 public tokenDecimals; // 代币的精度
    uint256 public tokenUnit;

    event TokenPurchased(address indexed buyer, uint256 value, uint256 amount);
    event Withdrawn(address indexed wallet, uint256 amount);
    event Refused(address indexed buyer, uint256 amount);

    struct GoalStage {
        uint256 threshold; // 达到区间的阈值
        uint256 rate; // 兑换比例
    }

    GoalStage[] public goalStages; // 设置每个阶段的区间阈值

    constructor(
        address tokenAddress,
        uint256 _cap,
        uint256 _goal,
        uint256 _startTime,
        uint256 _endTime,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_endTime >= _startTime, "start time must be before end time");
        require(_cap >= _goal, "goal must be <= cap");

        token = IERC20(tokenAddress);
        tokenDecimals = IERC20Metadata(tokenAddress).decimals();
        tokenUnit = 10 ** uint256(tokenDecimals);
        cap = _cap;
        goal = _goal;
        startTime = _startTime;
        endTime = _endTime;
    }

    modifier onlyWhileOpen() {
        require(
            block.timestamp >= startTime && block.timestamp <= endTime,
            "ICO not open"
        );
        _;
    }

    function addGoalStage(uint256 threshold, uint256 rate) public onlyOwner {
        require(rate > 0, "rate must be > 0");
        if (goalStages.length > 0) {
            require(
                threshold > goalStages[goalStages.length - 1].threshold,
                "threshold must increase"
            );
        }
        goalStages.push(GoalStage(threshold, rate));
    }

    function stageReady() public view returns (bool) {
        return
            goalStages.length > 0 &&
            goalStages[goalStages.length - 1].threshold == cap; // 最后一个阈值需要刚好等于最后的
    }

    function getCurrentStage() public view returns (uint256, uint256) {
        require(stageReady(), "stages not ready");
        for (uint256 i = 0; i < goalStages.length; i++) {
            if (moneyRaised < goalStages[i].threshold) {
                return (goalStages[i].threshold, goalStages[i].rate);
            }
        }

        // 理论上不会到这里，因为最后一个 threshold == cap 且 raised < cap 时已返回
        revert("no active stage");
    }

    // —— 购买逻辑：分段计价 + cap 截断 + 退款 —— //
    function buyToken() public payable onlyWhileOpen nonReentrant {
        require(stageReady(), "stages not ready");
        uint256 sentWei = msg.value;
        require(sentWei > 0, "Send ETH to buy tokens");

        // 获取本次剩余的cap
        uint256 remainingCap = cap - moneyRaised;
        require(remainingCap > 0, "cap reached");

        uint256 acceptedWei = sentWei;
        if (acceptedWei > remainingCap) {
            uint256 refundAmount = acceptedWei - remainingCap;
            acceptedWei = remainingCap;
            if (refundAmount > 0) {
                payable(msg.sender).transfer(refundAmount); // 退回超额 ETH
            }
        }

        uint256 tokensToAllocate = 0;
        uint256 remainingAmount = sentWei; // 这里在取一次是为了做了判断的条件

        // 分阶段购买
        while (remainingAmount > 0) {
            // 当前阶段的cap
            (uint256 currentThreshold, uint256 currentRate) = getCurrentStage();
            uint256 remainingStage = currentThreshold - moneyRaised; // 当前这个阶段还差多少就满了
            if (remainingStage >= remainingAmount) {
                tokensToAllocate += (remainingAmount * currentRate) / 1e18 * tokenUnit;
                moneyRaised += remainingAmount;
                remainingAmount = 0; // 退出循环条件
            } else {
                tokensToAllocate += (remainingStage * currentRate) / 1e18 * tokenUnit;
                moneyRaised += remainingStage;
                remainingAmount -= remainingStage;
            }
        }

        require(
            token.balanceOf(address(this)) >= tokensToAllocate,
            "Not enough tokens to ICO"
        ); // 确保ICO合约里面有足够的代币
        pendingTokens[msg.sender] += tokensToAllocate; // 记录后续用户可以领取的代币
        buyerAddress[msg.sender] += acceptedWei; // 记录购买的花费的ETH 便于后续ICO失败退款

        emit TokenPurchased(msg.sender, acceptedWei, tokensToAllocate);
    }

    function claimTokens() public nonReentrant {
        require(block.timestamp > endTime, "ICO not end");
        require(moneyRaised >= goal, "goal not reached, cannot claim");
        uint256 tokens = pendingTokens[msg.sender];
        require(tokens > 0, "No tokens to claim");
        pendingTokens[msg.sender] = 0;
        token.safeTransfer(msg.sender, tokens);
    }

    function refused() public nonReentrant {
        require(block.timestamp > endTime, "ICO not end");
        require(moneyRaised < goal, "goal not reached, no refused");
        uint256 buyETH = buyerAddress[msg.sender];
        require(buyETH > 0, "No eth to refused");

        buyerAddress[msg.sender] = 0;
        pendingTokens[msg.sender] = 0;
        payable(msg.sender).transfer(buyETH);

        emit Refused(msg.sender, buyETH);
    }

    function withdrawn(address payable wallet) public onlyOwner nonReentrant {
        require(block.timestamp > endTime || moneyRaised == cap, "ICO not end");
        require(!finalized, "already finalized");
        require(moneyRaised > goal, "goal not reacher");
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdrawn");
        wallet.transfer(balance);
        finalized = true;
        emit Withdrawn(wallet, balance);
    }

    // —— 兜底 —— //

    receive() external payable {
        if (msg.value > 0) {
            buyToken(); // 用户直接往这个合约打钱也是进行ico
        }
    }

    fallback() external payable {
        revert("unsupported");
    }
}
