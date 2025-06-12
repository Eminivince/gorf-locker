import React, { useState } from "react";
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import {
  X,
  Copy,
  CheckCircle,
  Clock,
  Unlock,
  ExternalLink,
  Lock,
  User,
  Coins,
} from "lucide-react";
import type { LockInfo } from "../hooks/useTokenLocker";
import "./LockDetailModal.css";

interface LockDetailModalProps {
  lock: LockInfo;
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (lockId: string) => Promise<void>;
  isPending: boolean;
}

interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
}

// ERC20 ABI for token info
const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
];

export const LockDetailModal: React.FC<LockDetailModalProps> = ({
  lock,
  isOpen,
  onClose,
  onUnlock,
  isPending,
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  // Fetch token information
  const { data: tokenName } = useReadContract({
    address: lock.token,
    abi: ERC20_ABI,
    functionName: "name",
    query: { enabled: isOpen },
  });

  const { data: tokenSymbol } = useReadContract({
    address: lock.token,
    abi: ERC20_ABI,
    functionName: "symbol",
    query: { enabled: isOpen },
  });

  const { data: tokenDecimals } = useReadContract({
    address: lock.token,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: { enabled: isOpen },
  });

  const { data: totalSupply } = useReadContract({
    address: lock.token,
    abi: ERC20_ABI,
    functionName: "totalSupply",
    query: { enabled: isOpen },
  });

  const tokenInfo: TokenInfo = {
    name: (tokenName as string) || "Unknown Token",
    symbol: (tokenSymbol as string) || "UNKNOWN",
    decimals: (tokenDecimals as number) || 18,
    totalSupply: totalSupply ? (totalSupply as bigint).toString() : "0",
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const isUnlockable = (unlockTime: number) => {
    return Date.now() / 1000 >= unlockTime;
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleUnlock = async () => {
    try {
      setUnlocking(true);

      if (!isUnlockable(lock.endTime)) {
        console.error("Lock is not yet unlockable");
        // Parent component will handle the error display
        return;
      }

      await onUnlock(lock.lockId);
    } catch (error) {
      console.error("Unlock failed:", error);
      // Parent component will handle the error display
      // The error will bubble up through the onUnlock callback
    } finally {
      setUnlocking(false);
    }
  };

  const getExplorerUrl = (
    address: string,
    type: "address" | "tx" = "address"
  ) => {
    const baseUrl = "https://abscan.org";
    return `${baseUrl}/${type}/${address}`;
  };

  const calculateProgress = () => {
    const now = Date.now() / 1000;
    const start = lock.startTime;
    const end = lock.endTime;

    if (now <= start) return 0;
    if (now >= end) return 100;

    return ((now - start) / (end - start)) * 100;
  };

  const getTimeRemaining = () => {
    const now = Date.now() / 1000;
    const remaining = lock.endTime - now;

    if (remaining <= 0) return "Unlocked";

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="lock-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <div className="lock-icon">
              {lock.isLpToken ? (
                <div className="lp-badge">LP</div>
              ) : (
                <Lock size={24} />
              )}
            </div>
            <div>
              <h2>Lock Details</h2>
              <p>ID: {lock.lockId}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-content">
          {/* Status Banner */}
          <div
            className={`status-banner ${
              isUnlockable(lock.endTime) ? "unlockable" : "locked"
            }`}>
            <div className="status-icon">
              {isUnlockable(lock.endTime) ? (
                <CheckCircle size={20} />
              ) : (
                <Clock size={20} />
              )}
            </div>
            <div className="status-text">
              <span className="status-label">
                {isUnlockable(lock.endTime) ? "Ready to Unlock" : "Locked"}
              </span>
              <span className="time-remaining">{getTimeRemaining()}</span>
            </div>
            {isUnlockable(lock.endTime) && (
              <button
                className="unlock-btn-banner"
                onClick={handleUnlock}
                disabled={isPending || unlocking}>
                {isPending || unlocking ? "Unlocking..." : "Unlock Now"}
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="progress-section">
            <div className="progress-header">
              <span>Lock Progress</span>
              <span>{Math.round(calculateProgress())}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>

          {/* Token Information */}
          <div className="info-section">
            <h3>
              <Coins size={20} />
              Token Information
            </h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Token Name</label>
                <div className="value-with-copy">
                  <span>{tokenInfo.name}</span>
                </div>
              </div>
              <div className="info-item">
                <label>Symbol</label>
                <span>{tokenInfo.symbol}</span>
              </div>
              <div className="info-item">
                <label>Token Address</label>
                <div className="value-with-copy">
                  <span>{formatAddress(lock.token)}</span>
                  <button
                    onClick={() => copyToClipboard(lock.token, "token")}
                    className="copy-btn">
                    {copied === "token" ? (
                      <CheckCircle size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                  <a
                    href={getExplorerUrl(lock.token)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="external-link">
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
              <div className="info-item">
                <label>Total Supply</label>
                <span>
                  {formatUnits(
                    BigInt(tokenInfo.totalSupply),
                    tokenInfo.decimals
                  )}{" "}
                  {tokenInfo.symbol}
                </span>
              </div>
            </div>
          </div>

          {/* Lock Details */}
          <div className="info-section">
            <h3>
              <Lock size={20} />
              Lock Details
            </h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Locked Amount</label>
                <span className="amount-value">
                  {formatUnits(BigInt(lock.amount), tokenInfo.decimals)}{" "}
                  {tokenInfo.symbol}
                </span>
              </div>
              <div className="info-item">
                <label>Unlocked Amount</label>
                <span>
                  {formatUnits(BigInt(lock.unlockedAmount), tokenInfo.decimals)}{" "}
                  {tokenInfo.symbol}
                </span>
              </div>
              <div className="info-item">
                <label>Lock Type</label>
                <span>{lock.isLpToken ? "Liquidity Pool" : "Token Lock"}</span>
              </div>
              <div className="info-item">
                <label>Start Time</label>
                <span>{formatDate(lock.startTime)}</span>
              </div>
              <div className="info-item">
                <label>Unlock Time</label>
                <span>{formatDate(lock.endTime)}</span>
              </div>
              {lock.tgeBps > 0 && (
                <>
                  <div className="info-item">
                    <label>TGE Percentage</label>
                    <span>{lock.tgeBps / 100}%</span>
                  </div>
                  <div className="info-item">
                    <label>Cycle Percentage</label>
                    <span>{lock.cycleBps / 100}%</span>
                  </div>
                  <div className="info-item">
                    <label>Cycle Duration</label>
                    <span>{lock.cycle / 86400} days</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Owner Information */}
          <div className="info-section">
            <h3>
              <User size={20} />
              Owner Information
            </h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Current Owner</label>
                <div className="value-with-copy">
                  <span>{formatAddress(lock.owner)}</span>
                  <button
                    onClick={() => copyToClipboard(lock.owner, "owner")}
                    className="copy-btn">
                    {copied === "owner" ? (
                      <CheckCircle size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                  <a
                    href={getExplorerUrl(lock.owner)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="external-link">
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
              {lock.pendingOwner !==
                "0x0000000000000000000000000000000000000000" && (
                <div className="info-item">
                  <label>Pending Owner</label>
                  <div className="value-with-copy">
                    <span>{formatAddress(lock.pendingOwner)}</span>
                    <button
                      onClick={() =>
                        copyToClipboard(lock.pendingOwner, "pending")
                      }
                      className="copy-btn">
                      {copied === "pending" ? (
                        <CheckCircle size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            {isUnlockable(lock.endTime) && (
              <button
                className="unlock-btn-main"
                onClick={handleUnlock}
                disabled={isPending || unlocking}>
                <Unlock size={20} />
                {isPending || unlocking ? "Unlocking..." : "Unlock Tokens"}
              </button>
            )}
            <a
              href={getExplorerUrl(lock.token)}
              target="_blank"
              rel="noopener noreferrer"
              className="explorer-btn">
              <ExternalLink size={20} />
              View on Explorer
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
