import {
  useWriteContract,
  useReadContract,
  useAccount,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, parseUnits } from "viem";
import type { Address } from "viem";
import TokenLockerContract from "../contracts/TokenLocker.json";
import { useMemo } from "react";
import { useWalletMode } from "../App";

export interface LockParams {
  token: Address;
  amount: string;
  unlockTime: number;
  feeType: "TOKEN" | "LP_DEFAULT" | "LP_ONLY" | "LP_AND_ETH";
  decimals?: number;
}

export interface VestingLockParams extends LockParams {
  tgeTime: number;
  tgePercentage: number;
  cycle: number;
  cyclePercentage: number;
}

export interface LockInfo {
  lockId: string;
  token: Address;
  isLpToken: boolean;
  pendingOwner: Address;
  owner: Address;
  tgeBps: number;
  cycleBps: number;
  amount: string;
  startTime: number;
  endTime: number;
  cycle: number;
  unlockedAmount: string;
  feeNameHash: string;
}

// Hook to fetch a single lock's details
const useLockInfo = (lockId: bigint | undefined) => {
  const { data: lockData } = useReadContract({
    address: TokenLockerContract.address as Address,
    abi: TokenLockerContract.abi,
    functionName: "locks",
    args: lockId !== undefined ? [lockId] : undefined,
    query: { enabled: lockId !== undefined },
  });

  return useMemo(() => {
    if (!lockData || !lockId) return null;

    try {
      // Log the raw data for debugging

      // Handle different possible data structures
      let lock: {
        lockId?: bigint;
        token?: Address;
        isLpToken?: boolean;
        pendingOwner?: Address;
        owner?: Address;
        tgeBps?: bigint;
        cycleBps?: bigint;
        amount?: bigint;
        startTime?: bigint;
        endTime?: bigint;
        cycle?: bigint;
        unlockedAmount?: bigint;
        feeNameHash?: string;
      };

      // If lockData is an array (tuple), destructure it
      if (Array.isArray(lockData)) {
        const [
          contractLockId,
          token,
          isLpToken,
          pendingOwner,
          owner,
          tgeBps,
          cycleBps,
          amount,
          startTime,
          endTime,
          cycle,
          unlockedAmount,
          feeNameHash,
        ] = lockData;

        lock = {
          lockId: contractLockId,
          token,
          isLpToken,
          pendingOwner,
          owner,
          tgeBps,
          cycleBps,
          amount,
          startTime,
          endTime,
          cycle,
          unlockedAmount,
          feeNameHash,
        };
      } else {
        // If it's an object, use it directly
        lock = lockData;
      }

      // Validate required fields
      if (!lock.token || !lock.amount) {
        console.warn("Invalid lock data:", lock);
        return null;
      }

      return {
        lockId: lockId.toString(),
        token: lock.token,
        isLpToken: Boolean(lock.isLpToken),
        pendingOwner:
          lock.pendingOwner || "0x0000000000000000000000000000000000000000",
        owner: lock.owner,
        tgeBps: lock.tgeBps ? Number(lock.tgeBps) : 0,
        cycleBps: lock.cycleBps ? Number(lock.cycleBps) : 0,
        amount: lock.amount ? lock.amount.toString() : "0",
        startTime: lock.startTime ? Number(lock.startTime) : 0,
        endTime: lock.endTime ? Number(lock.endTime) : 0,
        cycle: lock.cycle ? Number(lock.cycle) : 0,
        unlockedAmount: lock.unlockedAmount
          ? lock.unlockedAmount.toString()
          : "0",
        feeNameHash:
          lock.feeNameHash ||
          "0x0000000000000000000000000000000000000000000000000000000000000000",
      } as LockInfo;
    } catch (error) {
      console.error(
        "Error processing lock data for ID",
        lockId.toString(),
        ":",
        error
      );
      return null;
    }
  }, [lockData, lockId]);
};

// Hook to fetch multiple locks
const useMultipleLocks = (lockIds: readonly bigint[] | undefined) => {
  // We'll fetch up to 10 locks for now to avoid too many simultaneous calls
  const maxLocks = 10;
  const limitedLockIds = lockIds?.slice(0, maxLocks);

  const lock0 = useLockInfo(limitedLockIds?.[0]);
  const lock1 = useLockInfo(limitedLockIds?.[1]);
  const lock2 = useLockInfo(limitedLockIds?.[2]);
  const lock3 = useLockInfo(limitedLockIds?.[3]);
  const lock4 = useLockInfo(limitedLockIds?.[4]);
  const lock5 = useLockInfo(limitedLockIds?.[5]);
  const lock6 = useLockInfo(limitedLockIds?.[6]);
  const lock7 = useLockInfo(limitedLockIds?.[7]);
  const lock8 = useLockInfo(limitedLockIds?.[8]);
  const lock9 = useLockInfo(limitedLockIds?.[9]);

  return useMemo(() => {
    const locks = [
      lock0,
      lock1,
      lock2,
      lock3,
      lock4,
      lock5,
      lock6,
      lock7,
      lock8,
      lock9,
    ];
    return locks.filter((lock): lock is LockInfo => lock !== null);
  }, [lock0, lock1, lock2, lock3, lock4, lock5, lock6, lock7, lock8, lock9]);
};

// Hook to get withdrawable tokens for a specific lock
export const useWithdrawableTokens = (lockId: string | undefined) => {
  const { data: withdrawableAmount } = useReadContract({
    address: TokenLockerContract.address as Address,
    abi: TokenLockerContract.abi,
    functionName: "withdrawableTokens",
    args: lockId ? [BigInt(lockId)] : undefined,
    query: { enabled: !!lockId },
  });

  return withdrawableAmount as bigint | undefined;
};

export const useTokenLocker = () => {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { useAbstractWallet } = useWalletMode();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Helper function to handle amount conversion based on wallet type
  const convertAmount = (amount: string, decimals: number = 18) => {
    const normalAmount = parseUnits(amount, decimals);

    if (useAbstractWallet) {
      // AGW seems to be adding 12 extra zeros to the amount
      // This is a known issue with some wallet providers
      // We need to compensate by dividing by 10^12
      const adjustedAmount = normalAmount / BigInt(10 ** 12);

      console.log("AGW Amount Conversion:", {
        originalAmount: amount,
        normalAmount: normalAmount.toString(),
        adjustedAmount: adjustedAmount.toString(),
        difference: (normalAmount / adjustedAmount).toString(),
      });

      return adjustedAmount;
    } else {
      // Standard wallets work correctly with parseUnits
      return normalAmount;
    }
  };

  // Get lock IDs for normal locks
  const { data: normalLockIds, refetch: refetchNormalLockIds } =
    useReadContract({
      address: TokenLockerContract.address as Address,
      abi: TokenLockerContract.abi,
      functionName: "getUserNormalLocks",
      args: [address],
      query: { enabled: !!address },
    });

  // Get lock IDs for LP locks
  const { data: lpLockIds, refetch: refetchLpLockIds } = useReadContract({
    address: TokenLockerContract.address as Address,
    abi: TokenLockerContract.abi,
    functionName: "getUserLpLocks",
    args: [address],
    query: { enabled: !!address },
  });

  const { data: totalLocks, refetch: refetchTotalLocks } = useReadContract({
    address: TokenLockerContract.address as Address,
    abi: TokenLockerContract.abi,
    functionName: "nextLockId",
  });

  // Fetch actual lock details
  const userNormalLocks = useMultipleLocks(
    normalLockIds as readonly bigint[] | undefined
  );
  const userLpLocks = useMultipleLocks(
    lpLockIds as readonly bigint[] | undefined
  );

  // Function to refresh all lock data
  const refreshLockData = async () => {
    await Promise.all([
      refetchNormalLockIds(),
      refetchLpLockIds(),
      refetchTotalLocks(),
    ]);
  };

  // Write functions
  const createNormalLock = async (params: LockParams) => {
    if (!address) throw new Error("Wallet not connected");

    const amount = convertAmount(params.amount, params.decimals || 18);
    const value =
      params.feeType === "TOKEN"
        ? parseEther("0.000001")
        : parseEther("0.000001");
    // params.feeType === "TOKEN" ? parseEther("0.02") : parseEther("0.01");

    console.log("Creating lock with:", {
      walletType: useAbstractWallet ? "AGW" : "Standard",
      originalAmount: params.amount,
      convertedAmount: amount.toString(),
      decimals: params.decimals || 18,
    });

    return writeContract({
      address: TokenLockerContract.address as Address,
      abi: TokenLockerContract.abi,
      functionName: "lock",
      args: [
        params.token, // address token_
        params.feeType, // string feeName_
        address, // address owner_
        amount, // uint256 amount_
        BigInt(params.unlockTime), // uint256 endTime_
      ],
      value,
    });
  };

  const createVestingLock = async (params: VestingLockParams) => {
    if (!address) throw new Error("Wallet not connected");

    const amount = convertAmount(params.amount, params.decimals || 18);
    const value =
      params.feeType === "TOKEN"
        ? parseEther("0.000001")
        : parseEther("0.000001");
    // params.feeType === "TOKEN" ? parseEther("0.02") : parseEther("0.01");

    console.log("Creating vesting lock with:", {
      walletType: useAbstractWallet ? "AGW" : "Standard",
      originalAmount: params.amount,
      convertedAmount: amount.toString(),
      decimals: params.decimals || 18,
    });

    // Create the VestingLockParams struct
    const vestingParams = {
      token: params.token,
      tgeBps: params.tgePercentage * 100, // Convert percentage to basis points
      cycleBps: params.cyclePercentage * 100, // Convert percentage to basis points
      owner: address,
      amount: amount,
      tgeTime: BigInt(params.tgeTime),
      cycle: BigInt(params.cycle * 24 * 60 * 60), // Convert days to seconds
    };

    return writeContract({
      address: TokenLockerContract.address as Address,
      abi: TokenLockerContract.abi,
      functionName: "vestingLock",
      args: [
        vestingParams, // VestingLockParams struct
        params.feeType, // string feeName_
      ],
      value,
    });
  };

  const unlockTokens = async (lockId: string) => {
    try {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      const result = await writeContract({
        address: TokenLockerContract.address as Address,
        abi: TokenLockerContract.abi,
        functionName: "unlock",
        args: [BigInt(lockId)],
      });

      return result;
    } catch (error) {
      console.error("Error in unlockTokens:", error);
      throw error;
    }
  };

  const transferLock = async (lockId: string, newOwner: Address) => {
    return writeContract({
      address: TokenLockerContract.address as Address,
      abi: TokenLockerContract.abi,
      functionName: "transferLock",
      args: [BigInt(lockId), newOwner],
    });
  };

  return {
    // State
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,

    // Data
    userNormalLocks,
    userLpLocks,
    totalLocks: totalLocks ? Number(totalLocks) - 1 : 0, // nextLockId - 1 = total locks

    // Raw data for debugging
    normalLockIds: normalLockIds as readonly bigint[] | undefined,
    lpLockIds: lpLockIds as readonly bigint[] | undefined,

    // Actions
    createNormalLock,
    createVestingLock,
    unlockTokens,
    transferLock,

    // Refetch functions
    refreshLockData,
  };
};
