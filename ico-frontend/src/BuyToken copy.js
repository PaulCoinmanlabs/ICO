import { useEffect, useState } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import {  parseEther,formatUnits } from "viem";

import { ICO_ADDRESS, ICO_ABI } from "./contract";

export default function BuyToken() {
  const { address } = useAccount(); // 获取到已经连接钱包的用户
  const { data: walletClient } = useWalletClient(); // 获取到当前用户钱包的签名客户端
  const publicClient = usePublicClient(); // 代表了公共的RPC客户端 用用于查询链上数据 等交易确认

  const [amount, setAmount] = useState("0.01"); // 默认购买的金额
  const [pending, setPeding] = useState("0"); // 当前连接的用户可以claim的token
  const [spent, setSpent] = useState("0"); // 用户购买代币花费的BNB
  const [loading, setLoading] = useState(false); // 设置加载中
  const [moneyRaised, setMoneyRaised] = useState(0) 
  const [endTime, setEndTime] = useState(0) 
  const [goal, setGoal] = useState(0) 
  const [cap, setCap] = useState(0) 

  // 用户连接钱包后根据钱包账户获取相关的信息
  async function fetchData() {
    if (!address) return;
    try {
      const pendingToken = await publicClient.readContract({
        address: ICO_ADDRESS,
        abi: ICO_ABI,
        functionName: "pendingTokens",
        args: [address],
      });
      
      const spentBNB = await publicClient.readContract({
        address: ICO_ADDRESS,
        abi: ICO_ABI,
        functionName: "buyerAddress",
        args: [address],
      });

      setPeding(formatUnits(pendingToken ,18));
      setSpent(formatUnits(spentBNB,18));
    } catch (error) {
      console.error("获取链上数据失败", error);
    }
  }
  // 获取基本信息 比如cap和截止时间等
//    uint256 public moneyRaised; // 已筹集的资金
//     uint256 public cap; // 募资上限
//     uint256 public goal; // 募资下限
//     uint256 public startTime; // 募资开始时间
//     uint256 public endTime; // 募资结束时间
  async function fetchBaseData() {
    try {
        const moneyRaised = await publicClient.readContract({
            abi: ICO_ABI,
            address: ICO_ADDRESS,
            functionName: 'moneyRaised',
            args: []
        });
         const endTime = await publicClient.readContract({
            abi: ICO_ABI,
            address: ICO_ADDRESS,
            functionName: 'endTime',
            args: []
        });

         const goal = await publicClient.readContract({
            abi: ICO_ABI,
            address: ICO_ADDRESS,
            functionName: 'goal',
            args: []
        });
         const cap = await publicClient.readContract({
            abi: ICO_ABI,
            address: ICO_ADDRESS,
            functionName: 'cap',
            args: []
        });

        setMoneyRaised(moneyRaised);
        setEndTime(endTime);
        setGoal(goal);
        setCap(cap);

    } catch (error) {
        console.error("获取链上数据失败", error);
    }
  }

  // 用户点击购买的token
  async function buyToken() {
    if (!walletClient || !address) return alert("请先连接钱包");
    setLoading(true);
    try {
      const hash = await walletClient.writeContract({
        account: address,
        abi: ICO_ABI,
        address: ICO_ADDRESS,
        functionName: "buyToken",
        args: [],
        value: parseEther(amount),
      });

      console.log("交易提交中 等待返回结果");

      const data = await publicClient.waitForTransactionReceipt({hash});
      console.log(data)
      alert("购买成功：" + data);
      fetchData();
    } catch (error) {
      console.error("交易失败:", error);
      alert("交易失败 ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    //fetchBaseData();
    if (address) fetchData();
  }, [address]);
  
  return (
    <div className="flex flex-col items-center gap-4 p-6 border rounded shadow-md">
      <h2 className="text-xl font-bold">Buy Tokens</h2>
      <div className="mt-4 text-center">
        <p> 截止时间： {endTime}</p>
        <p> 已募资: {moneyRaised}</p>
        <p> 最低募资: {goal}</p>
        <p> 最大募资: {cap}</p>
      </div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="border p-2 rounded w-40"
        step="0.01"
        min="0.01"
      />

      <button
        onClick={buyToken}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >{loading? "Processing..." : "Buy Tokens"}</button>
      <div className="mt-4 text-center">
        <p> 用户可以Claim的Tokens: {pending}</p>
        <p>BNB Spent: {spent}</p>
      </div>
    </div>
  );
}
