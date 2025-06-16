import React, { useState } from "react";
import {
  X,
  Copy,
  CheckCircle,
  Clock,
  Unlock,
  ExternalLink,
  User,
  Coins,
} from "lucide-react";
import type { Univ3LockInfo } from "../hooks/useUniv3UserLocks";
import { useTokenPairInfo } from "../hooks/useTokenInfo";
import "./LockDetailModal.css";

interface Univ3LockDetailModalProps {
  lock: Univ3LockInfo;
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (lockId: string) => Promise<void>;
  isPending: boolean;
}

export const Univ3LockDetailModal: React.FC<Univ3LockDetailModalProps> = ({
  lock,
  isOpen,
  onClose,
  onUnlock,
  isPending,
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  // Get token pair information for the pool
  const { pairName, isLoading: isPairLoading } = useTokenPairInfo(lock.pool);

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
        return;
      }

      await onUnlock(lock.lockId);
    } catch (error) {
      console.error("Unlock failed:", error);
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
              <div className="v3-badge">V3</div>
            </div>
            <div>
              <h2>UniV3 NFT Lock Details</h2>
              <p>Lock ID: {lock.lockId}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-content">
          {/* NFT Information */}
          <div className="info-section">
            <h3>
              <Coins size={20} />
              NFT Information
            </h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">NFT ID:</span>
                <div className="value-with-copy">
                  <span className="value">{lock.nftId}</span>
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(lock.nftId, "nftId")}
                    title="Copy NFT ID">
                    {copied === "nftId" ? (
                      <CheckCircle size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>

              <div className="info-item">
                <span className="label">Pool:</span>
                <div className="value-with-copy">
                  <span className="value">
                    {isPairLoading
                      ? "Loading..."
                      : pairName || formatAddress(lock.pool)}
                  </span>
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(lock.pool, "pool")}
                    title="Copy Pool Address">
                    {copied === "pool" ? (
                      <CheckCircle size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                  <a
                    href={getExplorerUrl(lock.pool)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="explorer-btn"
                    title="View on Explorer">
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>

              <div className="info-item">
                <span className="label">Position Manager:</span>
                <div className="value-with-copy">
                  <span className="value">
                    {formatAddress(lock.nftPositionManager)}
                  </span>
                  <button
                    className="copy-btn"
                    onClick={() =>
                      copyToClipboard(lock.nftPositionManager, "manager")
                    }
                    title="Copy Position Manager Address">
                    {copied === "manager" ? (
                      <CheckCircle size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                  <a
                    href={getExplorerUrl(lock.nftPositionManager)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="explorer-btn"
                    title="View on Explorer">
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Lock Information */}
          <div className="info-section">
            <h3>
              <User size={20} />
              Lock Information
            </h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Owner:</span>
                <div className="value-with-copy">
                  <span className="value">{formatAddress(lock.owner)}</span>
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(lock.owner, "owner")}
                    title="Copy Owner Address">
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
                    className="explorer-btn"
                    title="View on Explorer">
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>

              <div className="info-item">
                <span className="label">Collector:</span>
                <div className="value-with-copy">
                  <span className="value">{formatAddress(lock.collector)}</span>
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(lock.collector, "collector")}
                    title="Copy Collector Address">
                    {copied === "collector" ? (
                      <CheckCircle size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                  <a
                    href={getExplorerUrl(lock.collector)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="explorer-btn"
                    title="View on Explorer">
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>

              <div className="info-item">
                <span className="label">Collect Fee:</span>
                <span className="value">
                  {(lock.collectFee / 100).toFixed(2)}%
                </span>
              </div>

              {lock.pendingOwner !==
                "0x0000000000000000000000000000000000000000" && (
                <div className="info-item">
                  <span className="label">Pending Owner:</span>
                  <div className="value-with-copy">
                    <span className="value">
                      {formatAddress(lock.pendingOwner)}
                    </span>
                    <button
                      className="copy-btn"
                      onClick={() =>
                        copyToClipboard(lock.pendingOwner, "pendingOwner")
                      }
                      title="Copy Pending Owner Address">
                      {copied === "pendingOwner" ? (
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

          {/* Time Information */}
          <div className="info-section">
            <h3>
              <Clock size={20} />
              Time Information
            </h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Start Time:</span>
                <span className="value">{formatDate(lock.startTime)}</span>
              </div>
              <div className="info-item">
                <span className="label">End Time:</span>
                <span className="value">{formatDate(lock.endTime)}</span>
              </div>
              <div className="info-item">
                <span className="label">Time Remaining:</span>
                <span
                  className={`value ${
                    isUnlockable(lock.endTime) ? "unlockable" : ""
                  }`}>
                  {getTimeRemaining()}
                </span>
              </div>
            </div>
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

          {/* Action Buttons */}
          <div className="modal-actions">
            <button className="secondary-btn" onClick={onClose}>
              Close
            </button>
            {isUnlockable(lock.endTime) && (
              <button
                className="unlock-btn"
                onClick={handleUnlock}
                disabled={isPending || unlocking}>
                {unlocking ? "Unlocking..." : "Unlock NFT"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
