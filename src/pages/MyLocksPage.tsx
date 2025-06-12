import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useTokenLocker } from "../hooks/useTokenLocker";
import { formatUnits } from "viem";
import { Lock, Clock, Unlock } from "lucide-react";
import { LockDetailModal } from "../components/LockDetailModal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { StatusModal } from "../components/StatusModal";
import type { LockInfo } from "../hooks/useTokenLocker";
import "./MyLocksPage.css";

export const MyLocksPage = () => {
  const { address, isConnected } = useAccount();
  const {
    userNormalLocks,
    userLpLocks,
    unlockTokens,
    isPending,
    isConfirmed,
    normalLockIds,
    lpLockIds,
    refreshLockData,
  } = useTokenLocker();

  const [selectedLock, setSelectedLock] = useState<LockInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unlockingLockId, setUnlockingLockId] = useState<string | null>(null);
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

  // Define allLocks early so it can be used in useCallback dependencies
  const allLocks = [...userNormalLocks, ...userLpLocks];

  // Effect to refresh data when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      refreshLockData();
      setUnlockingLockId(null); // Clear unlocking state

      // Show success message
      setStatusModal({
        isOpen: true,
        type: "success",
        title: "Unlock Successful!",
        message: "Your tokens have been unlocked successfully.",
      });

      // Close modal if it's open
      if (isModalOpen) {
        setIsModalOpen(false);
        setSelectedLock(null);
      }
    }
  }, [isConfirmed, refreshLockData, isModalOpen]);

  const formatAddress = (addr: string | undefined | null) => {
    if (!addr || typeof addr !== "string") return "N/A";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const isUnlockable = (unlockTime: number) => {
    return Date.now() / 1000 >= unlockTime;
  };

  const handleUnlock = async (lockId: string) => {
    try {
      setUnlockingLockId(lockId); // Set loading state for this specific lock

      // Check if lock is actually unlockable
      const lock = allLocks.find((l) => l.lockId === lockId);
      if (!lock) {
        console.error("Lock not found:", lockId);
        setStatusModal({
          isOpen: true,
          type: "error",
          title: "Lock Not Found",
          message: "The specified lock could not be found.",
          details: `Lock ID: ${lockId}`,
        });
        setUnlockingLockId(null);
        return;
      }

      if (!isUnlockable(lock.endTime)) {
        console.error("Lock is not yet unlockable");
        setStatusModal({
          isOpen: true,
          type: "warning",
          title: "Lock Not Ready",
          message: "This lock is not yet ready to be unlocked.",
          details: `Unlock time: ${formatDate(lock.endTime)}`,
        });
        setUnlockingLockId(null);
        return;
      }

      await unlockTokens(lockId);

      // Note: unlockingLockId will be cleared when transaction is confirmed
    } catch (error) {
      console.error("Failed to unlock:", error);
      setUnlockingLockId(null); // Clear loading state on error

      // Show user-friendly error message
      let errorMessage = "Failed to unlock tokens";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Unlock Failed",
        message: "Failed to unlock tokens. Please try again.",
        details: errorMessage,
      });
    }
  };

  const handleLockClick = (lock: LockInfo) => {
    setSelectedLock(lock);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLock(null);
  };

  const handleModalUnlock = async (lockId: string) => {
    await handleUnlock(lockId);
  };

  if (!isConnected) {
    return (
      <div className="my-locks-page">
        <div className="connect-wallet-prompt">
          <Lock size={64} />
          <h2>Connect Wallet to View Your Locks</h2>
          <p>
            Please connect your wallet to see your locked tokens and liquidity.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-locks-page">
      <div className="page-header">
        <h1>My Locks</h1>
        <div className="account-info">
          <div className="account-badge">
            <div className="account-avatar"></div>
            <span>{formatAddress(address!)}</span>
          </div>
        </div>
      </div>

      <div className="locks-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <Lock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{userNormalLocks.length}</div>
            <div className="stat-label">Token Locks</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <div className="lp-icon">LP</div>
          </div>
          <div className="stat-content">
            <div className="stat-value">{userLpLocks.length}</div>
            <div className="stat-label">LP Locks</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {allLocks.filter((lock) => !isUnlockable(lock.endTime)).length}
            </div>
            <div className="stat-label">Active Locks</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Unlock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {allLocks.filter((lock) => isUnlockable(lock.endTime)).length}
            </div>
            <div className="stat-label">Unlockable</div>
          </div>
        </div>
      </div>

      {allLocks.length === 0 ? (
        <div className="no-locks">
          <Lock size={64} />
          <h3>No Locks Found</h3>
          <p>
            You haven't created any locks yet. Start by creating your first
            lock!
          </p>
          <a href="/create-lock" className="create-lock-btn">
            Create New Lock
          </a>
        </div>
      ) : (
        <div className="locks-grid">
          {allLocks.map((lock) => (
            <div
              key={lock.lockId}
              className="lock-card clickable"
              onClick={() => handleLockClick(lock)}>
              <div className="lock-header">
                <div className="lock-type">
                  {lock.isLpToken ? (
                    <div className="lp-badge">LP</div>
                  ) : (
                    <Lock size={20} />
                  )}
                  <span>
                    {lock.isLpToken ? "Liquidity Lock" : "Token Lock"}
                  </span>
                </div>
                <div
                  className={`lock-status ${
                    isUnlockable(lock.endTime) ? "unlockable" : "locked"
                  }`}>
                  {isUnlockable(lock.endTime) ? "Unlockable" : "Locked"}
                </div>
              </div>

              <div className="lock-content">
                <div className="lock-info">
                  <div className="info-row">
                    <span className="label">Lock ID:</span>
                    <span className="value">{lock.lockId}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Token:</span>
                    <span className="value">{formatAddress(lock.token)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Amount:</span>
                    <span className="value">
                      {formatUnits(BigInt(lock.amount), 18)}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Unlock Time:</span>
                    <span className="value">{formatDate(lock.endTime)}</span>
                  </div>
                  {lock.tgeBps > 0 && (
                    <>
                      <div className="info-row">
                        <span className="label">TGE:</span>
                        <span className="value">{lock.tgeBps / 100}%</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Cycle:</span>
                        <span className="value">{lock.cycleBps / 100}%</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="lock-actions">
                  <button
                    className="view-details-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLockClick(lock);
                    }}>
                    View Details
                  </button>
                  {isUnlockable(lock.endTime) && (
                    <button
                      className="unlock-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnlock(lock.lockId);
                      }}
                      disabled={isPending || unlockingLockId === lock.lockId}>
                      {unlockingLockId === lock.lockId
                        ? "Unlocking..."
                        : "Unlock"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lock Detail Modal */}
      {selectedLock && (
        <LockDetailModal
          lock={selectedLock}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onUnlock={async (lockId: string) => {
            await handleModalUnlock(lockId);
          }}
          isPending={isPending || unlockingLockId === selectedLock?.lockId}
        />
      )}

      {/* Status Modal */}
      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        details={statusModal.details}
      />

      {/* Loading Overlay for individual lock operations */}
      {unlockingLockId && (
        <LoadingSpinner
          overlay={true}
          size="large"
          text="Unlocking tokens..."
        />
      )}
    </div>
  );
};
