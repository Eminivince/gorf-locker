import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Lock,
  Wallet,
  Clock,
  Shield,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  DollarSign,
  Users,
  TrendingUp,
} from "lucide-react";

export const HowToUsePage = () => {
  const [activeTab, setActiveTab] = useState("getting-started");

  const tabs = [
    { id: "getting-started", label: "Getting Started", icon: Zap },
    { id: "token-locks", label: "Token Locks", icon: Lock },
    { id: "lp-locks", label: "LP Locks", icon: TrendingUp },
    { id: "fees", label: "Fee Structure", icon: DollarSign },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            How to Use Gorf Token Locker
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Learn how to securely lock your tokens and LP positions with our
            comprehensive guide
          </p>
        </div>

        {/* Quick Start Banner */}
        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Quick Start</h3>
              <p className="text-gray-300">Ready to create your first lock?</p>
            </div>
          </div>
          <Link
            to="/create-lock"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            Create New Lock
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 bg-gray-800/50 p-2 rounded-xl">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-green-500 text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}>
                <IconComponent className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800/30 rounded-2xl p-8">
          {activeTab === "getting-started" && <GettingStartedContent />}
          {activeTab === "token-locks" && <TokenLocksContent />}
          {activeTab === "lp-locks" && <LPLocksContent />}
          {activeTab === "fees" && <FeesContent />}
          {activeTab === "security" && <SecurityContent />}
        </div>
      </div>
    </div>
  );
};

const GettingStartedContent = () => (
  <div className="space-y-8">
    <div>
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <Zap className="w-8 h-8 text-green-400" />
        Getting Started
      </h2>
      <p className="text-gray-300 text-lg mb-8">
        Abstract Locker is a decentralized platform for locking tokens and
        liquidity positions. Follow these steps to get started.
      </p>
    </div>

    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <h3 className="text-2xl font-semibold mb-4">Prerequisites</h3>

        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-lg">
            <Wallet className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold mb-2">Connect Your Wallet</h4>
              <p className="text-gray-400">
                Connect a compatible wallet (Abstract Global Wallet, MetaMask, WalletConnect, etc.) to
                the Abstract network.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-lg">
            <DollarSign className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold mb-2">Have Tokens/ETH</h4>
              <p className="text-gray-400">
                Ensure you have the tokens you want to lock plus ETH for
                transaction fees.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-lg">
            <Shield className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold mb-2">Understand the Risks</h4>
              <p className="text-gray-400">
                Locked tokens cannot be accessed until the unlock time. Make
                sure you understand the terms.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-semibold mb-4">Step-by-Step Process</h3>

        <div className="space-y-4">
          {[
            {
              step: 1,
              title: "Choose Lock Type",
              desc: "Select between Token Lock or LP Lock",
            },
            {
              step: 2,
              title: "Enter Details",
              desc: "Specify token address, amount, and unlock time",
            },
            {
              step: 3,
              title: "Select Fee Structure",
              desc: "Choose your preferred fee payment method",
            },
            {
              step: 4,
              title: "Approve & Lock",
              desc: "Approve token spending and create the lock",
            },
            {
              step: 5,
              title: "Manage Locks",
              desc: "View and manage your locks in 'My Locks'",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-lg">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {item.step}
              </div>
              <div>
                <h4 className="font-semibold mb-1">{item.title}</h4>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const TokenLocksContent = () => (
  <div className="space-y-8">
    <div>
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <Lock className="w-8 h-8 text-green-400" />
        Token Locks
      </h2>
      <p className="text-gray-300 text-lg mb-8">
        Lock ERC20 tokens for a specified period. Perfect for team tokens,
        vesting schedules, or community trust building.
      </p>
    </div>

    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <h3 className="text-2xl font-semibold">Standard Token Lock</h3>

        <div className="bg-gray-700/30 p-6 rounded-xl">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            How it Works
          </h4>
          <ul className="space-y-2 text-gray-300">
            <li>• Tokens are locked until a specific unlock date</li>
            <li>• No access to tokens during lock period</li>
            <li>• Automatic unlock after the specified time</li>
            <li>• Lock ownership can be transferred</li>
          </ul>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 p-6 rounded-xl">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" />
            Use Cases
          </h4>
          <ul className="space-y-2 text-gray-300">
            <li>• Team token vesting</li>
            <li>• Community trust building</li>
            <li>• Liquidity guarantees</li>
            <li>• Token distribution schedules</li>
          </ul>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-semibold">TGE Vesting Lock</h3>

        <div className="bg-gray-700/30 p-6 rounded-xl">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Advanced Features
          </h4>
          <ul className="space-y-2 text-gray-300">
            <li>
              • <strong>TGE Release:</strong> Immediate unlock percentage
            </li>
            <li>
              • <strong>Cycle Release:</strong> Periodic unlocks over time
            </li>
            <li>
              • <strong>Flexible Schedule:</strong> Customize vesting periods
            </li>
            <li>
              • <strong>Partial Withdrawals:</strong> Claim unlocked portions
            </li>
          </ul>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 p-6 rounded-xl">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Important Notes
          </h4>
          <ul className="space-y-2 text-gray-300">
            <li>• Carefully set unlock dates - they cannot be changed</li>
            <li>• Ensure sufficient token balance before locking</li>
            <li>• Consider gas fees for future unlock transactions</li>
            <li>• Test with small amounts first</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

const LPLocksContent = () => (
  <div className="space-y-8">
    <div>
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <TrendingUp className="w-8 h-8 text-blue-400" />
        Liquidity Pool Locks
      </h2>
      <p className="text-gray-300 text-lg mb-8">
        Lock liquidity pool tokens to provide security and trust to your
        community while maintaining earning potential.
      </p>
    </div>

    <div className="grid lg:grid-cols-3 gap-6">
      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 p-6 rounded-xl">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <div className="w-fit p-2 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
            ERC20
          </div>
          Tokens
        </h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li>• General ERC20 tokens</li>
          <li>• Supports TGE Vesting Locks</li>
          <li>• Supports Standard Locks</li>
          <li>• Multiple fee payment options</li>
        </ul>
      </div>
      <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 p-6 rounded-xl">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
            V2
          </div>
          UniswapV2 Locks
        </h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li>• Lock LP tokens from V2 pools</li>
          <li>• Multiple fee payment options</li>
          <li>• Maintain liquidity provider status</li>
          <li>• Automatic fee collection</li>
        </ul>
      </div>

      <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-500/30 p-6 rounded-xl">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
            V3
          </div>
          UniswapV3 Locks
        </h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li>• Lock V3 NFT positions</li>
          <li>• Continue earning fees while locked</li>
          <li>• Collect liquidity stake earnings</li>
          <li>• Advanced fee structures</li>
        </ul>
      </div>
    </div>

    <div className="bg-gray-700/30 p-6 rounded-xl">
      <h3 className="text-xl font-semibold mb-4">Benefits of LP Locks</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold mb-2 text-green-400">For Projects</h4>
          <ul className="space-y-1 text-gray-300">
            <li>• Build community trust</li>
            <li>• Prevent rug pulls</li>
            <li>• Demonstrate long-term commitment</li>
            <li>• Attract serious investors</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2 text-blue-400">For Investors</h4>
          <ul className="space-y-1 text-gray-300">
            <li>• Verify liquidity security</li>
            <li>• Reduced investment risk</li>
            <li>• Transparent lock terms</li>
            <li>• On-chain verification</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

const FeesContent = () => (
  <div className="space-y-8">
    <div>
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <DollarSign className="w-8 h-8 text-green-400" />
        Fee Structure
      </h2>
      <p className="text-gray-300 text-lg mb-8">
        Understand our transparent fee structure and choose the payment method
        that works best for you.
      </p>
    </div>

    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <h3 className="text-2xl font-semibold">Token Lock Fees</h3>

        <div className="bg-green-500/10 border border-green-500/30 p-6 rounded-xl">
          <h4 className="font-semibold mb-4 text-green-400">Standard Fee</h4>
          <div className="text-2xl font-bold mb-2">0.000001 ETH</div>
          <p className="text-gray-300">Simple, low-cost fee for token locks</p>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-semibold">LP Lock Fees</h3>

        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
            <h4 className="font-semibold mb-2 text-blue-400">Pay with LP</h4>
            <div className="text-xl font-bold mb-1">0.6%</div>
            <p className="text-gray-300 text-sm">
              Extract percentage from liquidity
            </p>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-xl">
            <h4 className="font-semibold mb-2 text-purple-400">ETH + LP</h4>
            <div className="text-xl font-bold mb-1">0.01 ETH + 0.3%</div>
            <p className="text-gray-300 text-sm">Hybrid payment method</p>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-gray-700/30 p-6 rounded-xl">
      <h3 className="text-xl font-semibold mb-4">V3 Advanced Fees</h3>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-600/30 rounded-lg">
          <h4 className="font-semibold mb-2">Default</h4>
          <div className="text-lg font-bold text-green-400">0.4%</div>
          <p className="text-xs text-gray-400 mt-1">+ 1.6% earnings fee</p>
        </div>
        <div className="text-center p-4 bg-gray-600/30 rounded-lg">
          <h4 className="font-semibold mb-2">LVP</h4>
          <div className="text-lg font-bold text-blue-400">0.64%</div>
          <p className="text-xs text-gray-400 mt-1">+ 0.8% earnings fee</p>
        </div>
        <div className="text-center p-4 bg-gray-600/30 rounded-lg">
          <h4 className="font-semibold mb-2">LLP</h4>
          <div className="text-lg font-bold text-purple-400">0.24%</div>
          <p className="text-xs text-gray-400 mt-1">+ 2.8% earnings fee</p>
        </div>
      </div>
    </div>
  </div>
);

const SecurityContent = () => (
  <div className="space-y-8">
    <div>
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <Shield className="w-8 h-8 text-green-400" />
        Security & Best Practices
      </h2>
      <p className="text-gray-300 text-lg mb-8">
        Learn about our security measures and best practices to keep your locked
        assets safe.
      </p>
    </div>

    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <h3 className="text-2xl font-semibold">Smart Contract Security</h3>

        <div className="space-y-4">
          

          <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Non-Upgradeable
            </h4>
            <p className="text-gray-300 text-sm">
              Contracts are immutable - no backdoors or admin controls over
              locked funds.
            </p>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-xl">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Battle Tested
            </h4>
            <p className="text-gray-300 text-sm">
              Proven track record with millions in total value locked.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-semibold">Best Practices</h3>

        <div className="space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Double-Check Everything
            </h4>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Verify token addresses</li>
              <li>• Confirm unlock dates</li>
              <li>• Check amounts carefully</li>
            </ul>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              Start Small
            </h4>
            <p className="text-gray-300 text-sm">
              Test with small amounts first to familiarize yourself with the
              process.
            </p>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-400" />
              Secure Your Wallet
            </h4>
            <p className="text-gray-300 text-sm">
              Use hardware wallets and keep your private keys safe.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-xl">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-red-400">
        <AlertTriangle className="w-6 h-6" />
        Important Warnings
      </h3>
      <ul className="space-y-2 text-gray-300">
        <li>
          • <strong>Irreversible:</strong> Locks cannot be cancelled or modified
          once created
        </li>
        <li>
          • <strong>Time-locked:</strong> Tokens are inaccessible until unlock
          time
        </li>
        <li>
          • <strong>Gas Fees:</strong> You'll need ETH for future unlock
          transactions
        </li>
        <li>
          • <strong>Smart Contract Risk:</strong> Even when audited, smart contracts
          carry inherent risks.
        </li>
      </ul>
    </div>
  </div>
);
