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
import "./CreateLockPage.css";

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
      "Create UniV2 Liquidity lock, including UniV2, PancakeV2, SushiV2, and other dex contracts developed based on UniV2. Supports full locking or TGE (Token Generation Event) cycle release mode, with",
    icon: "V2",
    additionalInfo: "multiple fee structures available.",
  },
  {
    id: "univ3",
    title: "Lock UniV3 Liquidity",
    description:
      "Create UniV3 Liquidity lock, including UniV3, PancakeV3, SushiV3, and other dex contracts developed based on UniV3. Supports multiple fee structures.",
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
    <div className="token-lock-form-container">
      <div className="page-header">
        <div className="header-left">
          <button className="back-button" onClick={handleBackToOptions}>
            ← Back to Options
          </button>
          <h1>Create New Lock</h1>
        </div>
        <div className="account-selector">
          <div className="account-badge">
            <div className="account-avatar"></div>
            <span>{address ? formatAddress(address) : "Not Connected"}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="token-lock-form-card">
        <div className="form-visual">
          <div className="lock-visual-container">
            <div className="lock-3d-icon">
              <Lock size={60} />
            </div>
            <div className="lock-glow"></div>
          </div>
          <h2>New Token Lock</h2>
        </div>

        <div className="form-content">
          <div className="form-group">
            <label>Chain</label>
            <div className="chain-selector">
              <div className="chain-badge">
                <div className="chain-icon"></div>
                <span>Abstract</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M3 4.5L6 7.5L9 4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Token Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={formData.tokenAddress}
              onChange={(e) =>
                handleInputChange("tokenAddress", e.target.value)
              }
              className={`form-input ${errors.tokenAddress ? "error" : ""}`}
            />
            {errors.tokenAddress && (
              <div className="error-message">
                <AlertCircle size={16} />
                {errors.tokenAddress}
              </div>
            )}
            {formData.tokenAddress &&
              isAddress(formData.tokenAddress) &&
              tokenApproval.symbol && (
                <div className="token-info">
                  <CheckCircle size={16} />
                  <span>
                    {tokenApproval.name} ({tokenApproval.symbol})
                  </span>
                  <span className="balance">
                    Balance:{" "}
                    {formatUnits(tokenApproval.balance, tokenApproval.decimals)}
                  </span>
                </div>
              )}
          </div>

          <div className="form-group">
            <label>Amount</label>
            <div className="amount-input-group">
              <input
                type="text"
                placeholder="Input number"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                className={`form-input ${errors.amount ? "error" : ""}`}
              />
              <button className="max-button" onClick={handleMaxClick}>
                Max
              </button>
            </div>
            {errors.amount && (
              <div className="error-message">
                <AlertCircle size={16} />
                {errors.amount}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="toggle-label">
              <span>TGE (Token Generation Event) cycle release mode</span>
              <div className="toggle-switch" onClick={handleTGEToggle}>
                <div
                  className={`toggle-slider ${
                    isTGEEnabled ? "active" : ""
                  }`}></div>
              </div>
            </label>
          </div>

          {!isTGEEnabled ? (
            <div className="form-group">
              <label>Unlock Time (UTC)</label>
              <div className="datetime-input">
                <input
                  type="datetime-local"
                  value={formatDateTimeLocal(formData.unlockTime)}
                  onChange={(e) =>
                    handleDateTimeChange("unlockTime", e.target.value)
                  }
                  className={`form-input ${errors.unlockTime ? "error" : ""}`}
                />
              </div>
              {errors.unlockTime && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  {errors.unlockTime}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>TGE Time (UTC)</label>
                <div className="datetime-input">
                  <input
                    type="datetime-local"
                    value={formatDateTimeLocal(formData.tgeTime)}
                    onChange={(e) =>
                      handleDateTimeChange("tgeTime", e.target.value)
                    }
                    className={`form-input ${errors.tgeTime ? "error" : ""}`}
                  />
                </div>
                {errors.tgeTime && (
                  <div className="error-message">
                    <AlertCircle size={16} />
                    {errors.tgeTime}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>TGE Percentage (%)</label>
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
                  className={`form-input ${
                    errors.tgePercentage ? "error" : ""
                  }`}
                />
                {errors.tgePercentage && (
                  <div className="error-message">
                    <AlertCircle size={16} />
                    {errors.tgePercentage}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Cycle (day)</label>
                <input
                  type="number"
                  placeholder="Input number, 10 is for 10 days"
                  min="1"
                  step="1"
                  value={formData.cycle}
                  onChange={(e) => handleInputChange("cycle", e.target.value)}
                  className={`form-input ${errors.cycle ? "error" : ""}`}
                />
                {errors.cycle && (
                  <div className="error-message">
                    <AlertCircle size={16} />
                    {errors.cycle}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Cycle Percentage (%)</label>
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
                  className={`form-input ${
                    errors.cyclePercentage ? "error" : ""
                  }`}
                />
                {errors.cyclePercentage && (
                  <div className="error-message">
                    <AlertCircle size={16} />
                    {errors.cyclePercentage}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Final Unlock Time (UTC)</label>
                <div className="datetime-input">
                  <input
                    type="datetime-local"
                    value={formatDateTimeLocal(formData.unlockTime)}
                    onChange={(e) =>
                      handleDateTimeChange("unlockTime", e.target.value)
                    }
                    className={`form-input ${errors.unlockTime ? "error" : ""}`}
                  />
                </div>
                {errors.unlockTime && (
                  <div className="error-message">
                    <AlertCircle size={16} />
                    {errors.unlockTime}
                  </div>
                )}
                <div className="field-hint">
                  This is when the vesting schedule ends and all remaining
                  tokens are unlocked
                </div>
              </div>
            </>
          )}

          <button
            className="approve-button"
            onClick={(e) => {
              e.preventDefault();

              handleApprove();
            }}
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
        </div>
      </div>
    </div>
  );

  const UniV2LiquidityForm = () => (
    <div className="token-lock-form-container">
      <div className="page-header">
        <div className="header-left">
          <button className="back-button" onClick={handleBackToOptions}>
            ← Back to Options
          </button>
          <h1>Create UniV2 Liquidity Lock</h1>
        </div>
        <div className="account-selector">
          <div className="account-badge">
            <div className="account-avatar"></div>
            <span>{address ? formatAddress(address) : "Not Connected"}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="token-lock-form-card">
        <div className="form-visual">
          <div className="lock-visual-container">
            <div className="v2-icon-container">
              <div className="v2-icon">V2</div>
            </div>
            <div className="lock-glow"></div>
          </div>
          <h2>New V2 liquidity Lock</h2>
        </div>

        <div className="form-content">
          <div className="form-group">
            <label>Chain</label>
            <div className="chain-selector">
              <div className="chain-badge">
                <div className="chain-icon"></div>
                <span>Abstract</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M3 4.5L6 7.5L9 4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>LP Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={formData.lpAddress}
              onChange={(e) => handleInputChange("lpAddress", e.target.value)}
              className={`form-input ${errors.lpAddress ? "error" : ""}`}
            />
            {errors.lpAddress && (
              <div className="error-message">
                <AlertCircle size={16} />
                {errors.lpAddress}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Amount</label>
            <div className="amount-input-group">
              <input
                type="text"
                placeholder="Input number"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                className={`form-input ${errors.amount ? "error" : ""}`}
              />
              <button className="max-button">Max</button>
            </div>
            {errors.amount && (
              <div className="error-message">
                <AlertCircle size={16} />
                {errors.amount}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="toggle-label">
              <span>TGE (Token Generation Event) cycle release mode</span>
              <div className="toggle-switch" onClick={handleTGEToggle}>
                <div
                  className={`toggle-slider ${
                    isTGEEnabled ? "active" : ""
                  }`}></div>
              </div>
            </label>
          </div>

          {!isTGEEnabled ? (
            <div className="form-group">
              <label>Unlock Time (UTC)</label>
              <div className="datetime-input">
                <input
                  type="datetime-local"
                  value={formatDateTimeLocal(formData.unlockTime)}
                  onChange={(e) =>
                    handleDateTimeChange("unlockTime", e.target.value)
                  }
                  className={`form-input ${errors.unlockTime ? "error" : ""}`}
                />
              </div>
              {errors.unlockTime && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  {errors.unlockTime}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>TGE Time (UTC)</label>
                <div className="datetime-input">
                  <input
                    type="datetime-local"
                    value={formatDateTimeLocal(formData.tgeTime)}
                    onChange={(e) =>
                      handleDateTimeChange("tgeTime", e.target.value)
                    }
                    className={`form-input ${errors.tgeTime ? "error" : ""}`}
                  />
                </div>
                {errors.tgeTime && (
                  <div className="error-message">
                    <AlertCircle size={16} />
                    {errors.tgeTime}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>TGE Percentage (%)</label>
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
                  className={`form-input ${
                    errors.tgePercentage ? "error" : ""
                  }`}
                />
                {errors.tgePercentage && (
                  <div className="error-message">
                    <AlertCircle size={16} />
                    {errors.tgePercentage}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Cycle (day)</label>
                <input
                  type="number"
                  placeholder="Input number, 10 is for 10 days"
                  min="1"
                  step="1"
                  value={formData.cycle}
                  onChange={(e) => handleInputChange("cycle", e.target.value)}
                  className={`form-input ${errors.cycle ? "error" : ""}`}
                />
                {errors.cycle && (
                  <div className="error-message">
                    <AlertCircle size={16} />
                    {errors.cycle}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Cycle Percentage (%)</label>
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
                  className={`form-input ${
                    errors.cyclePercentage ? "error" : ""
                  }`}
                />
                {errors.cyclePercentage && (
                  <div className="error-message">
                    <AlertCircle size={16} />
                    {errors.cyclePercentage}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Final Unlock Time (UTC)</label>
                <div className="datetime-input">
                  <input
                    type="datetime-local"
                    value={formatDateTimeLocal(formData.unlockTime)}
                    onChange={(e) =>
                      handleDateTimeChange("unlockTime", e.target.value)
                    }
                    className={`form-input ${errors.unlockTime ? "error" : ""}`}
                  />
                </div>
                {errors.unlockTime && (
                  <div className="error-message">
                    <AlertCircle size={16} />
                    {errors.unlockTime}
                  </div>
                )}
                <div className="field-hint">
                  This is when the vesting schedule ends and all remaining
                  tokens are unlocked
                </div>
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
            className="approve-button"
            onClick={(e) => {
              e.preventDefault();

              handleApprove();
            }}
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
        </div>
      </div>
    </div>
  );

  const UniV3LiquidityForm = () => (
    <div className="token-lock-form-container">
      <div className="page-header">
        <div className="header-left">
          <button className="back-button" onClick={handleBackToOptions}>
            ← Back to Options
          </button>
          <h1>Create UniV3 Liquidity Lock</h1>
        </div>
        <div className="account-selector">
          <div className="account-badge">
            <div className="account-avatar"></div>
            <span>{address ? formatAddress(address) : "Not Connected"}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="token-lock-form-card">
        <div className="form-visual">
          <div className="lock-visual-container">
            <div className="v3-icon-container">
              <div className="v3-icon">V3</div>
            </div>
            <div className="lock-glow"></div>
          </div>
          <h2>Create UniV3 Liquidity Lock</h2>
          <p className="form-subtitle">
            You can still collect Liquidity Stake Earnings while the liquidity
            is locked.
          </p>
        </div>

        <div className="form-content">
          <div className="form-group">
            <label>Chain</label>
            <div className="chain-selector">
              <div className="chain-badge">
                <div className="chain-icon"></div>
                <span>Abstract</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M3 4.5L6 7.5L9 4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Select Pool</label>
            <div className="chain-selector">
              <div className="chain-badge">
                <span>ReservoirV3</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M3 4.5L6 7.5L9 4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>NFT ID</label>
            <input
              type="text"
              placeholder="Input NFT ID"
              value={formData.nftId}
              onChange={(e) => handleInputChange("nftId", e.target.value)}
              className={`form-input ${errors.nftId ? "error" : ""}`}
            />
            {errors.nftId && (
              <div className="error-message">
                <AlertCircle size={16} />
                {errors.nftId}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Unlock Time (UTC)</label>
            <div className="datetime-input">
              <input
                type="datetime-local"
                value={formatDateTimeLocal(formData.unlockTime)}
                onChange={(e) =>
                  handleDateTimeChange("unlockTime", e.target.value)
                }
                className={`form-input ${errors.unlockTime ? "error" : ""}`}
              />
            </div>
            {errors.unlockTime && (
              <div className="error-message">
                <AlertCircle size={16} />
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
            className="approve-button"
            onClick={(e) => {
              e.preventDefault();

              handleApprove();
            }}
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
        </div>
      </div>
    </div>
  );

  const UniV4LiquidityForm = () => (
    <div className="token-lock-form-container">
      <div className="page-header">
        <div className="header-left">
          <button className="back-button" onClick={handleBackToOptions}>
            ← Back to Options
          </button>
          <h1>Create UniV4 Liquidity Lock</h1>
        </div>
        <div className="account-selector">
          <div className="account-badge">
            <div className="account-avatar"></div>
            <span>{address ? formatAddress(address) : "Not Connected"}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="token-lock-form-card">
        <div className="form-visual">
          <div className="lock-visual-container">
            <div className="v4-icon-container">
              <div className="v4-icon">V4</div>
            </div>
            <div className="lock-glow"></div>
          </div>
          <h2>Create UniV4 Liquidity Lock</h2>
          <p className="form-subtitle">
            You can still collect Liquidity Stake Earnings while the liquidity
            is locked.
          </p>
        </div>

        <div className="form-content">
          <div className="form-group">
            <label>Chain</label>
            <div className="chain-selector">
              <div className="chain-badge">
                <div className="base-chain-icon"></div>
                <span>Base Chain</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M3 4.5L6 7.5L9 4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Select Pool</label>
            <div className="pool-selector">
              <span className="pool-text">UniV4</span>
            </div>
          </div>

          <div className="form-group">
            <label>NFT ID</label>
            <input
              type="text"
              placeholder="Input NFT ID"
              value={formData.nftId}
              onChange={(e) => handleInputChange("nftId", e.target.value)}
              className={`form-input ${errors.nftId ? "error" : ""}`}
            />
            {errors.nftId && (
              <div className="error-message">
                <AlertCircle size={16} />
                {errors.nftId}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Unlock Time (UTC)</label>
            <div className="datetime-input">
              <input
                type="datetime-local"
                value={formatDateTimeLocal(formData.unlockTime)}
                onChange={(e) =>
                  handleDateTimeChange("unlockTime", e.target.value)
                }
                className={`form-input ${errors.unlockTime ? "error" : ""}`}
              />
            </div>
            {errors.unlockTime && (
              <div className="error-message">
                <AlertCircle size={16} />
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
            className="approve-button"
            onClick={(e) => {
              e.preventDefault();

              handleApprove();
            }}
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
        </div>
      </div>
    </div>
  );

  const LockOptionsState = () => (
    <div className="lock-options-container">
      <div className="page-header">
        <h1>Create New Lock</h1>
        <div className="account-selector"></div>
      </div>

      <div className="lock-options-grid">
        {lockOptions.map((option) => (
          <div
            key={option.id}
            className="lock-option-card"
            onClick={() => handleLockOptionClick(option.id)}>
            {option.isHot && <div className="hot-badge">HOT</div>}
            <div className="lock-option-content">
              <div className="lock-option-icon">
                {option.icon === "🔒" ? (
                  <Lock size={32} />
                ) : (
                  <div className="version-icon">{option.icon}</div>
                )}
              </div>
              <div className="lock-option-text">
                <h3>{option.title}</h3>
                <p>
                  {option.description}
                  {option.additionalInfo && (
                    <span className="additional-info">
                      {" "}
                      {option.additionalInfo}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
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
      </div>
    );
  }

  return (
    <div className="create-lock-page">
      <LockOptionsState />

      {/* Status Modal */}
      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        details={statusModal.details}
      />

      {/* Loading Overlay */}
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
