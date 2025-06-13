import React from "react";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  text?: string;
  overlay?: boolean;
}

const sizeMap = {
  small: "w-6 h-6 border-2",
  medium: "w-10 h-10 border-4",
  large: "w-16 h-16 border-4",
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  text,
  overlay = false,
}) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-2">
      <div
        className={`animate-spin rounded-full border-t-transparent border-solid border-green-500 ${sizeMap[size]} border`}
        role="status"
      />
      {text && (
        <div className="text-white text-sm mt-2 text-center">{text}</div>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        {spinner}
      </div>
    );
  }

  return spinner;
};
