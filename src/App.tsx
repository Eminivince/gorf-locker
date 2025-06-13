import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "./config/web3";
import { Navbar } from "./components/Navbar";
import { HomePage } from "./pages/HomePage";
import { MyLocksPage } from "./pages/MyLocksPage";
import { CreateLockPage } from "./pages/CreateLockPage";
import { DocsPage } from "./pages/DocsPage";
import { HowToUsePage } from "./pages/HowToUsePage";
import "./App.css";
import { AbstractWalletProvider } from "@abstract-foundation/agw-react";
import { abstract } from "viem/chains";
import { useState, createContext, useContext } from "react";

const queryClient = new QueryClient();

// Create context for wallet mode
const WalletModeContext = createContext<{
  useAbstractWallet: boolean;
  setUseAbstractWallet: (value: boolean) => void;
}>({
  useAbstractWallet: false,
  setUseAbstractWallet: () => {},
});

export const useWalletMode = () => useContext(WalletModeContext);

function AppContent() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/my-locks" element={<MyLocksPage />} />
            <Route path="/create-lock" element={<CreateLockPage />} />
            <Route path="/how-to-use" element={<HowToUsePage />} />
            <Route path="/docs" element={<DocsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function App() {
  const [useAbstractWallet, setUseAbstractWallet] = useState(true);

  const contextValue = {
    useAbstractWallet,
    setUseAbstractWallet,
  };

  return (
    <QueryClientProvider client={queryClient}>
      <WalletModeContext.Provider value={contextValue}>
        <WagmiProvider config={config}>
          {useAbstractWallet ? (
            <AbstractWalletProvider chain={abstract}>
              <AppContent />
            </AbstractWalletProvider>
          ) : (
            <AppContent />
          )}
        </WagmiProvider>
      </WalletModeContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
