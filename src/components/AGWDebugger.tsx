import React, { useState } from "react";
import { parseUnits, formatUnits } from "viem";
import { useWalletMode } from "../App";

export const AGWDebugger: React.FC = () => {
  const [testAmount, setTestAmount] = useState("1.0");
  const [testDecimals, setTestDecimals] = useState(18);
  const { useAbstractWallet } = useWalletMode();

  const convertAmount = (amount: string, decimals: number = 18) => {
    const normalAmount = parseUnits(amount, decimals);

    if (useAbstractWallet) {
      // AGW compensation: divide by 10^12
      const adjustedAmount = normalAmount / BigInt(10 ** 12);
      return adjustedAmount;
    } else {
      return normalAmount;
    }
  };

  const normalAmount = parseUnits(testAmount, testDecimals);
  const convertedAmount = convertAmount(testAmount, testDecimals);
  const backToDecimal = formatUnits(convertedAmount, testDecimals);

  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        AGW Amount Debugger
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-gray-300 mb-1">Test Amount</label>
          <input
            type="text"
            value={testAmount}
            onChange={(e) => setTestAmount(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
            placeholder="1.0"
          />
        </div>
        <div>
          <label className="block text-gray-300 mb-1">Decimals</label>
          <input
            type="number"
            value={testDecimals}
            onChange={(e) => setTestDecimals(parseInt(e.target.value) || 18)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
            placeholder="18"
          />
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="text-white">
          <strong>Wallet Mode:</strong>{" "}
          {useAbstractWallet ? "Abstract Global Wallet" : "Standard Wallet"}
        </div>
        <div className="text-gray-300">
          <strong>Original Amount:</strong> {testAmount}
        </div>
        <div className="text-gray-300">
          <strong>Normal parseUnits Result:</strong> {normalAmount.toString()}
        </div>
        <div className="text-green-400">
          <strong>Converted Amount (for AGW):</strong>{" "}
          {convertedAmount.toString()}
        </div>
        <div className="text-blue-400">
          <strong>Back to Decimal:</strong> {backToDecimal}
        </div>
        {useAbstractWallet && (
          <div className="text-yellow-400">
            <strong>Adjustment Factor:</strong> Divided by 10^12
            (1,000,000,000,000)
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-gray-700 rounded">
        <h4 className="text-white font-semibold mb-2">Explanation:</h4>
        <p className="text-gray-300 text-sm">
          {useAbstractWallet
            ? "AGW appears to add 12 extra zeros to transaction amounts. This debugger shows how we compensate by dividing by 10^12."
            : "Standard wallets use parseUnits directly without any adjustment."}
        </p>
      </div>
    </div>
  );
};
