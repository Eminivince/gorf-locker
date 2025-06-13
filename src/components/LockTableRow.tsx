import React from "react";
import { formatUnits } from "viem";
import { ExternalLink, Eye } from "lucide-react";
import type { LockInfo } from "../hooks/useTokenLocker";
import { useTokenInfo } from "../hooks/useTokenInfo";

interface LockTableRowProps {
  lock: LockInfo;
  type: "tokens" | "v2" | "v3" | "v4";
  onLockClick: (lock: LockInfo) => void;
}

export const LockTableRow: React.FC<LockTableRowProps> = ({
  lock,
  type,
  onLockClick,
}) => {
  const tokenInfo = useTokenInfo(lock.token);

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

  // Calculate locked percentage against total supply
  const getLockedPercentageAgainstSupply = () => {
    try {
      if (tokenInfo.totalSupply === BigInt(0)) return 0;

      const lockedAmount = BigInt(lock.amount) - BigInt(lock.unlockedAmount);
      const percentage =
        Number((lockedAmount * BigInt(10000)) / tokenInfo.totalSupply) / 100;

      return Math.min(percentage, 100); // Cap at 100%
    } catch {
      return 0;
    }
  };

  // Get display name for token/pool
  const getDisplayName = () => {
    if (tokenInfo.isLoading) {
      return "Loading...";
    }

    if (type === "tokens") {
      return tokenInfo.name !== "Unknown Token"
        ? tokenInfo.name
        : tokenInfo.symbol;
    } else {
      // For LP tokens, we'll show the symbol or a generic pool name
      // In a real implementation, you might want to decode the LP token to get pair info
      return tokenInfo.symbol !== "UNKNOWN"
        ? `${tokenInfo.symbol} Pool`
        : `${getTypeLabel()} Pool`;
    }
  };

  const getDisplaySymbol = () => {
    if (tokenInfo.isLoading) {
      return "...";
    }
    return tokenInfo.symbol;
  };

  return (
    <div className="lock-table-row">
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
            <div className="pool-name">{getDisplayName()}</div>
            <div className="pool-address">{formatAddress(lock.token)}</div>
          </div>
        </div>
      </div>

      <div className="table-cell version-cell">
        <span className={`version-badge ${type}`}>{getTypeLabel()}</span>
      </div>

      <div className="table-cell percentage-cell">
        <div className="percentage-container">
          <div className="percentage-bar">
            <div
              className="percentage-fill"
              style={{ width: `${getLockedPercentageAgainstSupply()}%` }}
            />
          </div>
          <span className="percentage-text">
            {getLockedPercentageAgainstSupply().toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="table-cell amount-cell">
        <span className="amount-value">
          {formatAmount(lock.amount, tokenInfo.decimals)} {getDisplaySymbol()}
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
          onClick={() => onLockClick(lock)}
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
  );
};
