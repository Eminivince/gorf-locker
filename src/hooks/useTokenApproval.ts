import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits, maxUint256 } from "viem";
import type { Address } from "viem";
import TokenLockerContract from "../contracts/TokenLocker.json";

// Standard ERC20 ABI for approve and allowance functions
const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
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
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export const useTokenApproval = (
  tokenAddress?: Address,
  userAddress?: Address
) => {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Check current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [userAddress!, TokenLockerContract.address as Address],
    query: { enabled: !!tokenAddress && !!userAddress },
  });

  // Get token info
  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: { enabled: !!tokenAddress },
  });

  const { data: symbol } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "symbol",
    query: { enabled: !!tokenAddress },
  });

  const { data: name } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "name",
    query: { enabled: !!tokenAddress },
  });

  const { data: balance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [userAddress!],
    query: { enabled: !!tokenAddress && !!userAddress },
  });

  const approve = async (amount: string) => {
    if (!tokenAddress || !decimals) return;

    const amountToApprove =
      amount === "max" ? maxUint256 : parseUnits(amount, decimals);

    return writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [TokenLockerContract.address as Address, amountToApprove],
    });
  };

  const checkApproval = (requiredAmount: string): boolean => {
    if (!allowance || !decimals) return false;

    const required = parseUnits(requiredAmount, decimals);
    return allowance >= required;
  };

  return {
    // State
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,

    // Token info
    decimals: decimals ? Number(decimals) : 18,
    symbol: symbol || "",
    name: name || "",
    balance: balance || BigInt(0),
    allowance: allowance || BigInt(0),

    // Actions
    approve,
    checkApproval,
    refetchAllowance,
  };
};
