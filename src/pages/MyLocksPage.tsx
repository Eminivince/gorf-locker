import React, { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useTokenLocker } from "../hooks/useTokenLocker";
import { useUniv3UserLocks } from "../hooks/useUniv3UserLocks";
import { useUniv3LPLocker } from "../hooks/useUniv3LPLocker";
import { formatUnits } from "viem";
import { Lock, Clock, Unlock, RefreshCw } from "lucide-react";
import { LockDetailModal } from "../components/LockDetailModal";
import { Univ3LockDetailModal } from "../components/Univ3LockDetailModal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { StatusModal } from "../components/StatusModal";
import type { LockInfo } from "../hooks/useTokenLocker";
import type { Univ3LockInfo } from "../hooks/useUniv3UserLocks";
import "./MyLocksPage.css";

export const MyLocksPage = () => {
  const { isConnected } = useAccount();
  const {
    userNormalLocks,
    userLpLocks,
    unlockTokens,
    isPending,
    isConfirmed,
    refreshLockData,
  } = useTokenLocker();

  // UniV3 locks
  const { userLocks: univ3Locks, refetchUserLocks: refetchUniv3Locks } =
    useUniv3UserLocks();
  const {
    unlockNFT,
    isPending: isUniv3Pending,
    isConfirmed: isUniv3Confirmed,
  } = useUniv3LPLocker();

  const [selectedLock, setSelectedLock] = useState<
    LockInfo | Univ3LockInfo | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unlockingLockId, setUnlockingLockId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  // Add a ref to track if unlock success has been handled
  const unlockHandledRef = useRef(false);

  // Create a mapping to track which contract each lock belongs to
  const lockContractMap = new Map<string, "token" | "lp" | "univ3">();

  // Add prefixes to lockIds to avoid collisions and track contract types
  const prefixedUserNormalLocks = userNormalLocks.map((lock) => {
    const prefixedId = `token-${lock.lockId}`;
    lockContractMap.set(prefixedId, "token");
    return { ...lock, lockId: prefixedId };
  });

  const prefixedUserLpLocks = userLpLocks.map((lock) => {
    const prefixedId = `lp-${lock.lockId}`;
    lockContractMap.set(prefixedId, "lp");
    return { ...lock, lockId: prefixedId };
  });

  const prefixedUniv3Locks = univ3Locks.map((lock) => {
    const prefixedId = `univ3-${lock.lockId}`;
    lockContractMap.set(prefixedId, "univ3");
    return { ...lock, lockId: prefixedId };
  });

  // Define allLocks early so it can be used in useCallback dependencies
  const allLocks = [
    ...prefixedUserNormalLocks,
    ...prefixedUserLpLocks,
    ...prefixedUniv3Locks,
  ];

  // Effect to refresh data when transaction is confirmed
  useEffect(() => {
    if ((isConfirmed || isUniv3Confirmed) && !unlockHandledRef.current) {
      unlockHandledRef.current = true; // Mark as handled to prevent recursion

      // Refresh both TokenLocker and UniV3 data with a small delay to ensure blockchain state is updated
      console.log("🔄 Refreshing lock data after successful unlock...");
      setTimeout(() => {
        refreshLockData();
        refetchUniv3Locks();
      }, 1000); // 1 second delay to ensure blockchain state is updated
      setUnlockingLockId(null); // Clear unlocking state

      // Show success message
      setStatusModal({
        isOpen: true,
        type: "success",
        title: "Unlock Successful!",
        message: isUniv3Confirmed
          ? "Your UniV3 NFT has been unlocked successfully."
          : "Your tokens have been unlocked successfully.",
      });

      // Close modal if it's open
      if (isModalOpen) {
        setIsModalOpen(false);
        setSelectedLock(null);
      }
    }
  }, [
    isConfirmed,
    isUniv3Confirmed,
    refreshLockData,
    refetchUniv3Locks,
    isModalOpen,
  ]);

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
    console.log("handleUnlock", lockId);
    console.log("allLocks", allLocks);
    try {
      console.log("unlockHandledRef", unlockHandledRef.current);
      unlockHandledRef.current = false; // Reset flag for new unlock
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

      console.log("lock", lock);

      // Extract original lockId and determine contract type
      const originalLockId = lockId.split("-")[1]; // Remove prefix (token-, lp-, univ3-)
      const contractType = lockContractMap.get(lockId);

      console.log("originalLockId", originalLockId);
      console.log("contractType", contractType);

      if (contractType === "univ3") {
        await unlockNFT(originalLockId);
      } else {
        // Both token and lp locks use the same TokenLocker contract
        await unlockTokens(originalLockId);
      }

      // Note: unlockingLockId will be cleared when transaction is confirmed
    } catch (error) {
      console.error("Failed to unlock:", error);
      setUnlockingLockId(null); // Clear loading state on error
      unlockHandledRef.current = false; // Reset flag on error

      // Show user-friendly error message
      let errorMessage = "Failed to unlock";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Unlock Failed",
        message: "Failed to unlock. Please try again.",
        details: errorMessage,
      });
    }
  };

  const handleLockClick = (lock: LockInfo | Univ3LockInfo) => {
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

  const handleManualRefresh = async () => {
    console.log("🔄 Manual refresh triggered...");
    setIsRefreshing(true);
    try {
      await Promise.all([refreshLockData(), refetchUniv3Locks()]);
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); // Small delay for visual feedback
    }
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
        <button
          className={`refresh-btn ${isRefreshing ? "refreshing" : ""}`}
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          title="Refresh locks data">
          <RefreshCw size={20} className={isRefreshing ? "spinning" : ""} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
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
            <div className="nft-icon">V3</div>
          </div>
          <div className="stat-content">
            <div className="stat-value">{univ3Locks.length}</div>
            <div className="stat-label">UniV3 Locks</div>
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
                  {"nftId" in lock ? (
                    <div className="v3-badge">V3</div>
                  ) : (lock as LockInfo).isLpToken ? (
                    <div className="lp-badge">LP</div>
                  ) : (
                    <Lock size={20} />
                  )}
                  <span>
                    {"nftId" in lock
                      ? "UniV3 NFT Lock"
                      : (lock as LockInfo).isLpToken
                      ? "Liquidity Lock"
                      : "Token Lock"}
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
                  {"nftId" in lock ? (
                    // UniV3 NFT Lock info
                    <>
                      <div className="info-row">
                        <span className="label">NFT ID:</span>
                        <span className="value">{lock.nftId}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Pool:</span>
                        <span className="value">
                          {formatAddress(lock.pool)}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="label">Collector:</span>
                        <span className="value">
                          {formatAddress(lock.collector)}
                        </span>
                      </div>
                    </>
                  ) : (
                    // Regular token/LP lock info
                    <>
                      <div className="info-row">
                        <span className="label">Token:</span>
                        <span className="value">
                          {formatAddress((lock as LockInfo).token)}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="label">Amount:</span>
                        <span className="value">
                          {formatUnits(BigInt((lock as LockInfo).amount), 18)}
                        </span>
                      </div>
                      {(lock as LockInfo).tgeBps > 0 && (
                        <>
                          <div className="info-row">
                            <span className="label">TGE:</span>
                            <span className="value">
                              {(lock as LockInfo).tgeBps / 100}%
                            </span>
                          </div>
                          <div className="info-row">
                            <span className="label">Cycle:</span>
                            <span className="value">
                              {(lock as LockInfo).cycleBps / 100}%
                            </span>
                          </div>
                        </>
                      )}
                    </>
                  )}
                  <div className="info-row">
                    <span className="label">Unlock Time:</span>
                    <span className="value">{formatDate(lock.endTime)}</span>
                  </div>
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
                      disabled={
                        isPending ||
                        isUniv3Pending ||
                        unlockingLockId === lock.lockId
                      }>
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

      {/* Lock Detail Modals */}
      {selectedLock && !("nftId" in selectedLock) && (
        <LockDetailModal
          lock={selectedLock as LockInfo}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onUnlock={async (lockId: string) => {
            await handleModalUnlock(lockId);
          }}
          isPending={
            isPending ||
            isUniv3Pending ||
            unlockingLockId === selectedLock?.lockId
          }
        />
      )}

      {/* UniV3 NFT Lock Detail Modal */}
      {selectedLock && "nftId" in selectedLock && (
        <Univ3LockDetailModal
          lock={selectedLock as Univ3LockInfo}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onUnlock={async (lockId: string) => {
            await handleModalUnlock(lockId);
          }}
          isPending={
            isPending ||
            isUniv3Pending ||
            unlockingLockId === selectedLock?.lockId
          }
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
