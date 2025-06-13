import React from "react";
import { X, CheckCircle, XCircle, AlertCircle } from "lucide-react";

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

const iconMap = {
  success: <CheckCircle size={48} className="text-green-400 mb-2" />,
  error: <XCircle size={48} className="text-red-500 mb-2" />,
  warning: <AlertCircle size={48} className="text-yellow-400 mb-2" />,
};

const actionButtonClass = {
  success: "bg-green-400 text-black hover:bg-green-500",
  error: "bg-red-500 text-white hover:bg-red-600",
  warning: "bg-yellow-400 text-black hover:bg-yellow-500",
};

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

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={handleOverlayClick}>
      <div
        className={`bg-gray-900 border rounded-2xl shadow-2xl w-full max-w-md mx-2 sm:mx-0 animate-slideIn
          ${type === "success" ? "border-green-400" : ""}
          ${type === "error" ? "border-red-500" : ""}
          ${type === "warning" ? "border-yellow-400" : ""}
        `}>
        <div className="flex justify-end pt-4 pr-4">
          <button
            className="text-gray-400 hover:text-white p-1 rounded transition"
            onClick={onClose}
            aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 pb-6 flex flex-col items-center text-center gap-4">
          {iconMap[type]}
          <h2 className="text-white text-xl font-semibold leading-tight mb-1">
            {title}
          </h2>
          <p className="text-gray-300 text-base leading-normal mb-1">
            {message}
          </p>
          {details && (
            <p className="text-gray-400 text-xs bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-mono break-all w-full max-w-full">
              {details}
            </p>
          )}
        </div>
        <div className="px-6 pb-6 flex flex-wrap gap-3 justify-center">
          {actionButton && (
            <button
              className={`min-w-[120px] px-5 py-2 rounded-lg font-semibold text-sm transition ${actionButtonClass[type]}`}
              onClick={actionButton.onClick}>
              {actionButton.text}
            </button>
          )}
          <button
            className="min-w-[120px] px-5 py-2 rounded-lg font-semibold text-sm border border-gray-600 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white transition"
            onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
