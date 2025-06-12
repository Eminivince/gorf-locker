import { useReadContract } from "wagmi";
import { useMemo } from "react";
import type { Address } from "viem";
import TokenLockerContract from "../contracts/TokenLocker.json";
import type { LockInfo } from "./useTokenLocker";

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

export const useAllLocks = () => {
  // Get total number of locks
  const { data: nextLockId } = useReadContract({
    address: TokenLockerContract.address as Address,
    abi: TokenLockerContract.abi,
    functionName: "nextLockId",
  });

  // Generate array of recent lock IDs (get the latest 10 locks for now)
  const recentLockIds = useMemo(() => {
    if (!nextLockId) return [];

    const totalLocks = Number(nextLockId) - 1; // nextLockId is 1-based
    const numToFetch = Math.min(10, totalLocks); // Fetch last 10 locks

    return Array.from({ length: numToFetch }, (_, i) => BigInt(totalLocks - i));
  }, [nextLockId]);

  // Fetch individual locks using fixed hooks (up to 10)
  const lock0 = useLockInfo(recentLockIds[0]);
  const lock1 = useLockInfo(recentLockIds[1]);
  const lock2 = useLockInfo(recentLockIds[2]);
  const lock3 = useLockInfo(recentLockIds[3]);
  const lock4 = useLockInfo(recentLockIds[4]);
  const lock5 = useLockInfo(recentLockIds[5]);
  const lock6 = useLockInfo(recentLockIds[6]);
  const lock7 = useLockInfo(recentLockIds[7]);
  const lock8 = useLockInfo(recentLockIds[8]);
  const lock9 = useLockInfo(recentLockIds[9]);

  // Combine all locks
  const allLocks = useMemo(() => {
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

  // Categorize locks by type
  const categorizedLocks = useMemo(() => {
    const tokens: LockInfo[] = [];
    const v2Pools: LockInfo[] = [];
    const v3Pools: LockInfo[] = [];
    const v4Pools: LockInfo[] = [];

    allLocks.forEach((lock) => {
      if (!lock.isLpToken) {
        // Regular token lock
        tokens.push(lock);
      } else {
        // LP token - we'll need to determine the version based on fee name hash or other criteria
        // For now, we'll categorize based on some heuristics
        const feeHash = lock.feeNameHash;

        // This is a simplified categorization - you might want to improve this
        // based on actual fee name hashes or other contract data
        if (feeHash.includes("V4") || feeHash.includes("v4")) {
          v4Pools.push(lock);
        } else if (feeHash.includes("V3") || feeHash.includes("v3")) {
          v3Pools.push(lock);
        } else {
          // Default to V2 for LP tokens
          v2Pools.push(lock);
        }
      }
    });

    return {
      tokens,
      v2Pools,
      v3Pools,
      v4Pools,
    };
  }, [allLocks]);

  return {
    allLocks,
    totalLocks: nextLockId ? Number(nextLockId) - 1 : 0,
    ...categorizedLocks,
    isLoading: !nextLockId,
  };
};
