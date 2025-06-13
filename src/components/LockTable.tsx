import React, { useState } from "react";
import type { LockInfo } from "../hooks/useTokenLocker";
import { LockDetailModal } from "./LockDetailModal";
import { LockTableRow } from "./LockTableRow";
import "./LockTable.css";

interface LockTableProps {
  locks: LockInfo[];
  type: "tokens" | "v2" | "v3" | "v4";
}

export const LockTable: React.FC<LockTableProps> = ({ locks, type }) => {
  const [selectedLock, setSelectedLock] = useState<LockInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
            <LockTableRow
              key={lock.lockId}
              lock={lock}
              type={type}
              onLockClick={handleLockClick}
            />
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
