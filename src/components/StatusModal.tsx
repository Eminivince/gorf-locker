import React from "react";
import { X, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import "./StatusModal.css";

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "success" | "error" | "warning";
  title: string;
  message: string;
  details?: string;
  actionButton?: {
    text: string;
    onClick: () => void;
  };
}

export const StatusModal: React.FC<StatusModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  details,
  actionButton,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle size={48} className="status-icon success" />;
      case "error":
        return <XCircle size={48} className="status-icon error" />;
      case "warning":
        return <AlertCircle size={48} className="status-icon warning" />;
      default:
        return <CheckCircle size={48} className="status-icon success" />;
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="status-modal-overlay" onClick={handleOverlayClick}>
      <div className={`status-modal ${type}`}>
        <div className="status-modal-header">
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="status-modal-content">
          {getIcon()}
          <h2 className="status-title">{title}</h2>
          <p className="status-message">{message}</p>
          {details && <p className="status-details">{details}</p>}
        </div>

        <div className="status-modal-actions">
          {actionButton && (
            <button
              className={`action-button ${type}`}
              onClick={actionButton.onClick}>
              {actionButton.text}
            </button>
          )}
          <button className="close-action-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
