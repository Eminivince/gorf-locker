import { useReadContract } from "wagmi";
import type { Address } from "viem";

// Standard ERC20 ABI for token information
const ERC20_ABI = [
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// UniV2 Pair ABI for getting token addresses
const UNIV2_PAIR_ABI = [
  {
    name: "token0",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "token1",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

// UniV3 Position Manager ABI for getting position info
const UNIV3_POSITION_ABI = [
  {
    name: "positions",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "nonce", type: "uint96" },
      { name: "operator", type: "address" },
      { name: "token0", type: "address" },
      { name: "token1", type: "address" },
      { name: "fee", type: "uint24" },
      { name: "tickLower", type: "int24" },
      { name: "tickUpper", type: "int24" },
      { name: "liquidity", type: "uint128" },
      { name: "feeGrowthInside0LastX128", type: "uint256" },
      { name: "feeGrowthInside1LastX128", type: "uint256" },
      { name: "tokensOwed0", type: "uint128" },
      { name: "tokensOwed1", type: "uint128" },
    ],
  },
] as const;

export interface TokenInfo {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  isLoading: boolean;
}

export const useTokenInfo = (tokenAddress?: Address) => {
  const { data: decimals, isLoading: decimalsLoading } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: { enabled: !!tokenAddress },
  });

  const { data: symbol, isLoading: symbolLoading } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "symbol",
    query: { enabled: !!tokenAddress },
  });

  const { data: name, isLoading: nameLoading } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "name",
    query: { enabled: !!tokenAddress },
  });

  const { data: totalSupply, isLoading: totalSupplyLoading } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "totalSupply",
    query: { enabled: !!tokenAddress },
  });

  return {
    name: name || "Unknown Token",
    symbol: symbol || "UNKNOWN",
    decimals: decimals ? Number(decimals) : 18,
    totalSupply: totalSupply || BigInt(0),
    address: tokenAddress,
    isLoading:
      decimalsLoading || symbolLoading || nameLoading || totalSupplyLoading,
  };
};

// Hook for getting info about two tokens (useful for UniV3 pairs)
export const useTokenPairInfo = (token0?: Address, token1?: Address) => {
  const token0Info = useTokenInfo(token0);
  const token1Info = useTokenInfo(token1);

  return {
    token0: token0Info,
    token1: token1Info,
    pairName:
      token0Info.symbol &&
      token1Info.symbol &&
      token0Info.symbol !== "UNKNOWN" &&
      token1Info.symbol !== "UNKNOWN"
        ? `${token0Info.symbol}/${token1Info.symbol}`
        : "Unknown Pair",
    isLoading: token0Info.isLoading || token1Info.isLoading,
  };
};

// Hook for getting UniV2 LP token pair information
export const useUniV2PairInfo = (pairAddress?: Address) => {
  const { data: token0Address } = useReadContract({
    address: pairAddress,
    abi: UNIV2_PAIR_ABI,
    functionName: "token0",
    query: { enabled: !!pairAddress },
  });

  const { data: token1Address } = useReadContract({
    address: pairAddress,
    abi: UNIV2_PAIR_ABI,
    functionName: "token1",
    query: { enabled: !!pairAddress },
  });

  const pairInfo = useTokenPairInfo(token0Address, token1Address);

  return {
    ...pairInfo,
    pairAddress,
    token0Address,
    token1Address,
  };
};

// Hook for getting UniV3 NFT position pair information
export const useUniV3PositionInfo = (
  positionManagerAddress?: Address,
  tokenId?: string
) => {
  const { data: positionData } = useReadContract({
    address: positionManagerAddress,
    abi: UNIV3_POSITION_ABI,
    functionName: "positions",
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: { enabled: !!positionManagerAddress && !!tokenId },
  });

  const token0Address = positionData
    ? ((positionData as any[])[2] as Address)
    : undefined;
  const token1Address = positionData
    ? ((positionData as any[])[3] as Address)
    : undefined;
  const fee = positionData ? Number((positionData as any[])[4]) : undefined;

  const pairInfo = useTokenPairInfo(token0Address, token1Address);

  const formatFee = (feeAmount?: number) => {
    if (!feeAmount) return "";
    return `${feeAmount / 10000}%`;
  };

  return {
    ...pairInfo,
    positionManagerAddress,
    tokenId,
    token0Address,
    token1Address,
    fee,
    feeFormatted: formatFee(fee),
    pairName:
      pairInfo.pairName && fee
        ? `${pairInfo.pairName} (${formatFee(fee)})`
        : pairInfo.pairName,
  };
};
