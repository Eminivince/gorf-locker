import { useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Plus, TrendingUp, Users, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useTokenLocker } from "../hooks/useTokenLocker";
import { useAllLocks } from "../hooks/useAllLocks";
import { useEnhancedStatistics } from "../hooks/useEnhancedStatistics";
import { LockTable } from "../components/LockTable";
import { LoadingSpinner } from "../components/LoadingSpinner";

import { FEE_NAME_HASHES } from "../utils/ComputeNameHash";

// Mock data for the chart
const chartData = [
  { date: "09/24", value: 20 },
  { date: "10/24", value: 25 },
  { date: "10/24", value: 30 },
  { date: "10/24", value: 35 },
  { date: "11/24", value: 45 },
  { date: "11/24", value: 55 },
  { date: "12/24", value: 75 },
  { date: "12/24", value: 85 },
  { date: "01/25", value: 95 },
  { date: "01/25", value: 110 },
  { date: "01/25", value: 125 },
  { date: "02/25", value: 140 },
  { date: "02/25", value: 155 },
  { date: "03/25", value: 175 },
  { date: "03/25", value: 190 },
  { date: "04/25", value: 210 },
  { date: "04/25", value: 225 },
  { date: "05/25", value: 240 },
  { date: "05/25", value: 200 },
  { date: "06/25", value: 180 },
];

export const HomePage = () => {
  const [activeTab, setActiveTab] = useState("Tokens");
  const { totalLocks } = useTokenLocker();
  const {
    tokens,
    v2Pools,
    v3Pools,
    v4Pools,
    totalLocks: allLocksCount,
    isLoading,
  } = useAllLocks();
  const {
    totalLocks: statisticsTotalLocks,
    uniqueTokensLocked,
    newLocks24h,
    isLoading: statisticsLoading,
  } = useEnhancedStatistics();

  const getCurrentTabLocks = () => {
    switch (activeTab) {
      case "Tokens":
        return tokens;
      case "V2 Pools":
        return v2Pools;
      case "V3 Pools":
        return v3Pools;
      case "V4 Pools":
        return v4Pools;
      default:
        return tokens;
    }
  };

  const getCurrentTabType = (): "tokens" | "v2" | "v3" | "v4" => {
    switch (activeTab) {
      case "Tokens":
        return "tokens";
      case "V2 Pools":
        return "v2";
      case "V3 Pools":
        return "v3";
      case "V4 Pools":
        return "v4";
      default:
        return "tokens";
    }
  };

  const getTabCount = (tab: string) => {
    switch (tab) {
      case "Tokens":
        return tokens.length;
      case "V2 Pools":
        return v2Pools.length;
      case "V3 Pools":
        return v3Pools.length;
      case "V4 Pools":
        return v4Pools.length;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-transparent to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                  Gorf Token Locker{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                    secure
                  </span>
                  <br />
                  your toke on{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                    Abstract.
                  </span>{" "}
              
                </h1>
                <p className="text-xl text-gray-300 max-w-2xl">
                  Secure your tokens with battle-tested smart contracts.
                  Trusted by thousands of projects for reliable token vesting.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/create-lock"
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-green-500/25">
                  <Plus size={20} className="mr-2" />
                  Create New Lock
                </Link>
                <Link
                  to="/my-locks"
                  className="inline-flex items-center justify-center px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all duration-200 border border-gray-700 hover:border-gray-600">
                  View My Locks
                </Link>
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="relative">
                <div className="w-64 h-48 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-green-500/30">
                  <img
                    src="https://www.gorf.life/assets/Logo.svg"
                    alt="gorf_ogo"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-green-400 rounded-full animate-pulse"></div>
                <div className="absolute -bottom-6 -left-6 w-6 h-6 bg-emerald-500 rounded-full animate-bounce"></div>
                <div className="absolute top-1/2 -right-8 w-4 h-4 bg-green-300 rounded-full animate-ping"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 hover:border-green-500/50 transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <Lock className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    Total Locks
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {statisticsLoading ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      (
                        statisticsTotalLocks ||
                        totalLocks ||
                        allLocksCount ||
                        0
                      ).toLocaleString()
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 hover:border-green-500/50 transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    Unique Tokens Locked
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {statisticsLoading ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      (uniqueTokensLocked || 0).toLocaleString()
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 hover:border-green-500/50 transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Clock className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    New Locks (24h)
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {statisticsLoading ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      (newLocks24h || 0).toLocaleString()
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explorer Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-3xl font-bold text-white">Explorer</h2>
                <p className="text-gray-400 mt-2">
                  Browse all locked tokens and pools
                </p>
              </div>
              <Link
                to="/create-lock"
                className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-green-500/25">
                <Plus size={16} className="mr-2" />
                New Lock
              </Link>
            </div>

            {/* Chart Section */}
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
              <div className="flex items-center space-x-3 mb-6">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <h3 className="text-xl font-semibold text-white">
                  Locks Growth
                </h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9CA3AF", fontSize: 12 }}
                      className="text-gray-400"
                    />
                    <YAxis hide />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{
                        r: 6,
                        fill: "#10B981",
                        strokeWidth: 2,
                        stroke: "#065F46",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tabs and Network Selector */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
              <div className="flex flex-wrap gap-2">
                {["Tokens", "V2 Pools", "V3 Pools", "V4 Pools"].map((tab) => (
                  <button
                    key={tab}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                      activeTab === tab
                        ? "bg-green-600 text-white shadow-lg"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700"
                    }`}
                    onClick={() => setActiveTab(tab)}>
                    {tab}
                    <span className="ml-2 text-sm opacity-75">
                      ({getTabCount(tab)})
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-3 bg-gray-800 px-4 py-2 rounded-xl border border-gray-700">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white font-medium">Abstract</span>
              </div>
            </div>

            {/* Lock Table */}
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <LoadingSpinner size="large" />
                  <p className="text-gray-400">Loading locks...</p>
                </div>
              ) : (
                <LockTable
                  locks={getCurrentTabLocks()}
                  type={getCurrentTabType()}
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
