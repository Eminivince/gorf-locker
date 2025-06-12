import React, { useState } from "react";
import { formatUnits } from "viem";
import { ExternalLink, Eye } from "lucide-react";
import type { LockInfo } from "../hooks/useTokenLocker";
import { LockDetailModal } from "./LockDetailModal";
import "./LockTable.css";

interface LockTableProps {
  locks: LockInfo[];
  type: "tokens" | "v2" | "v3" | "v4";
}

export const LockTable: React.FC<LockTableProps> = ({ locks, type }) => {
  const [selectedLock, setSelectedLock] = useState<LockInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatAmount = (amount: string, decimals: number = 18) => {
    try {
      const formatted = formatUnits(BigInt(amount), decimals);
      const num = parseFloat(formatted);

      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(2)}M`;
      } else if (num >= 1000) {
        return `${(num / 1000).toFixed(2)}K`;
      } else {
        return num.toFixed(4);
      }
    } catch {
      return "0";
    }
  };

  const getExplorerUrl = (address: string) => {
    return `https://abscan.org/address/${address}`;
  };

  const handleLockClick = (lock: LockInfo) => {
    setSelectedLock(lock);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLock(null);
  };

  const getTypeLabel = () => {
    switch (type) {
      case "tokens":
        return "Token";
      case "v2":
        return "V2";
      case "v3":
        return "V3";
      case "v4":
        return "V4";
      default:
        return "Token";
    }
  };

  const getStatusColor = (endTime: number) => {
    const now = Date.now() / 1000;
    if (now >= endTime) return "unlocked";
    return "locked";
  };

  const getLockedPercentage = (lock: LockInfo) => {
    try {
      const total = BigInt(lock.amount);
      const unlocked = BigInt(lock.unlockedAmount);
      const locked = total - unlocked;

      if (total === 0n) return 0;

      return Number((locked * 100n) / total);
    } catch {
      return 100;
    }
  };

  if (locks.length === 0) {
    return (
      <div className="lock-table-empty">
        <p>No {getTypeLabel()} locks found</p>
      </div>
    );
  }

  return (
    <>
      <div className="lock-table-container">
        <div className="lock-table-header">
          <div className="table-header-cell">Pool/Token</div>
          <div className="table-header-cell">Version</div>
          <div className="table-header-cell">Locked %</div>
          <div className="table-header-cell">Amount</div>
          <div className="table-header-cell">Unlock Date</div>
          <div className="table-header-cell">Actions</div>
        </div>

        <div className="lock-table-body">
          {locks.map((lock) => (
            <div key={lock.lockId} className="lock-table-row">
              <div className="table-cell pool-cell">
                <div className="pool-info">
                  <div className="pool-icon">
                    {type === "tokens" ? (
                      <div className="token-icon">T</div>
                    ) : (
                      <div className="lp-icon">LP</div>
                    )}
                  </div>
                  <div className="pool-details">
                    <div className="pool-name">
                      {type === "tokens"
                        ? "Token Lock"
                        : `${getTypeLabel()} Pool`}
                    </div>
                    <div className="pool-address">
                      {formatAddress(lock.token)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="table-cell version-cell">
                <span className={`version-badge ${type}`}>
                  {getTypeLabel()}
                </span>
              </div>

              <div className="table-cell percentage-cell">
                <div className="percentage-container">
                  <div className="percentage-bar">
                    <div
                      className="percentage-fill"
                      style={{ width: `${getLockedPercentage(lock)}%` }}
                    />
                  </div>
                  <span className="percentage-text">
                    {getLockedPercentage(lock)}%
                  </span>
                </div>
              </div>

              <div className="table-cell amount-cell">
                <span className="amount-value">
                  {formatAmount(lock.amount)}
                </span>
              </div>

              <div className="table-cell date-cell">
                <span className={`date-value ${getStatusColor(lock.endTime)}`}>
                  {formatDate(lock.endTime)}
                </span>
              </div>

              <div className="table-cell actions-cell">
                <button
                  className="action-btn view-btn"
                  onClick={() => handleLockClick(lock)}
                  title="View Details">
                  <Eye size={16} />
                </button>
                <a
                  href={getExplorerUrl(lock.token)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="action-btn explorer-btn"
                  title="View on Explorer">
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lock Detail Modal */}
      {selectedLock && (
        <LockDetailModal
          lock={selectedLock}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onUnlock={async () => {}} // Empty function since this is read-only
          isPending={false}
        />
      )}
    </>
  );
};
