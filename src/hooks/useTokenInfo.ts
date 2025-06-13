import { useReadContract } from "wagmi";
import type { Address } from "viem";

// Standard ERC20 ABI for token info
const ERC20_ABI = [
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  isLoading: boolean;
}

export const useTokenInfo = (tokenAddress?: Address): TokenInfo => {
  const { data: name, isLoading: nameLoading } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "name",
    query: { enabled: !!tokenAddress },
  });

  const { data: symbol, isLoading: symbolLoading } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "symbol",
    query: { enabled: !!tokenAddress },
  });

  const { data: decimals, isLoading: decimalsLoading } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: { enabled: !!tokenAddress },
  });

  const { data: totalSupply, isLoading: totalSupplyLoading } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "totalSupply",
    query: { enabled: !!tokenAddress },
  });

  return {
    name: (name as string) || "Unknown Token",
    symbol: (symbol as string) || "UNKNOWN",
    decimals: (decimals as number) || 18,
    totalSupply: (totalSupply as bigint) || BigInt(0),
    isLoading:
      nameLoading || symbolLoading || decimalsLoading || totalSupplyLoading,
  };
};
