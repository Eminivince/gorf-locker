import { createConfig, http } from "wagmi";
import { injected, metaMask, walletConnect } from "wagmi/connectors";

// Abstract Mainnet configuration
export const abstractMainnet = {
  id: 11124,
  name: "Abstract",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://api.mainnet.abs.xyz"],
    },
  },
  blockExplorers: {
    default: { name: "Abstract Explorer", url: "https://abscan.org" },
  },
} as const;

export const config = createConfig({
  chains: [abstractMainnet],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ projectId: "bf4e65a97d34f586b029b9f8293fcfdd" }), // Replace with actual project ID
  ],
  transports: {
    [abstractMainnet.id]: http("https://api.mainnet.abs.xyz"),
  },
});

export const SUPPORTED_CHAINS = [
  {
    id: abstractMainnet.id,
    name: "Abstract",
    icon: "🔷",
  },
];
