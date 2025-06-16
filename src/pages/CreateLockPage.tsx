import React, { useState, useEffect } from "react";
import { Lock, AlertCircle, CheckCircle } from "lucide-react";
import { useAccount } from "wagmi";
import { useTokenLocker } from "../hooks/useTokenLocker";
import { useTokenApproval } from "../hooks/useTokenApproval";
import { useUniV3NFT } from "../hooks/useUniV3NFT";
import { useUniv3LPLocker } from "../hooks/useUniv3LPLocker";
// import { useTokenPairInfo } from "../hooks/useTokenInfo";
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
  const univ3LPLocker = useUniv3LPLocker();

  const tokenApproval = useTokenApproval(
    formData.tokenAddress && isAddress(formData.tokenAddress)
      ? (formData.tokenAddress as Address)
      : undefined,
    address
  );

  // Add LP token approval hook
  const lpTokenApproval = useTokenApproval(
    formData.lpAddress && isAddress(formData.lpAddress)
      ? (formData.lpAddress as Address)
      : undefined,
    address
  );

  // Add UniV3 NFT hook
  const uniV3NFT = useUniV3NFT(
    formData.nftId && formData.nftId.trim() !== "" ? formData.nftId : undefined,
    address
  );

  // Get token pair info for UniV3 position
  // const tokenPairInfo = useTokenPairInfo(
  //   uniV3NFT.position?.token0,
  //   uniV3NFT.position?.token1
  // );

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
  }, [
    formData,
    tokenApproval.balance,
    tokenApproval.decimals,
    lpTokenApproval.balance,
    lpTokenApproval.decimals,
    uniV3NFT.isOwner,
    uniV3NFT.hasLiquidity,
  ]);

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
        } else if (
          selectedLockType === "univ2" &&
          lpTokenApproval.balance === BigInt(0)
        ) {
          newErrors[addressField] = "You don't own this LP token";
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
          } else if (selectedLockType === "univ2") {
            // For LP tokens, use proper validation
            const amount = parseUnits(
              formData.amount,
              lpTokenApproval.decimals
            );
            if (amount > lpTokenApproval.balance) {
              newErrors.amount = "Amount exceeds your LP balance";
            }
            if (amount <= BigInt(0)) {
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
      } else if (selectedLockType === "univ3") {
        // UniV3 specific validations
        if (!uniV3NFT.isOwner && formData.nftId) {
          newErrors.nftId = "You don't own this NFT";
        } else if (!uniV3NFT.hasLiquidity && formData.nftId) {
          newErrors.nftId = "This NFT position has no liquidity";
        }
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
    if (
      selectedLockType === "token" &&
      tokenApproval.balance &&
      tokenApproval.decimals
    ) {
      const maxAmount = formatUnits(
        tokenApproval.balance,
        tokenApproval.decimals
      );
      handleInputChange("amount", maxAmount);
    } else if (
      selectedLockType === "univ2" &&
      lpTokenApproval.balance &&
      lpTokenApproval.decimals
    ) {
      const maxAmount = formatUnits(
        lpTokenApproval.balance,
        lpTokenApproval.decimals
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
      if (selectedLockType === "token") {
        await tokenApproval.approve(formData.amount);
      } else if (selectedLockType === "univ2") {
        await lpTokenApproval.approve(formData.amount);
      } else if (selectedLockType === "univ3") {
        await uniV3NFT.approve();
      }
    } catch (error) {
      console.error("Approval failed:", error);
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Approval Failed",
        message: `Failed to approve ${
          selectedLockType === "token"
            ? "token"
            : selectedLockType === "univ2"
            ? "LP token"
            : "NFT"
        } ${
          selectedLockType === "univ3" ? "for spending" : "spending"
        }. Please try again.`,
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

  // Watch for LP token approval confirmation
  useEffect(() => {
    if (lpTokenApproval.isConfirmed) {
      lpTokenApproval.refetchAllowance();
    }
  }, [lpTokenApproval.isConfirmed]);

  // Watch for UniV3 NFT approval confirmation
  useEffect(() => {
    if (uniV3NFT.isConfirmed) {
      uniV3NFT.refetchApproval();
    }
  }, [uniV3NFT.isConfirmed]);

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

  // Watch for UniV3 lock creation confirmation
  useEffect(() => {
    if (univ3LPLocker.isConfirmed) {
      // Show success message
      setStatusModal({
        isOpen: true,
        type: "success",
        title: "UniV3 Lock Created Successfully!",
        message: "UniV3 Liquidity lock has been created successfully.",
        details: univ3LPLocker.hash
          ? `Transaction Hash: ${univ3LPLocker.hash}`
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
      setSelectedFeeStructure("default");
    }
  }, [univ3LPLocker.isConfirmed, univ3LPLocker.hash]);

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

  // Watch for UniV3 transaction errors
  useEffect(() => {
    if (univ3LPLocker.error) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "UniV3 Transaction Failed",
        message: "The UniV3 lock transaction failed. Please try again.",
        details: univ3LPLocker.error.message || "Unknown error occurred",
      });
    }
  }, [univ3LPLocker.error]);

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
            decimals: lpTokenApproval.decimals,
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
            decimals: lpTokenApproval.decimals,
          });
        }
      } else if (selectedLockType === "univ3") {
        // UniV3 NFT Lock using Univ3LPLocker contract
        const nftManager = "0xfA928D3ABc512383b8E5E77edd2d5678696084F9"; // ReservoirV3 address
        const feeName =
          selectedFeeStructure === "lvp"
            ? "LVP"
            : selectedFeeStructure === "llp"
            ? "LLP"
            : "DEFAULT";

        await univ3LPLocker.createLock({
          nftManager: nftManager as Address,
          nftId: formData.nftId,
          collector: address as Address, // Use connected wallet as collector
          unlockTime,
          feeName,
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
    if (selectedLockType === "token") {
      if (!formData.amount || !tokenApproval.decimals) return false;
      return !tokenApproval.checkApproval(formData.amount);
    } else if (selectedLockType === "univ2") {
      if (!formData.amount || !lpTokenApproval.decimals) return false;
      return !lpTokenApproval.checkApproval(formData.amount);
    } else if (selectedLockType === "univ3") {
      if (!formData.nftId) return false;
      return !uniV3NFT.checkApproval;
    }
    // V4 locks would need their own approval logic
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
    <div className="max-w-4xl mx-auto bg-gray-900 rounded-2xl shadow-lg p-8 mt-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <button
          className="text-gray-400 hover:text-white mb-4 md:mb-0"
          onClick={handleBackToOptions}>
          ← Back to Options
        </button>
        <h1 className="text-2xl font-bold text-white">Create New Lock</h1>
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
              <div className="mr-2 text-green-400 bg-black rounded-full p-1">
                <svg
                  viewBox="0 0 24 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  height="18">
                  <path
                    d="M15.821 14.984L20.642 19.759L18.38 21.999L13.56 17.225C13.146 16.815 12.602 16.592 12.015 16.592C11.429 16.592 10.884 16.815 10.471 17.225L5.651 21.999L3.389 19.759L8.209 14.984H15.818H15.821Z"
                    fill="currentColor"></path>
                  <path
                    d="M16.626 13.608L23.209 15.353L24.036 12.29L17.453 10.545C16.889 10.396 16.42 10.038 16.127 9.536C15.834 9.037 15.758 8.453 15.909 7.895L17.671 1.374L14.579 0.556L12.816 7.076L16.623 13.604L16.626 13.608Z"
                    fill="currentColor"></path>
                  <path
                    d="M7.409 13.608L0.827 15.353L0 12.29L6.583 10.545C7.146 10.396 7.616 10.038 7.909 9.536C8.202 9.037 8.277 8.453 8.127 7.895L6.365 1.374L9.457 0.556L11.219 7.076L7.413 13.604L7.409 13.608Z"
                    fill="currentColor"></path>
                </svg>
              </div>
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
    <div className="max-w-4xl mx-auto bg-gray-900 rounded-2xl shadow-lg p-8 mt-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <button
          className="text-gray-400 hover:text-white mb-4 md:mb-0"
          onClick={handleBackToOptions}>
          ← Back to Options
        </button>
        <h1 className="text-2xl font-bold text-white">
          Create UniV2 Liquidity Lock
        </h1>
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
            {/* LP Token Info Display */}
            {formData.lpAddress && isAddress(formData.lpAddress) && (
              <div className="mt-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">LP Token Info:</span>
                  <div className="text-right">
                    <div className="text-white">
                      {lpTokenApproval.name || "Unknown"} (
                      {lpTokenApproval.symbol || "???"})
                    </div>
                    <div className="text-gray-400">
                      Balance:{" "}
                      {formatUnits(
                        lpTokenApproval.balance,
                        lpTokenApproval.decimals
                      )}
                    </div>
                  </div>
                </div>
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
          <div className="space-y-4">
            <label className="block text-gray-300 text-sm font-medium">
              Fee Structures
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  selectedFeeStructure === "default"
                    ? "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20"
                    : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                }`}
                onClick={() => handleFeeStructureSelect("default")}>
                {selectedFeeStructure === "default" && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-white font-semibold text-lg mb-2">
                    Default
                  </h3>
                  <div className="text-green-400 font-bold text-xl">
                    0.000001 ETH
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    Standard fee structure
                  </p>
                </div>
              </div>

              <div
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  selectedFeeStructure === "pay-with-lp"
                    ? "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20"
                    : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                }`}
                onClick={() => handleFeeStructureSelect("pay-with-lp")}>
                {selectedFeeStructure === "pay-with-lp" && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-white font-semibold text-lg mb-2">
                    Pay with LP
                  </h3>
                  <div className="text-blue-400 font-bold text-xl">0.6%</div>
                  <p className="text-gray-400 text-sm mt-2">
                    We will directly extract 0.6% of the liquidity as fee.
                  </p>
                </div>
              </div>

              <div
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  selectedFeeStructure === "pay-with-eth-lp"
                    ? "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20"
                    : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                }`}
                onClick={() => handleFeeStructureSelect("pay-with-eth-lp")}>
                {selectedFeeStructure === "pay-with-eth-lp" && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-white font-semibold text-lg mb-2">
                    ETH + LP
                  </h3>
                  <div className="text-purple-400 font-bold text-lg">
                    0.01 ETH + 0.3%
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    We will charge 0.01 ETH and extract 0.3% of LP as fee.
                  </p>
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
              lpTokenApproval.isPending ||
              tokenLocker.isPending ||
              tokenLocker.isConfirming
            }>
            {lpTokenApproval.isPending
              ? "Approving LP..."
              : tokenLocker.isPending
              ? "Creating Lock..."
              : tokenLocker.isConfirming
              ? "Confirming..."
              : needsApproval()
              ? "Approve LP Token"
              : "Create Lock"}
          </button>
        </form>
      </div>
    </div>
  );

  const UniV3LiquidityForm = () => (
    <div className="max-w-4xl mx-auto bg-gray-900 rounded-2xl shadow-lg p-8 mt-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <button
          className="text-gray-400 hover:text-white mb-4 md:mb-0"
          onClick={handleBackToOptions}>
          ← Back to Options
        </button>
        <h1 className="text-2xl font-bold text-white">
          Create UniV3 Liquidity Lock
        </h1>
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
          <div className="space-y-4">
            <label className="block text-gray-300 text-sm font-medium">
              Fee Structures
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  selectedFeeStructure === "default"
                    ? "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20"
                    : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                }`}
                onClick={() => handleFeeStructureSelect("default")}>
                {selectedFeeStructure === "default" && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-white font-semibold text-lg mb-2">
                    Default
                  </h3>
                  <div className="text-green-400 font-bold text-xl">0.4%</div>
                  <p className="text-gray-400 text-sm mt-2">
                    We will extract 0.4% the liquidity as fee, and 1.6%
                    Liquidity Stake Earnings each time you collect it.
                  </p>
                </div>
              </div>

              <div
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  selectedFeeStructure === "lvp"
                    ? "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20"
                    : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                }`}
                onClick={() => handleFeeStructureSelect("lvp")}>
                {selectedFeeStructure === "lvp" && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-white font-semibold text-lg mb-2">LVP</h3>
                  <div className="text-blue-400 font-bold text-xl">0.64%</div>
                  <p className="text-gray-400 text-sm mt-2">
                    We will extract 0.64% the liquidity as fee, and 0.8%
                    Liquidity Stake Earnings each time you collect it.
                  </p>
                </div>
              </div>

              <div
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  selectedFeeStructure === "llp"
                    ? "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20"
                    : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                }`}
                onClick={() => handleFeeStructureSelect("llp")}>
                {selectedFeeStructure === "llp" && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-white font-semibold text-lg mb-2">LLP</h3>
                  <div className="text-purple-400 font-bold text-xl">0.24%</div>
                  <p className="text-gray-400 text-sm mt-2">
                    We will extract 0.24% the liquidity as fee, and 2.8%
                    Liquidity Stake Earnings each time you collect it.
                  </p>
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
              uniV3NFT.isPending ||
              univ3LPLocker.isPending ||
              univ3LPLocker.isConfirming
            }>
            {uniV3NFT.isPending
              ? "Approving NFT..."
              : univ3LPLocker.isPending
              ? "Creating Lock..."
              : univ3LPLocker.isConfirming
              ? "Confirming..."
              : needsApproval()
              ? "Approve NFT"
              : "Create Lock"}
          </button>
        </form>
      </div>
    </div>
  );

  const UniV4LiquidityForm = () => (
    <div className="max-w-4xl mx-auto bg-gray-900 rounded-2xl shadow-lg p-8 mt-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <button
          className="text-gray-400 hover:text-white mb-4 md:mb-0"
          onClick={handleBackToOptions}>
          ← Back to Options
        </button>
        <h1 className="text-2xl font-bold text-white">
          Create UniV4 Liquidity Lock
        </h1>
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
          <div className="space-y-4">
            <label className="block text-gray-300 text-sm font-medium">
              Fee Structures
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  selectedFeeStructure === "default"
                    ? "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20"
                    : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                }`}
                onClick={() => handleFeeStructureSelect("default")}>
                {selectedFeeStructure === "default" && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-white font-semibold text-lg mb-2">
                    Default
                  </h3>
                  <div className="text-green-400 font-bold text-lg">
                    0.4% + 0.05 ETH
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    We will extract 0.4% the liquidity and 0.05 ETH as fee, and
                    1.6% Liquidity Stake Earnings each time you collect it.
                  </p>
                </div>
              </div>

              <div
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  selectedFeeStructure === "lvp"
                    ? "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20"
                    : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                }`}
                onClick={() => handleFeeStructureSelect("lvp")}>
                {selectedFeeStructure === "lvp" && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-white font-semibold text-lg mb-2">LVP</h3>
                  <div className="text-blue-400 font-bold text-xl">0.64%</div>
                  <p className="text-gray-400 text-sm mt-2">
                    We will extract 0.64% the liquidity as fee, and 0.8%
                    Liquidity Stake Earnings each time you collect it.
                  </p>
                </div>
              </div>

              <div
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  selectedFeeStructure === "llp"
                    ? "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20"
                    : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                }`}
                onClick={() => handleFeeStructureSelect("llp")}>
                {selectedFeeStructure === "llp" && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-white font-semibold text-lg mb-2">LLP</h3>
                  <div className="text-purple-400 font-bold text-xl">0.24%</div>
                  <p className="text-gray-400 text-sm mt-2">
                    We will extract 0.24% the liquidity as fee, and 2.8%
                    Liquidity Stake Earnings each time you collect it.
                  </p>
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
        <div className="w-full mx-auto">
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
