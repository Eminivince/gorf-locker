import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Wallet, ChevronDown, Settings } from "lucide-react";
import { useState } from "react";
import "./ConnectWalletButton.css";
import { useLoginWithAbstract } from "@abstract-foundation/agw-react";
import { useWalletMode } from "../App";

export const ConnectWalletButton = () => {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const { login } = useLoginWithAbstract();
  const { useAbstractWallet, setUseAbstractWallet } = useWalletMode();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };


  if (isConnected && address) {
    return (
      <div className="wallet-connected">
        <button
          className="connected-wallet-btn"
          onClick={() => setShowDropdown(!showDropdown)}>
          <div className="wallet-info">
            <div className="text-green-500 bg-black rounded-full p-1">
              <svg
                viewBox="0 0 24 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                height="18">
                <path
                  d="M15.821 14.984L20.642 19.759L18.38 21.999L13.56 17.225C13.146 16.815 12.602 16.592 12.015 16.592C11.429 16.592 10.884 16.815 10.471 17.225L5.651 21.999L3.389 19.759L8.209 14.984H15.818H15.821Z"
                  fill="currentColor"></path>
                <path
                  d="M16.626 13.608L23.209 15.353L24.036 12.29L17.453 10.545C16.889 10.396 16.42 10.038 16.127 9.536C15.834 9.037 15.758 8.453 15.909 7.895L17.671 1.374L14.579 0.556L12.816 7.076L16.623 13.604L16.626 13.608Z"
                  fill="currentColor"></path>
                <path
                  d="M7.409 13.608L0.827 15.353L0 12.29L6.583 10.545C7.146 10.396 7.616 10.038 7.909 9.536C8.202 9.037 8.277 8.453 8.127 7.895L6.365 1.374L9.457 0.556L11.219 7.076L7.413 13.604L7.409 13.608Z"
                  fill="currentColor"></path>
              </svg>
            </div>
            <span>{formatAddress(address)}</span>
          </div>
          <ChevronDown size={16} />
        </button>

        {showDropdown && (
          <div className="wallet-dropdown">
            <div className="wallet-dropdown-item">
              <span className="wallet-address">{address}</span>
            </div>
            <button
              className="wallet-dropdown-item disconnect-btn"
              onClick={() => {
                disconnect();
                setShowDropdown(false);
              }}>
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      <button
        className="connect-wallet-btn"
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isPending}>
        <Wallet size={16} />
        {isPending ? "Connecting..." : "Connect Wallet"}
      </button>

      {showDropdown && (
        <div className="wallet-dropdown">
          {/* Wallet Mode Selector */}
          <div className="wallet-mode-section">
            <button
              className="wallet-dropdown-item mode-selector-btn"
              onClick={() => setShowModeSelector(!showModeSelector)}>
              <Settings size={16} />
              <span>
                Wallet Mode: {useAbstractWallet ? "Abstract GW" : "Standard"}
              </span>
              <ChevronDown size={16} />
            </button>

            {showModeSelector && (
              <div className="mode-options">
                <button
                  className={`mode-option ${
                    !useAbstractWallet ? "active" : ""
                  }`}
                  onClick={() => {
                    setUseAbstractWallet(false);
                    setShowModeSelector(false);
                  }}>
                  Standard Mode (MetaMask, WalletConnect, etc.)
                </button>
                <button
                  className={`mode-option ${useAbstractWallet ? "active" : ""}`}
                  onClick={() => {
                    setUseAbstractWallet(true);
                    setShowModeSelector(false);
                  }}>
                  Abstract Wallet Mode
                </button>
              </div>
            )}
          </div>

          <div className="wallet-divider"></div>

          {/* Wallet Connectors */}
          {useAbstractWallet ? (
            // Abstract Wallet Mode
            <button
              className="wallet-dropdown-item connector-btn"
              onClick={() => {
                login();
                setShowDropdown(false);
              }}
              disabled={isPending}>
              Connect with Abstract Wallet
            </button>
          ) : (
            // Standard Wallet Mode
            connectors.map((connector) => (
              <button
                key={connector.uid}
                className="wallet-dropdown-item connector-btn"
                onClick={() => {
                  connect({ connector });
                  setShowDropdown(false);
                }}
                disabled={isPending}>
                {connector.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
