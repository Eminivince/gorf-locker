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
        lock = lockData;
      }

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

export const useEnhancedStatistics = () => {
  // Get total number of locks
  const { data: nextLockId } = useReadContract({
    address: TokenLockerContract.address as Address,
    abi: TokenLockerContract.abi,
    functionName: "nextLockId",
  });

  // For better statistics, we'll sample locks across different ranges
  // This gives us a better representation of unique tokens
  const sampleLockIds = useMemo(() => {
    if (!nextLockId) return [];

    const totalLocks = Number(nextLockId) - 1;
    if (totalLocks <= 0) return [];

    const sampleIds: bigint[] = [];

    // Sample recent locks (last 20)
    const recentCount = Math.min(20, totalLocks);
    for (let i = 0; i < recentCount; i++) {
      sampleIds.push(BigInt(totalLocks - i));
    }

    // Sample middle range locks (every 10th lock from middle 50%)
    const middleStart = Math.floor(totalLocks * 0.25);
    const middleEnd = Math.floor(totalLocks * 0.75);
    for (
      let i = middleStart;
      i <= middleEnd && sampleIds.length < 40;
      i += 10
    ) {
      if (i > 0) {
        sampleIds.push(BigInt(i));
      }
    }

    // Sample early locks (first 10)
    const earlyCount = Math.min(10, totalLocks);
    for (let i = 1; i <= earlyCount && sampleIds.length < 50; i++) {
      if (!sampleIds.includes(BigInt(i))) {
        sampleIds.push(BigInt(i));
      }
    }

    return sampleIds.slice(0, 50); // Limit to 50 samples
  }, [nextLockId]);

  // Fixed hooks for sample locks
  const lock0 = useLockInfo(sampleLockIds[0]);
  const lock1 = useLockInfo(sampleLockIds[1]);
  const lock2 = useLockInfo(sampleLockIds[2]);
  const lock3 = useLockInfo(sampleLockIds[3]);
  const lock4 = useLockInfo(sampleLockIds[4]);
  const lock5 = useLockInfo(sampleLockIds[5]);
  const lock6 = useLockInfo(sampleLockIds[6]);
  const lock7 = useLockInfo(sampleLockIds[7]);
  const lock8 = useLockInfo(sampleLockIds[8]);
  const lock9 = useLockInfo(sampleLockIds[9]);
  const lock10 = useLockInfo(sampleLockIds[10]);
  const lock11 = useLockInfo(sampleLockIds[11]);
  const lock12 = useLockInfo(sampleLockIds[12]);
  const lock13 = useLockInfo(sampleLockIds[13]);
  const lock14 = useLockInfo(sampleLockIds[14]);
  const lock15 = useLockInfo(sampleLockIds[15]);
  const lock16 = useLockInfo(sampleLockIds[16]);
  const lock17 = useLockInfo(sampleLockIds[17]);
  const lock18 = useLockInfo(sampleLockIds[18]);
  const lock19 = useLockInfo(sampleLockIds[19]);
  const lock20 = useLockInfo(sampleLockIds[20]);
  const lock21 = useLockInfo(sampleLockIds[21]);
  const lock22 = useLockInfo(sampleLockIds[22]);
  const lock23 = useLockInfo(sampleLockIds[23]);
  const lock24 = useLockInfo(sampleLockIds[24]);
  const lock25 = useLockInfo(sampleLockIds[25]);
  const lock26 = useLockInfo(sampleLockIds[26]);
  const lock27 = useLockInfo(sampleLockIds[27]);
  const lock28 = useLockInfo(sampleLockIds[28]);
  const lock29 = useLockInfo(sampleLockIds[29]);
  const lock30 = useLockInfo(sampleLockIds[30]);
  const lock31 = useLockInfo(sampleLockIds[31]);
  const lock32 = useLockInfo(sampleLockIds[32]);
  const lock33 = useLockInfo(sampleLockIds[33]);
  const lock34 = useLockInfo(sampleLockIds[34]);
  const lock35 = useLockInfo(sampleLockIds[35]);
  const lock36 = useLockInfo(sampleLockIds[36]);
  const lock37 = useLockInfo(sampleLockIds[37]);
  const lock38 = useLockInfo(sampleLockIds[38]);
  const lock39 = useLockInfo(sampleLockIds[39]);
  const lock40 = useLockInfo(sampleLockIds[40]);
  const lock41 = useLockInfo(sampleLockIds[41]);
  const lock42 = useLockInfo(sampleLockIds[42]);
  const lock43 = useLockInfo(sampleLockIds[43]);
  const lock44 = useLockInfo(sampleLockIds[44]);
  const lock45 = useLockInfo(sampleLockIds[45]);
  const lock46 = useLockInfo(sampleLockIds[46]);
  const lock47 = useLockInfo(sampleLockIds[47]);
  const lock48 = useLockInfo(sampleLockIds[48]);
  const lock49 = useLockInfo(sampleLockIds[49]);

  // Combine all sample locks
  const sampleLocks = useMemo(() => {
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
      lock10,
      lock11,
      lock12,
      lock13,
      lock14,
      lock15,
      lock16,
      lock17,
      lock18,
      lock19,
      lock20,
      lock21,
      lock22,
      lock23,
      lock24,
      lock25,
      lock26,
      lock27,
      lock28,
      lock29,
      lock30,
      lock31,
      lock32,
      lock33,
      lock34,
      lock35,
      lock36,
      lock37,
      lock38,
      lock39,
      lock40,
      lock41,
      lock42,
      lock43,
      lock44,
      lock45,
      lock46,
      lock47,
      lock48,
      lock49,
    ];
    return locks.filter((lock): lock is LockInfo => lock !== null);
  }, [
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
    lock10,
    lock11,
    lock12,
    lock13,
    lock14,
    lock15,
    lock16,
    lock17,
    lock18,
    lock19,
    lock20,
    lock21,
    lock22,
    lock23,
    lock24,
    lock25,
    lock26,
    lock27,
    lock28,
    lock29,
    lock30,
    lock31,
    lock32,
    lock33,
    lock34,
    lock35,
    lock36,
    lock37,
    lock38,
    lock39,
    lock40,
    lock41,
    lock42,
    lock43,
    lock44,
    lock45,
    lock46,
    lock47,
    lock48,
    lock49,
  ]);

  // Calculate enhanced statistics
  const statistics = useMemo(() => {
    const totalLocks = nextLockId ? Number(nextLockId) - 1 : 0;

    // Get unique tokens from sample locks
    const uniqueTokens = new Set<string>();
    sampleLocks.forEach((lock) => {
      uniqueTokens.add(lock.token.toLowerCase());
    });

    // Calculate locks created in the last 24 hours (from recent locks only)
    const now = Math.floor(Date.now() / 1000);
    const twentyFourHoursAgo = now - 24 * 60 * 60;

    // Only check recent locks for 24h calculation
    const recentLocks = sampleLocks.filter((lock) => {
      // Assuming recent locks are those with higher IDs
      return parseInt(lock.lockId) > totalLocks - 20;
    });

    const newLocks24h = recentLocks.filter(
      (lock) => lock.startTime >= twentyFourHoursAgo
    ).length;

    // Estimate total unique tokens based on sample
    // This is a rough estimation - in a real app you might want to use events or a backend
    const sampleSize = sampleLocks.length;
    const estimatedUniqueTokens =
      sampleSize > 0
        ? Math.ceil((uniqueTokens.size / sampleSize) * totalLocks * 0.3) // Conservative estimate
        : uniqueTokens.size;

    return {
      totalLocks,
      uniqueTokensLocked: Math.max(uniqueTokens.size, estimatedUniqueTokens),
      newLocks24h,
      isLoading: !nextLockId,
      sampleSize: sampleLocks.length,
    };
  }, [nextLockId, sampleLocks]);

  return statistics;
};
