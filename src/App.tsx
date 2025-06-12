import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "./config/web3";
import { Navbar } from "./components/Navbar";
import { HomePage } from "./pages/HomePage";
import { MyLocksPage } from "./pages/MyLocksPage";
import { CreateLockPage } from "./pages/CreateLockPage";
import { DocsPage } from "./pages/DocsPage";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/my-locks" element={<MyLocksPage />} />
                <Route path="/create-lock" element={<CreateLockPage />} />
                <Route path="/docs" element={<DocsPage />} />
              </Routes>
            </main>
          </div>
        </Router>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
