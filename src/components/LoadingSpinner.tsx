import React from "react";
import "./LoadingSpinner.css";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  text?: string;
  overlay?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  text,
  overlay = false,
}) => {
  const spinnerContent = (
    <div className={`loading-spinner ${size}`}>
      <div className="spinner"></div>
      {text && <div className="loading-text">{text}</div>}
    </div>
  );

  if (overlay) {
    return <div className="loading-overlay">{spinnerContent}</div>;
  }

  return spinnerContent;
};
