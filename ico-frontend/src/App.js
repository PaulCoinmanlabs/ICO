import "./App.css";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import BuyToken from "./BuyToken";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 顶部导航 */}
      <header className="w-full flex justify-between items-center px-6 py-4 bg-white shadow">
        <h1 className="text-xl font-bold text-gray-800">Coinmanlabs ICO</h1>
        <ConnectButton />
      </header>

      {/* 主体内容 */}
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-2xl text-center px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            欢迎来到 Coinmanlabs ICO
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            这是一个基于以太坊的去中心化代币发行平台。
            <br />
            参与我们的 ICO，支持项目发展，并获取未来的代币奖励。
          </p>
          <BuyToken />
        </div>
      </main>
    </div>
  );
}

export default App;
