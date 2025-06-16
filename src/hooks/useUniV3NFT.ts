import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import type { Address } from "viem";
import Univ3LPLockerContract from "../contracts/Univ3LPLocker.json";

// Uniswap V3 NFT Position Manager ABI (minimal for our needs)
const UNIV3_NFT_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "getApproved",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
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

// ReservoirV3 NFT Position Manager address on Abstract
const RESERVOIR_V3_NFT = "0xfA928D3ABc512383b8E5E77edd2d5678696084F9";

export interface UniV3Position {
  nonce: bigint;
  operator: Address;
  token0: Address;
  token1: Address;
  fee: number;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  feeGrowthInside0LastX128: bigint;
  feeGrowthInside1LastX128: bigint;
  tokensOwed0: bigint;
  tokensOwed1: bigint;
}

export const useUniV3NFT = (
  nftId?: string,
  userAddress?: Address,
  poolAddress?: Address
) => {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const tokenId = nftId ? BigInt(nftId) : undefined;
  const nftContractAddress = (poolAddress || RESERVOIR_V3_NFT) as Address;

  // Check NFT owner
  const { data: owner, refetch: refetchOwner } = useReadContract({
    address: nftContractAddress,
    abi: UNIV3_NFT_ABI,
    functionName: "ownerOf",
    args: tokenId ? [tokenId] : undefined,
    query: { enabled: !!tokenId },
  });

  // Check current approval
  const { data: approved, refetch: refetchApproval } = useReadContract({
    address: nftContractAddress,
    abi: UNIV3_NFT_ABI,
    functionName: "getApproved",
    args: tokenId ? [tokenId] : undefined,
    query: { enabled: !!tokenId },
  });

  // Get position info
  const { data: positionData, refetch: refetchPosition } = useReadContract({
    address: nftContractAddress,
    abi: UNIV3_NFT_ABI,
    functionName: "positions",
    args: tokenId ? [tokenId] : undefined,
    query: { enabled: !!tokenId },
  });

  const approve = async () => {
    if (!tokenId) return;

    return writeContract({
      address: nftContractAddress,
      abi: UNIV3_NFT_ABI,
      functionName: "approve",
      args: [Univ3LPLockerContract.address as Address, tokenId],
    });
  };

  const checkApproval = (): boolean => {
    if (!approved) return false;
    return (
      approved.toLowerCase() === Univ3LPLockerContract.address.toLowerCase()
    );
  };

  const isOwner = (): boolean => {
    if (!owner || !userAddress) return false;
    return owner.toLowerCase() === userAddress.toLowerCase();
  };

  const getPositionInfo = (): UniV3Position | null => {
    if (!positionData || !Array.isArray(positionData)) return null;

    const [
      nonce,
      operator,
      token0,
      token1,
      fee,
      tickLower,
      tickUpper,
      liquidity,
      feeGrowthInside0LastX128,
      feeGrowthInside1LastX128,
      tokensOwed0,
      tokensOwed1,
    ] = positionData;

    return {
      nonce,
      operator,
      token0,
      token1,
      fee: Number(fee),
      tickLower: Number(tickLower),
      tickUpper: Number(tickUpper),
      liquidity,
      feeGrowthInside0LastX128,
      feeGrowthInside1LastX128,
      tokensOwed0,
      tokensOwed1,
    };
  };

  const hasLiquidity = (): boolean => {
    const position = getPositionInfo();
    return position ? position.liquidity > 0n : false;
  };

  return {
    // State
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,

    // NFT info
    owner: owner as Address | undefined,
    approved: approved as Address | undefined,
    position: getPositionInfo(),

    // Checks
    isOwner: isOwner(),
    checkApproval: checkApproval(),
    hasLiquidity: hasLiquidity(),

    // Actions
    approve,

    // Refetch functions
    refetchOwner,
    refetchApproval,
    refetchPosition,
  };
};
