import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Wallet, ChevronDown } from "lucide-react";
import { useState } from "react";
import "./ConnectWalletButton.css";

export const ConnectWalletButton = () => {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [showDropdown, setShowDropdown] = useState(false);

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
            <div className="wallet-avatar"></div>
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
          {connectors.map((connector) => (
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
          ))}
        </div>
      )}
    </div>
  );
};
