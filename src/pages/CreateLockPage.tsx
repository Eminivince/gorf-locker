import React, { useState, useEffect } from "react";
import { Lock, AlertCircle, CheckCircle } from "lucide-react";
import { useAccount } from "wagmi";
import { useTokenLocker } from "../hooks/useTokenLocker";
import { useTokenApproval } from "../hooks/useTokenApproval";
import { formatUnits, parseUnits, isAddress } from "viem";
import type { Address } from "viem";

import { ConnectWalletButton } from "../components/ConnectWalletButton";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { StatusModal } from "../components/StatusModal";

interface LockOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  isHot?: boolean;
  additionalInfo?: string;
}

const lockOptions: LockOption[] = [
  {
    id: "token",
    title: "Lock Token",
    description:
      "Create an ERC20 token lock. Supports full locking or TGE (Token Generation Event) cycle release mode.",
    icon: "🔒",
  },
  {
    id: "univ2",
    title: "Lock UniV2 Liquidity",
    description:
      "Create UniV2 Liquidity lock. Supports full locking or TGE (Token Generation Event) cycle release mode, with",
    icon: "V2",
    additionalInfo: "Multiple fee structures available.",
  },
  {
    id: "univ3",
    title: "Lock UniV3 Liquidity",
    description:
      "Create UniV3 Liquidity lock. Supports multiple fee structures.",
    icon: "V3",
    isHot: true,
    additionalInfo:
      "You can still collect liquidity stake earnings while the liquidity is locked.",
  },
  {
    id: "univ4",
    title: "Lock UniV4 Liquidity",
    description:
      "Create UniV4 Liquidity lock. Supports multiple fee structures.",
    icon: "V4",
    isHot: true,
    additionalInfo:
      "You can still collect liquidity stake earnings while the liquidity is locked.",
  },
];

export const CreateLockPage: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [selectedLockType, setSelectedLockType] = useState<string | null>(null);
  const [isTGEEnabled, setIsTGEEnabled] = useState(false);
  const [formData, setFormData] = useState({
    chain: "Abstract",
    tokenAddress: "",
    lpAddress: "",
    amount: "",
    unlockTime: "",
    tgeTime: "",
    tgePercentage: "",
    cycle: "",
    cyclePercentage: "",
    selectPool: "ReservoirV3",
    nftId: "",
  });
  const [selectedFeeStructure, setSelectedFeeStructure] = useState("default");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "warning";
    title: string;
    message: string;
    details?: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  // Contract hooks
  const tokenLocker = useTokenLocker();
  const tokenApproval = useTokenApproval(
    formData.tokenAddress && isAddress(formData.tokenAddress)
      ? (formData.tokenAddress as Address)
      : undefined,
    address
  );

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  // Format date for datetime-local input (YYYY-MM-DDTHH:MM)
  const formatDateTimeLocal = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Convert datetime-local value to ISO string
  const handleDateTimeChange = (field: string, value: string) => {
    if (value) {
      const date = new Date(value);
      handleInputChange(field, date.toISOString());
    } else {
      handleInputChange(field, "");
    }
  };

  const handleLockOptionClick = (lockType: string) => {
    setSelectedLockType(lockType);
  };

  // Validation effects
  useEffect(() => {
    validateForm();
  }, [formData, tokenApproval.balance, tokenApproval.decimals]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Common validations for token and LP locks
    if (selectedLockType === "token" || selectedLockType === "univ2") {
      // Validate token/LP address
      const addressField =
        selectedLockType === "token" ? "tokenAddress" : "lpAddress";
      const addressValue = formData[addressField];

      if (addressValue) {
        if (!isAddress(addressValue)) {
          newErrors[addressField] = `Invalid ${
            selectedLockType === "token" ? "token" : "LP"
          } address`;
        } else if (
          selectedLockType === "token" &&
          tokenApproval.balance === BigInt(0)
        ) {
          newErrors[addressField] = "You don't own this token";
        }
      }

      // Validate amount
      if (formData.amount) {
        try {
          if (selectedLockType === "token") {
            const amount = parseUnits(formData.amount, tokenApproval.decimals);
            if (amount > tokenApproval.balance) {
              newErrors.amount = "Amount exceeds your balance";
            }
            if (amount <= BigInt(0)) {
              newErrors.amount = "Amount must be greater than 0";
            }
          } else {
            // For LP tokens, basic validation
            const amount = parseFloat(formData.amount);
            if (amount <= 0) {
              newErrors.amount = "Amount must be greater than 0";
            }
          }
        } catch {
          newErrors.amount = "Invalid amount";
        }
      }
    }

    // Validate NFT ID for V3/V4
    if (
      (selectedLockType === "univ3" || selectedLockType === "univ4") &&
      formData.nftId
    ) {
      const nftId = parseInt(formData.nftId);
      if (isNaN(nftId) || nftId <= 0) {
        newErrors.nftId = "Invalid NFT ID";
      }
    }

    // Validate unlock time (required for all types)
    if (formData.unlockTime) {
      const unlockDate = new Date(formData.unlockTime);
      if (unlockDate <= new Date()) {
        newErrors.unlockTime = "Unlock time must be in the future";
      }
    }

    // TGE validations (only for token and univ2)
    if (
      isTGEEnabled &&
      (selectedLockType === "token" || selectedLockType === "univ2")
    ) {
      if (formData.tgeTime) {
        const tgeDate = new Date(formData.tgeTime);
        if (tgeDate <= new Date()) {
          newErrors.tgeTime = "TGE time must be in the future";
        }
        if (formData.unlockTime && tgeDate >= new Date(formData.unlockTime)) {
          newErrors.tgeTime = "TGE time must be before unlock time";
        }
      }

      if (formData.tgePercentage) {
        const percentage = parseFloat(formData.tgePercentage);
        if (percentage <= 0 || percentage >= 100) {
          newErrors.tgePercentage = "TGE percentage must be between 0 and 100";
        }
      }

      if (formData.cycle) {
        const cycle = parseInt(formData.cycle);
        if (cycle <= 0) {
          newErrors.cycle = "Cycle must be greater than 0";
        }
      }

      if (formData.cyclePercentage) {
        const percentage = parseFloat(formData.cyclePercentage);
        if (percentage <= 0 || percentage > 100) {
          newErrors.cyclePercentage =
            "Cycle percentage must be between 0 and 100";
        }

        // Validate total percentage doesn't exceed 100%
        if (formData.tgePercentage) {
          const tgePerc = parseFloat(formData.tgePercentage);
          if (tgePerc + percentage > 100) {
            newErrors.cyclePercentage =
              "TGE + Cycle percentage cannot exceed 100%";
          }
        }
      }
    }

    setErrors(newErrors);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMaxClick = () => {
    if (tokenApproval.balance && tokenApproval.decimals) {
      const maxAmount = formatUnits(
        tokenApproval.balance,
        tokenApproval.decimals
      );
      handleInputChange("amount", maxAmount);
    }
  };

  const handleTGEToggle = () => {
    setIsTGEEnabled(!isTGEEnabled);
  };

  const handleApprove = async () => {
    if (!needsApproval()) {
      await handleCreateLock();
      return;
    }

    try {
      await tokenApproval.approve(formData.amount);
    } catch (error) {
      console.error("Approval failed:", error);
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Approval Failed",
        message: "Failed to approve token spending. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Watch for approval confirmation and refetch allowance
  useEffect(() => {
    if (tokenApproval.isConfirmed) {
      tokenApproval.refetchAllowance();
    }
  }, [tokenApproval.isConfirmed]);

  // Watch for lock creation confirmation
  useEffect(() => {
    if (tokenLocker.isConfirmed) {
      // Show success message
      const lockTypeNames: Record<string, string> = {
        token: "Token",
        univ2: "UniV2 Liquidity",
        univ3: "UniV3 Liquidity",
        univ4: "UniV4 Liquidity",
      };
      setStatusModal({
        isOpen: true,
        type: "success",
        title: "Lock Created Successfully!",
        message: `${
          lockTypeNames[selectedLockType || "token"]
        } lock has been created successfully.`,
        details: tokenLocker.hash
          ? `Transaction Hash: ${tokenLocker.hash}`
          : undefined,
      });

      // Reset form on success
      setFormData({
        chain: "Abstract",
        tokenAddress: "",
        lpAddress: "",
        amount: "",
        unlockTime: "",
        tgeTime: "",
        tgePercentage: "",
        cycle: "",
        cyclePercentage: "",
        selectPool: "ReservoirV3",
        nftId: "",
      });
      setIsTGEEnabled(false);
      setSelectedFeeStructure("default");
    }
  }, [tokenLocker.isConfirmed, selectedLockType, tokenLocker.hash]);

  // Watch for transaction errors
  useEffect(() => {
    if (tokenLocker.error) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Transaction Failed",
        message: "The transaction failed. Please try again.",
        details: tokenLocker.error.message || "Unknown error occurred",
      });
    }
  }, [tokenLocker.error]);

  const handleCreateLock = async () => {
    try {
      const feeType = getFeeType();

      const unlockTime = Math.floor(
        new Date(formData.unlockTime).getTime() / 1000
      );

      if (selectedLockType === "token") {
        // Token Lock

        if (isTGEEnabled) {
          const tgeTime = Math.floor(
            new Date(formData.tgeTime).getTime() / 1000
          );
          const tgePercentage = parseFloat(formData.tgePercentage);
          const cycle = parseInt(formData.cycle);
          const cyclePercentage = parseFloat(formData.cyclePercentage);

          await tokenLocker.createVestingLock({
            token: formData.tokenAddress as Address,
            amount: formData.amount,
            unlockTime,
            feeType,
            decimals: tokenApproval.decimals,
            tgeTime,
            tgePercentage,
            cycle,
            cyclePercentage,
          });
        } else {
          await tokenLocker.createNormalLock({
            token: formData.tokenAddress as Address,
            amount: formData.amount,
            unlockTime,
            feeType,
            decimals: tokenApproval.decimals,
          });
        }
      } else if (selectedLockType === "univ2") {
        // UniV2 LP Lock
        if (isTGEEnabled) {
          const tgeTime = Math.floor(
            new Date(formData.tgeTime).getTime() / 1000
          );
          const tgePercentage = parseFloat(formData.tgePercentage);
          const cycle = parseInt(formData.cycle);
          const cyclePercentage = parseFloat(formData.cyclePercentage);

          await tokenLocker.createVestingLock({
            token: formData.lpAddress as Address,
            amount: formData.amount,
            unlockTime,
            feeType,
            decimals: 18, // LP tokens typically use 18 decimals
            tgeTime,
            tgePercentage,
            cycle,
            cyclePercentage,
          });
        } else {
          await tokenLocker.createNormalLock({
            token: formData.lpAddress as Address,
            amount: formData.amount,
            unlockTime,
            feeType,
            decimals: 18, // LP tokens typically use 18 decimals
          });
        }
      } else if (selectedLockType === "univ3") {
        // UniV3 NFT Lock - For now, we'll treat it as a special token lock
        // In a real implementation, this would call a different contract function
        await tokenLocker.createNormalLock({
          token: `0x${formData.nftId.padStart(40, "0")}` as Address, // Mock address from NFT ID
          amount: "1", // NFTs are typically amount 1
          unlockTime,
          feeType,
          decimals: 0, // NFTs don't have decimals
        });
      } else if (selectedLockType === "univ4") {
        // UniV4 NFT Lock - Similar to V3
        await tokenLocker.createNormalLock({
          token: `0x${formData.nftId.padStart(40, "0")}` as Address, // Mock address from NFT ID
          amount: "1", // NFTs are typically amount 1
          unlockTime,
          feeType,
          decimals: 0, // NFTs don't have decimals
        });
      }
    } catch (error) {
      console.error("Lock creation failed:", error);
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Lock Creation Failed",
        message:
          "Failed to create lock. Please check your inputs and try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const getFeeType = () => {
    if (selectedLockType === "token") {
      return "TOKEN";
    } else if (selectedLockType === "univ2") {
      switch (selectedFeeStructure) {
        case "pay-with-lp":
          return "LP_ONLY";
        case "pay-with-eth-lp":
          return "LP_AND_ETH";
        default:
          return "LP_DEFAULT";
      }
    } else if (selectedLockType === "univ3" || selectedLockType === "univ4") {
      // For V3/V4, use the selected fee structure
      switch (selectedFeeStructure) {
        case "lvp":
          return "LP_ONLY";
        case "llp":
          return "LP_AND_ETH";
        default:
          return "LP_DEFAULT";
      }
    }
    return "TOKEN";
  };

  const isFormValid = () => {
    const hasNoErrors = Object.keys(errors).length === 0;
    const hasUnlockTime = formData.unlockTime;

    if (selectedLockType === "token") {
      const hasRequiredFields = formData.tokenAddress && formData.amount;
      const hasTGEFields =
        !isTGEEnabled ||
        (formData.tgeTime &&
          formData.tgePercentage &&
          formData.cycle &&
          formData.cyclePercentage);
      return hasNoErrors && hasRequiredFields && hasUnlockTime && hasTGEFields;
    } else if (selectedLockType === "univ2") {
      const hasRequiredFields = formData.lpAddress && formData.amount;
      const hasTGEFields =
        !isTGEEnabled ||
        (formData.tgeTime &&
          formData.tgePercentage &&
          formData.cycle &&
          formData.cyclePercentage);
      return hasNoErrors && hasRequiredFields && hasUnlockTime && hasTGEFields;
    } else if (selectedLockType === "univ3" || selectedLockType === "univ4") {
      const hasRequiredFields = formData.nftId;
      return hasNoErrors && hasRequiredFields && hasUnlockTime;
    }

    return false;
  };

  const needsApproval = () => {
    // Only token locks need approval for now
    if (selectedLockType === "token") {
      if (!formData.amount || !tokenApproval.decimals) return false;
      return !tokenApproval.checkApproval(formData.amount);
    }
    // LP locks, V3, and V4 locks would need their own approval logic
    // For now, we'll assume they don't need approval or handle it differently
    return false;
  };

  const handleFeeStructureSelect = (structure: string) => {
    setSelectedFeeStructure(structure);
  };

  const handleBackToOptions = () => {
    setSelectedLockType(null);
    // Reset form data
    setFormData({
      chain: "Abstract",
      tokenAddress: "",
      lpAddress: "",
      amount: "",
      unlockTime: "",
      tgeTime: "",
      tgePercentage: "",
      cycle: "",
      cyclePercentage: "",
      selectPool: "ReservoirV3",
      nftId: "",
    });
    setIsTGEEnabled(false);
    setSelectedFeeStructure("default");
    setErrors({});
  };

  const TokenLockForm = () => (
    <div className="max-w-2xl mx-auto bg-gray-900 rounded-2xl shadow-lg p-8 mt-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <button
          className="text-gray-400 hover:text-white mb-4 md:mb-0"
          onClick={handleBackToOptions}>
          ← Back to Options
        </button>
        <h1 className="text-2xl font-bold text-white">Create New Lock</h1>
        <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded-xl border border-gray-700">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-white font-medium text-sm">
            {address ? formatAddress(address) : "Not Connected"}
          </span>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex flex-col items-center text-center gap-4 md:w-1/3">
          <div className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl p-6 shadow-lg flex items-center justify-center">
            <Lock size={60} className="text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">New Token Lock</h2>
        </div>
        <form className="flex-1 space-y-6">
          <div>
            <label className="block text-gray-300 mb-1">Chain</label>
            <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
              <span className="w-3 h-3 bg-green-400 rounded-full mr-2"></span>
              <span className="text-white">Abstract</span>
            </div>
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Token Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={formData.tokenAddress}
              onChange={(e) =>
                handleInputChange("tokenAddress", e.target.value)
              }
              className={`w-full px-4 py-2 rounded-md border ${
                errors.tokenAddress ? "border-red-500" : "border-gray-700"
              } bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500`}
            />
            {errors.tokenAddress && (
              <div className="flex items-center text-red-500 mt-1 text-sm">
                <AlertCircle size={16} className="mr-1" />
                {errors.tokenAddress}
              </div>
            )}
            {formData.tokenAddress &&
              isAddress(formData.tokenAddress) &&
              tokenApproval.symbol && (
                <div className="flex items-center text-green-400 mt-1 text-sm">
                  <CheckCircle size={16} className="mr-1" />
                  <span>
                    {tokenApproval.name} ({tokenApproval.symbol})
                  </span>
                  <span className="ml-2 text-gray-400">
                    Balance:{" "}
                    {formatUnits(tokenApproval.balance, tokenApproval.decimals)}
                  </span>
                </div>
              )}
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Amount</label>
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Input number"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                className={`w-full px-4 py-2 rounded-md border ${
                  errors.amount ? "border-red-500" : "border-gray-700"
                } bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500`}
              />
              <button
                type="button"
                className="ml-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={handleMaxClick}>
                Max
              </button>
            </div>
            {errors.amount && (
              <div className="flex items-center text-red-500 mt-1 text-sm">
                <AlertCircle size={16} className="mr-1" />
                {errors.amount}
              </div>
            )}
          </div>
          <div>
            <label className="block text-gray-300 mb-1">
              TGE (Token Generation Event) cycle release mode
            </label>
            <div className="flex items-center">
              <span className="mr-2">Enable</span>
              <button
                type="button"
                onClick={handleTGEToggle}
                className={`w-10 h-6 flex items-center bg-gray-700 rounded-full p-1 duration-300 ease-in-out ${
                  isTGEEnabled ? "bg-green-500" : ""
                }`}>
                {" "}
                <span
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                    isTGEEnabled ? "translate-x-4" : ""
                  }`}></span>{" "}
              </button>
            </div>
          </div>
          {!isTGEEnabled ? (
            <div>
              <label className="block text-gray-300 mb-1">
                Unlock Time (UTC)
              </label>
              <input
                type="datetime-local"
                value={formatDateTimeLocal(formData.unlockTime)}
                onChange={(e) =>
                  handleDateTimeChange("unlockTime", e.target.value)
                }
                className={`w-full px-4 py-2 rounded-md border ${
                  errors.unlockTime ? "border-red-500" : "border-gray-700"
                } bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500`}
              />
              {errors.unlockTime && (
                <div className="flex items-center text-red-500 mt-1 text-sm">
                  <AlertCircle size={16} className="mr-1" />
                  {errors.unlockTime}
                </div>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-gray-300 mb-1">
                  TGE Time (UTC)
                </label>
                <input
                  type="datetime-local"
                  value={formatDateTimeLocal(formData.tgeTime)}
                  onChange={(e) =>
                    handleDateTimeChange("tgeTime", e.target.value)
                  }
                  className={`w-full px-4 py-2 rounded-md border ${
                    errors.tgeTime ? "border-red-500" : "border-gray-700"
                  } bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors.tgeTime && (
                  <div className="flex items-center text-red-500 mt-1 text-sm">
                    <AlertCircle size={16} className="mr-1" />
                    {errors.tgeTime}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-gray-300 mb-1">
                  TGE Percentage (%)
                </label>
                <input
                  type="number"
                  placeholder="Input number, 10 is for 10%"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.tgePercentage}
                  onChange={(e) =>
                    handleInputChange("tgePercentage", e.target.value)
                  }
                  className={`w-full px-4 py-2 rounded-md border ${
                    errors.tgePercentage ? "border-red-500" : "border-gray-700"
                  } bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors.tgePercentage && (
                  <div className="flex items-center text-red-500 mt-1 text-sm">
                    <AlertCircle size={16} className="mr-1" />
                    {errors.tgePercentage}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Cycle (day)</label>
                <input
                  type="number"
                  placeholder="Input number, 10 is for 10 days"
                  min="1"
                  step="1"
                  value={formData.cycle}
                  onChange={(e) => handleInputChange("cycle", e.target.value)}
                  className={`w-full px-4 py-2 rounded-md border ${
                    errors.cycle ? "border-red-500" : "border-gray-700"
                  } bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors.cycle && (
                  <div className="flex items-center text-red-500 mt-1 text-sm">
                    <AlertCircle size={16} className="mr-1" />
                    {errors.cycle}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-gray-300 mb-1">
                  Cycle Percentage (%)
                </label>
                <input
                  type="number"
                  placeholder="Input number, 10 is for 10%"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.cyclePercentage}
                  onChange={(e) =>
                    handleInputChange("cyclePercentage", e.target.value)
                  }
                  className={`w-full px-4 py-2 rounded-md border ${
                    errors.cyclePercentage
                      ? "border-red-500"
                      : "border-gray-700"
                  } bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors.cyclePercentage && (
                  <div className="flex items-center text-red-500 mt-1 text-sm">
                    <AlertCircle size={16} className="mr-1" />
                    {errors.cyclePercentage}
                  </div>
                )}
              </div>
              <div className="text-gray-400 text-xs mt-1">
                This is when the vesting schedule ends and all remaining tokens
                are unlocked
              </div>
            </>
          )}
          <button
            type="button"
            className="w-full mt-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition disabled:opacity-50"
            onClick={handleApprove}
            disabled={
              !isFormValid() ||
              tokenApproval.isPending ||
              tokenLocker.isPending ||
              tokenLocker.isConfirming
            }>
            {tokenApproval.isPending
              ? "Approving..."
              : tokenLocker.isPending
              ? "Creating Lock..."
              : tokenLocker.isConfirming
              ? "Confirming..."
              : needsApproval()
              ? "Approve"
              : "Create Lock"}
          </button>
        </form>
      </div>
    </div>
  );

  const UniV2LiquidityForm = () => (
    <div className="max-w-2xl mx-auto bg-gray-900 rounded-2xl shadow-lg p-8 mt-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <button
          className="text-gray-400 hover:text-white mb-4 md:mb-0"
          onClick={handleBackToOptions}>
          ← Back to Options
        </button>
        <h1 className="text-2xl font-bold text-white">
          Create UniV2 Liquidity Lock
        </h1>
        <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded-xl border border-gray-700">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-white font-medium text-sm">
            {address ? formatAddress(address) : "Not Connected"}
          </span>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex flex-col items-center text-center gap-4 md:w-1/3">
          <div className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl p-6 shadow-lg flex items-center justify-center">
            <div className="v2-icon-container">
              <div className="v2-icon">V2</div>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white">
            New V2 liquidity Lock
          </h2>
        </div>
        <form className="flex-1 space-y-6">
          <div>
            <label className="block text-gray-300 mb-1">Chain</label>
            <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
              <span className="w-3 h-3 bg-green-400 rounded-full mr-2"></span>
              <span className="text-white">Abstract</span>
            </div>
          </div>
          <div>
            <label className="block text-gray-300 mb-1">LP Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={formData.lpAddress}
              onChange={(e) => handleInputChange("lpAddress", e.target.value)}
              className={`w-full px-4 py-2 rounded-md border ${
                errors.lpAddress ? "border-red-500" : "border-gray-700"
              } bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500`}
            />
            {errors.lpAddress && (
              <div className="flex items-center text-red-500 mt-1 text-sm">
                <AlertCircle size={16} className="mr-1" />
                {errors.lpAddress}
              </div>
            )}
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Amount</label>
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Input number"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                className={`w-full px-4 py-2 rounded-md border ${
                  errors.amount ? "border-red-500" : "border-gray-700"
                } bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500`}
              />
              <button
                type="button"
                className="ml-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={handleMaxClick}>
                Max
              </button>
            </div>
            {errors.amount && (
              <div className="flex items-center text-red-500 mt-1 text-sm">
                <AlertCircle size={16} className="mr-1" />
                {errors.amount}
              </div>
            )}
          </div>
          <div>
            <label className="block text-gray-300 mb-1">
              TGE (Token Generation Event) cycle release mode
            </label>
            <div className="flex items-center">
              <span className="mr-2">Enable</span>
              <button
                type="button"
                onClick={handleTGEToggle}
                className={`w-10 h-6 flex items-center bg-gray-700 rounded-full p-1 duration-300 ease-in-out ${
                  isTGEEnabled ? "bg-green-500" : ""
                }`}>
                {" "}
                <span
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                    isTGEEnabled ? "translate-x-4" : ""
                  }`}></span>{" "}
              </button>
            </div>
          </div>
          {!isTGEEnabled ? (
            <div>
              <label className="block text-gray-300 mb-1">
                Unlock Time (UTC)
              </label>
              <input
                type="datetime-local"
                value={formatDateTimeLocal(formData.unlockTime)}
                onChange={(e) =>
                  handleDateTimeChange("unlockTime", e.target.value)
                }
                className={`w-full px-4 py-2 rounded-md border ${
                  errors.unlockTime ? "border-red-500" : "border-gray-700"
                } bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500`}
              />
              {errors.unlockTime && (
                <div className="flex items-center text-red-500 mt-1 text-sm">
                  <AlertCircle size={16} className="mr-1" />
                  {errors.unlockTime}
                </div>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-gray-300 mb-1">
                  TGE Time (UTC)
                </label>
                <input
                  type="datetime-local"
                  value={formatDateTimeLocal(formData.tgeTime)}
                  onChange={(e) =>
                    handleDateTimeChange("tgeTime", e.target.value)
                  }
                  className={`w-full px-4 py-2 rounded-md border ${
                    errors.tgeTime ? "border-red-500" : "border-gray-700"
                  } bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors.tgeTime && (
                  <div className="flex items-center text-red-500 mt-1 text-sm">
                    <AlertCircle size={16} className="mr-1" />
                    {errors.tgeTime}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-gray-300 mb-1">
                  TGE Percentage (%)
                </label>
                <input
                  type="number"
                  placeholder="Input number, 10 is for 10%"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.tgePercentage}
                  onChange={(e) =>
                    handleInputChange("tgePercentage", e.target.value)
                  }
                  className={`w-full px-4 py-2 rounded-md border ${
                    errors.tgePercentage ? "border-red-500" : "border-gray-700"
                  } bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors.tgePercentage && (
                  <div className="flex items-center text-red-500 mt-1 text-sm">
                    <AlertCircle size={16} className="mr-1" />
                    {errors.tgePercentage}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Cycle (day)</label>
                <input
                  type="number"
                  placeholder="Input number, 10 is for 10 days"
                  min="1"
                  step="1"
                  value={formData.cycle}
                  onChange={(e) => handleInputChange("cycle", e.target.value)}
                  className={`w-full px-4 py-2 rounded-md border ${
                    errors.cycle ? "border-red-500" : "border-gray-700"
                  } bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors.cycle && (
                  <div className="flex items-center text-red-500 mt-1 text-sm">
                    <AlertCircle size={16} className="mr-1" />
                    {errors.cycle}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-gray-300 mb-1">
                  Cycle Percentage (%)
                </label>
                <input
                  type="number"
                  placeholder="Input number, 10 is for 10%"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.cyclePercentage}
                  onChange={(e) =>
                    handleInputChange("cyclePercentage", e.target.value)
                  }
                  className={`w-full px-4 py-2 rounded-md border ${
                    errors.cyclePercentage
                      ? "border-red-500"
                      : "border-gray-700"
                  } bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors.cyclePercentage && (
                  <div className="flex items-center text-red-500 mt-1 text-sm">
                    <AlertCircle size={16} className="mr-1" />
                    {errors.cyclePercentage}
                  </div>
                )}
              </div>
              <div className="text-gray-400 text-xs mt-1">
                This is when the vesting schedule ends and all remaining tokens
                are unlocked
              </div>
            </>
          )}
          <div className="form-group">
            <label>Fee Structures</label>
            <div className="fee-structures-grid">
              <div
                className={`fee-structure-card ${
                  selectedFeeStructure === "default" ? "selected" : ""
                }`}
                onClick={() => handleFeeStructureSelect("default")}>
                <div className="fee-structure-header">
                  <span className="fee-structure-title">Default</span>
                </div>
                <div className="fee-structure-content">
                  <span className="fee-amount">0.02 ETH</span>
                </div>
              </div>

              <div
                className={`fee-structure-card ${
                  selectedFeeStructure === "pay-with-lp" ? "selected" : ""
                }`}
                onClick={() => handleFeeStructureSelect("pay-with-lp")}>
                <div className="fee-structure-header">
                  <span className="fee-structure-title">Pay with LP</span>
                </div>
                <div className="fee-structure-content">
                  <span className="fee-description">
                    We will directly extract 0.6% of the liquidity as fee.
                  </span>
                </div>
              </div>

              <div
                className={`fee-structure-card ${
                  selectedFeeStructure === "pay-with-eth-lp" ? "selected" : ""
                }`}
                onClick={() => handleFeeStructureSelect("pay-with-eth-lp")}>
                <div className="fee-structure-header">
                  <span className="fee-structure-title">
                    Pay with ETH and LP
                  </span>
                </div>
                <div className="fee-structure-content">
                  <span className="fee-description">
                    We will charge 0.01 ETH and extract 0.3% of LP as fee.
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="w-full mt-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition disabled:opacity-50"
            onClick={handleApprove}
            disabled={
              !isFormValid() ||
              tokenLocker.isPending ||
              tokenLocker.isConfirming
            }>
            {tokenLocker.isPending
              ? "Creating Lock..."
              : tokenLocker.isConfirming
              ? "Confirming..."
              : "Create Lock"}
          </button>
        </form>
      </div>
    </div>
  );

  const UniV3LiquidityForm = () => (
    <div className="max-w-2xl mx-auto bg-gray-900 rounded-2xl shadow-lg p-8 mt-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <button
          className="text-gray-400 hover:text-white mb-4 md:mb-0"
          onClick={handleBackToOptions}>
          ← Back to Options
        </button>
        <h1 className="text-2xl font-bold text-white">
          Create UniV3 Liquidity Lock
        </h1>
        <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded-xl border border-gray-700">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-white font-medium text-sm">
            {address ? formatAddress(address) : "Not Connected"}
          </span>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex flex-col items-center text-center gap-4 md:w-1/3">
          <div className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl p-6 shadow-lg flex items-center justify-center">
            <div className="v3-icon-container">
              <div className="v3-icon">V3</div>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white">
            Create UniV3 Liquidity Lock
          </h2>
          <p className="text-gray-400">
            You can still collect Liquidity Stake Earnings while the liquidity
            is locked.
          </p>
        </div>
        <form className="flex-1 space-y-6">
          <div>
            <label className="block text-gray-300 mb-1">Chain</label>
            <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
              <span className="w-3 h-3 bg-green-400 rounded-full mr-2"></span>
              <span className="text-white">Abstract</span>
            </div>
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Select Pool</label>
            <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
              <span className="text-white">ReservoirV3</span>
            </div>
          </div>
          <div>
            <label className="block text-gray-300 mb-1">NFT ID</label>
            <input
              type="text"
              placeholder="Input NFT ID"
              value={formData.nftId}
              onChange={(e) => handleInputChange("nftId", e.target.value)}
              className={`w-full px-4 py-2 rounded-md border ${
                errors.nftId ? "border-red-500" : "border-gray-700"
              } bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500`}
            />
            {errors.nftId && (
              <div className="flex items-center text-red-500 mt-1 text-sm">
                <AlertCircle size={16} className="mr-1" />
                {errors.nftId}
              </div>
            )}
          </div>
          <div>
            <label className="block text-gray-300 mb-1">
              Unlock Time (UTC)
            </label>
            <input
              type="datetime-local"
              value={formatDateTimeLocal(formData.unlockTime)}
              onChange={(e) =>
                handleDateTimeChange("unlockTime", e.target.value)
              }
              className={`w-full px-4 py-2 rounded-md border ${
                errors.unlockTime ? "border-red-500" : "border-gray-700"
              } bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500`}
            />
            {errors.unlockTime && (
              <div className="flex items-center text-red-500 mt-1 text-sm">
                <AlertCircle size={16} className="mr-1" />
                {errors.unlockTime}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Fee Structures</label>
            <div className="fee-structures-grid">
              <div
                className={`fee-structure-card ${
                  selectedFeeStructure === "default" ? "selected" : ""
                }`}
                onClick={() => handleFeeStructureSelect("default")}>
                <div className="fee-structure-header">
                  <span className="fee-structure-title">Default</span>
                </div>
                <div className="fee-structure-content">
                  <span className="fee-description">
                    We will extract 0.4% the liquidity as fee, and 1.6%
                    Liquidity Stake Earnings each time you collect it.
                  </span>
                </div>
              </div>

              <div
                className={`fee-structure-card ${
                  selectedFeeStructure === "lvp" ? "selected" : ""
                }`}
                onClick={() => handleFeeStructureSelect("lvp")}>
                <div className="fee-structure-header">
                  <span className="fee-structure-title">LVP</span>
                </div>
                <div className="fee-structure-content">
                  <span className="fee-description">
                    We will extract 0.64% the liquidity as fee, and 0.8%
                    Liquidity Stake Earnings each time you collect it.
                  </span>
                </div>
              </div>

              <div
                className={`fee-structure-card ${
                  selectedFeeStructure === "llp" ? "selected" : ""
                }`}
                onClick={() => handleFeeStructureSelect("llp")}>
                <div className="fee-structure-header">
                  <span className="fee-structure-title">LLP</span>
                </div>
                <div className="fee-structure-content">
                  <span className="fee-description">
                    We will extract 0.24% the liquidity as fee, and 2.8%
                    Liquidity Stake Earnings each time you collect it.
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="w-full mt-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition disabled:opacity-50"
            onClick={handleApprove}
            disabled={
              !isFormValid() ||
              tokenLocker.isPending ||
              tokenLocker.isConfirming
            }>
            {tokenLocker.isPending
              ? "Creating Lock..."
              : tokenLocker.isConfirming
              ? "Confirming..."
              : "Create Lock"}
          </button>
        </form>
      </div>
    </div>
  );

  const UniV4LiquidityForm = () => (
    <div className="max-w-2xl mx-auto bg-gray-900 rounded-2xl shadow-lg p-8 mt-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <button
          className="text-gray-400 hover:text-white mb-4 md:mb-0"
          onClick={handleBackToOptions}>
          ← Back to Options
        </button>
        <h1 className="text-2xl font-bold text-white">
          Create UniV4 Liquidity Lock
        </h1>
        <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded-xl border border-gray-700">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-white font-medium text-sm">
            {address ? formatAddress(address) : "Not Connected"}
          </span>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex flex-col items-center text-center gap-4 md:w-1/3">
          <div className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl p-6 shadow-lg flex items-center justify-center">
            <div className="v4-icon-container">
              <div className="v4-icon">V4</div>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white">
            Create UniV4 Liquidity Lock
          </h2>
          <p className="text-gray-400">
            You can still collect Liquidity Stake Earnings while the liquidity
            is locked.
          </p>
        </div>
        <form className="flex-1 space-y-6">
          <div>
            <label className="block text-gray-300 mb-1">Chain</label>
            <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
              <span className="w-3 h-3 bg-green-400 rounded-full mr-2"></span>
              <span className="text-white">Base Chain</span>
            </div>
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Select Pool</label>
            <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
              <span className="text-white">UniV4</span>
            </div>
          </div>
          <div>
            <label className="block text-gray-300 mb-1">NFT ID</label>
            <input
              type="text"
              placeholder="Input NFT ID"
              value={formData.nftId}
              onChange={(e) => handleInputChange("nftId", e.target.value)}
              className={`w-full px-4 py-2 rounded-md border ${
                errors.nftId ? "border-red-500" : "border-gray-700"
              } bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500`}
            />
            {errors.nftId && (
              <div className="flex items-center text-red-500 mt-1 text-sm">
                <AlertCircle size={16} className="mr-1" />
                {errors.nftId}
              </div>
            )}
          </div>
          <div>
            <label className="block text-gray-300 mb-1">
              Unlock Time (UTC)
            </label>
            <input
              type="datetime-local"
              value={formatDateTimeLocal(formData.unlockTime)}
              onChange={(e) =>
                handleDateTimeChange("unlockTime", e.target.value)
              }
              className={`w-full px-4 py-2 rounded-md border ${
                errors.unlockTime ? "border-red-500" : "border-gray-700"
              } bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500`}
            />
            {errors.unlockTime && (
              <div className="flex items-center text-red-500 mt-1 text-sm">
                <AlertCircle size={16} className="mr-1" />
                {errors.unlockTime}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Fee Structures</label>
            <div className="fee-structures-grid">
              <div
                className={`fee-structure-card ${
                  selectedFeeStructure === "default" ? "selected" : ""
                }`}
                onClick={() => handleFeeStructureSelect("default")}>
                <div className="fee-structure-header">
                  <span className="fee-structure-title">Default</span>
                </div>
                <div className="fee-structure-content">
                  <span className="fee-description">
                    We will extract 0.4% the liquidity and 0.05 ETH as fee, and
                    1.6% Liquidity Stake Earnings each time you collect it.
                  </span>
                </div>
              </div>

              <div
                className={`fee-structure-card ${
                  selectedFeeStructure === "lvp" ? "selected" : ""
                }`}
                onClick={() => handleFeeStructureSelect("lvp")}>
                <div className="fee-structure-header">
                  <span className="fee-structure-title">LVP</span>
                </div>
                <div className="fee-structure-content">
                  <span className="fee-description">
                    We will extract 0.64% the liquidity as fee, and 0.8%
                    Liquidity Stake Earnings each time you collect it.
                  </span>
                </div>
              </div>

              <div
                className={`fee-structure-card ${
                  selectedFeeStructure === "llp" ? "selected" : ""
                }`}
                onClick={() => handleFeeStructureSelect("llp")}>
                <div className="fee-structure-header">
                  <span className="fee-structure-title">LLP</span>
                </div>
                <div className="fee-structure-content">
                  <span className="fee-description">
                    We will extract 0.24% the liquidity as fee, and 2.8%
                    Liquidity Stake Earnings each time you collect it.
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="w-full mt-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition disabled:opacity-50"
            onClick={handleApprove}
            disabled={
              !isFormValid() ||
              tokenLocker.isPending ||
              tokenLocker.isConfirming
            }>
            {tokenLocker.isPending
              ? "Creating Lock..."
              : tokenLocker.isConfirming
              ? "Confirming..."
              : "Create Lock"}
          </button>
        </form>
      </div>
    </div>
  );

  const LockOptionsState = () => (
    <div className="max-w-4xl mx-auto pt-4 sm:pt-8 px-2 sm:px-0">
      <h1 className="text-2xl sm:text-4xl font-bold text-white mb-6 sm:mb-10 text-center">
        Create New Lock
      </h1>
      <div className="flex flex-col gap-4 sm:gap-8">
        {lockOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleLockOptionClick(option.id)}
            className="relative flex items-center w-full rounded-xl sm:rounded-2xl px-4 py-5 sm:px-8 sm:py-8 bg-gradient-to-br from-green-500 via-green-400 to-blue-500 shadow-lg hover:scale-[1.01] transition-transform focus:outline-none border-0 active:scale-95">
            {/* Icon */}
            <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 sm:w-24 sm:h-24 rounded-lg sm:rounded-xl bg-white/20 mr-4 sm:mr-8">
              {option.icon === "🔒" ? (
                <span className="text-3xl sm:text-6xl">🔒</span>
              ) : (
                <span className="text-2xl sm:text-5xl font-bold text-white drop-shadow-lg">
                  {option.icon}
                </span>
              )}
            </div>
            {/* Text */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <span className="text-lg sm:text-2xl md:text-3xl font-bold text-white drop-shadow-sm">
                  {option.title}
                </span>
                {option.isHot && (
                  <span className="absolute top-0 right-0 bg-gradient-to-br from-orange-500 to-red-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-tr-xl sm:rounded-tr-2xl rounded-bl-xl sm:rounded-bl-2xl shadow-md">
                    HOT
                  </span>
                )}
              </div>
              <p className="text-white/90 text-xs sm:text-base md:text-lg leading-snug">
                {option.description}
                {option.additionalInfo && (
                  <span className="block text-black font-semibold mt-1">
                    {option.additionalInfo}
                  </span>
                )}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-8 relative">
            {/* 3D Wallet Icon */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl transform rotate-12 opacity-80"></div>
            <div className="absolute inset-2 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl transform -rotate-6"></div>
            <div className="absolute inset-4 bg-gradient-to-br from-blue-300 to-purple-400 rounded-lg flex items-center justify-center">
              <svg
                className="w-12 h-12 text-white"
                fill="currentColor"
                viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Connect Wallet to Create New Lock
          </h1>
          <p className="text-gray-400 mb-8">
            Please connect your wallet to start creating locks
          </p>
          <ConnectWalletButton />
        </div>
        {/* Status Modal and LoadingSpinner overlays */}
        <StatusModal
          isOpen={statusModal.isOpen}
          onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          details={statusModal.details}
        />
        {(tokenLocker.isPending ||
          tokenLocker.isConfirming ||
          tokenApproval.isPending) && (
          <LoadingSpinner
            overlay={true}
            size="large"
            text={
              tokenApproval.isPending
                ? "Approving token spending..."
                : tokenLocker.isPending
                ? "Creating lock..."
                : tokenLocker.isConfirming
                ? "Confirming transaction..."
                : "Processing..."
            }
          />
        )}
      </div>
    );
  }

  if (selectedLockType) {
    return (
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="token-lock-form-container">
            {selectedLockType === "token" && <TokenLockForm />}
            {selectedLockType === "univ2" && <UniV2LiquidityForm />}
            {selectedLockType === "univ3" && <UniV3LiquidityForm />}
            {selectedLockType === "univ4" && <UniV4LiquidityForm />}
          </div>
        </div>
        {/* Status Modal and LoadingSpinner overlays */}
        <StatusModal
          isOpen={statusModal.isOpen}
          onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          details={statusModal.details}
        />
        {(tokenLocker.isPending ||
          tokenLocker.isConfirming ||
          tokenApproval.isPending) && (
          <LoadingSpinner
            overlay={true}
            size="large"
            text={
              tokenApproval.isPending
                ? "Approving token spending..."
                : tokenLocker.isPending
                ? "Creating lock..."
                : tokenLocker.isConfirming
                ? "Confirming transaction..."
                : "Processing..."
            }
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-950">
      <LockOptionsState />
      {/* Status Modal and LoadingSpinner overlays */}
      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        details={statusModal.details}
      />
      {(tokenLocker.isPending ||
        tokenLocker.isConfirming ||
        tokenApproval.isPending) && (
        <LoadingSpinner
          overlay={true}
          size="large"
          text={
            tokenApproval.isPending
              ? "Approving token spending..."
              : tokenLocker.isPending
              ? "Creating lock..."
              : tokenLocker.isConfirming
              ? "Confirming transaction..."
              : "Processing..."
          }
        />
      )}
    </div>
  );
};
