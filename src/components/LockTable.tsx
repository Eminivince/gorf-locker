import React, { useState } from "react";
import type { LockInfo } from "../hooks/useTokenLocker";
import type { Univ3LockInfo } from "../hooks/useUniv3UserLocks";
import { LockDetailModal } from "./LockDetailModal";
import { Univ3LockDetailModal } from "./Univ3LockDetailModal";
import { LockTableRow } from "./LockTableRow";
import "./LockTable.css";

interface LockTableProps {
  locks: LockInfo[];
  type: "tokens" | "v2" | "v3" | "v4";
  isUniV3NFT?: boolean;
  uniV3Data?: Array<{
    nftPositionManager: string;
    nftId: string;
  }>;
  originalUniv3Locks?: Univ3LockInfo[];
}

export const LockTable: React.FC<LockTableProps> = ({
  locks,
  type,
  isUniV3NFT = false,
  uniV3Data = [],
  originalUniv3Locks = [],
}) => {
  const [selectedLock, setSelectedLock] = useState<LockInfo | null>(null);
  const [selectedUniv3Lock, setSelectedUniv3Lock] =
    useState<Univ3LockInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLockClick = (lock: LockInfo, index?: number) => {
    if (isUniV3NFT && originalUniv3Locks && index !== undefined) {
      // For UniV3 NFT locks, use the original lock data
      setSelectedUniv3Lock(originalUniv3Locks[index]);
      setSelectedLock(null);
    } else {
      // For regular locks
      setSelectedLock(lock);
      setSelectedUniv3Lock(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLock(null);
    setSelectedUniv3Lock(null);
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
          {locks.map((lock, index) => {
            const uniV3Info =
              isUniV3NFT && uniV3Data[index] ? uniV3Data[index] : undefined;

            return (
              <LockTableRow
                key={lock.lockId}
                lock={lock}
                type={type}
                onLockClick={(lock) => handleLockClick(lock, index)}
                isUniV3NFT={isUniV3NFT}
                nftPositionManager={uniV3Info?.nftPositionManager}
              />
            );
          })}
        </div>
      </div>

      {/* Lock Detail Modals */}
      {selectedLock && (
        <LockDetailModal
          lock={selectedLock}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onUnlock={async () => {}} // Empty function since this is read-only
          isPending={false}
        />
      )}

      {/* UniV3 NFT Lock Detail Modal */}
      {selectedUniv3Lock && (
        <Univ3LockDetailModal
          lock={selectedUniv3Lock}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onUnlock={async () => {}} // Empty function since this is read-only
          isPending={false}
        />
      )}
    </>
  );
};
