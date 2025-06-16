import { useReadContract, useAccount } from "wagmi";
import { useMemo } from "react";
import type { Address } from "viem";
import Univ3LPLockerContract from "../contracts/Univ3LPLocker.json";

export interface Univ3LockInfo {
  lockId: string;
  nftPositionManager: Address;
  pendingOwner: Address;
  owner: Address;
  collector: Address;
  pool: Address;
  collectFee: number;
  nftId: string;
  startTime: number;
  endTime: number;
}

// Hook to fetch a single UniV3 lock's details
const useUniv3LockInfo = (lockId: bigint | undefined) => {
  const {
    data: lockData,
    isLoading,
    error,
  } = useReadContract({
    address: Univ3LPLockerContract.address as Address,
    abi: Univ3LPLockerContract.abi,
    functionName: "locks",
    args: lockId !== undefined ? [lockId] : undefined,
    query: { enabled: lockId !== undefined },
  });



  return useMemo(() => {
    if (!lockData || !lockId) {
      if (lockId !== undefined) {
        console.log(`Lock No data or lockId`);
      }
      return null;
    }

    try {
      let lock: {
        lockId?: bigint;
        nftPositionManager?: Address;
        pendingOwner?: Address;
        owner?: Address;
        collector?: Address;
        pool?: Address;
        collectFee?: bigint;
        nftId?: bigint;
        startTime?: bigint;
        endTime?: bigint;
      };

      // If lockData is an array (tuple), destructure it
      if (Array.isArray(lockData)) {
        const [
          contractLockId,
          nftPositionManager,
          pendingOwner,
          owner,
          collector,
          pool,
          collectFee,
          nftId,
          startTime,
          endTime,
        ] = lockData;

        lock = {
          lockId: contractLockId,
          nftPositionManager,
          pendingOwner,
          owner,
          collector,
          pool,
          collectFee,
          nftId,
          startTime,
          endTime,
        };
      } else {
        lock = lockData;
      }

      // Validate required fields
      if (!lock.owner || !lock.nftId) {
        return null;
      }

      return {
        lockId: lockId.toString(),
        nftPositionManager: lock.nftPositionManager!,
        pendingOwner:
          lock.pendingOwner || "0x0000000000000000000000000000000000000000",
        owner: lock.owner,
        collector: lock.collector!,
        pool: lock.pool!,
        collectFee: lock.collectFee ? Number(lock.collectFee) : 0,
        nftId: lock.nftId ? lock.nftId.toString() : "0",
        startTime: lock.startTime ? Number(lock.startTime) : 0,
        endTime: lock.endTime ? Number(lock.endTime) : 0,
      } as Univ3LockInfo;
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

// Hook to fetch user's UniV3 locks
export const useUniv3UserLocks = () => {
  const { address } = useAccount();

  // Get user's lock IDs
  const { data: userLockIds, refetch: refetchUserLocks } = useReadContract({
    address: Univ3LPLockerContract.address as Address,
    abi: Univ3LPLockerContract.abi,
    functionName: "getUserLocks",
    args: [address],
    query: { enabled: !!address },
  });

  // Fetch individual locks using fixed hooks (up to 10)
  const lockIds = useMemo(() => {
    if (!userLockIds) return [];
    return (userLockIds as readonly bigint[]).slice(0, 10); // Limit to 10 for performance
  }, [userLockIds]);

  const lock0 = useUniv3LockInfo(lockIds[0]);
  const lock1 = useUniv3LockInfo(lockIds[1]);
  const lock2 = useUniv3LockInfo(lockIds[2]);
  const lock3 = useUniv3LockInfo(lockIds[3]);
  const lock4 = useUniv3LockInfo(lockIds[4]);
  const lock5 = useUniv3LockInfo(lockIds[5]);
  const lock6 = useUniv3LockInfo(lockIds[6]);
  const lock7 = useUniv3LockInfo(lockIds[7]);
  const lock8 = useUniv3LockInfo(lockIds[8]);
  const lock9 = useUniv3LockInfo(lockIds[9]);

  // Combine all locks
  const userLocks = useMemo(() => {
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
    return locks.filter((lock): lock is Univ3LockInfo => lock !== null);
  }, [lock0, lock1, lock2, lock3, lock4, lock5, lock6, lock7, lock8, lock9]);

  return {
    userLocks,
    refetchUserLocks,
  };
};

// Hook to fetch all recent UniV3 locks for explorer
export const useUniv3AllLocks = () => {
  // Get total number of locks
  const {
    data: nextLockId,
    isLoading: isLoadingLockId,
    error: lockIdError,
  } = useReadContract({
    address: Univ3LPLockerContract.address as Address,
    abi: Univ3LPLockerContract.abi,
    functionName: "nextLockId",
  });

 

  // Generate array of recent lock IDs (get the latest 10 locks)
  const recentLockIds = useMemo(() => {
    if (!nextLockId) {

      return [];
    }

    const totalLocks = Number(nextLockId) - 1; // nextLockId is 1-based
    const numToFetch = Math.min(10, totalLocks); // Fetch last 10 locks



    if (totalLocks <= 0) {
      return [];
    }

    const ids = Array.from({ length: numToFetch }, (_, i) =>
      BigInt(totalLocks - i)
    );
   
    return ids;
  }, [nextLockId]);

  // Fetch individual locks using fixed hooks (up to 10)
  const lock0 = useUniv3LockInfo(recentLockIds[0]);
  const lock1 = useUniv3LockInfo(recentLockIds[1]);
  const lock2 = useUniv3LockInfo(recentLockIds[2]);
  const lock3 = useUniv3LockInfo(recentLockIds[3]);
  const lock4 = useUniv3LockInfo(recentLockIds[4]);
  const lock5 = useUniv3LockInfo(recentLockIds[5]);
  const lock6 = useUniv3LockInfo(recentLockIds[6]);
  const lock7 = useUniv3LockInfo(recentLockIds[7]);
  const lock8 = useUniv3LockInfo(recentLockIds[8]);
  const lock9 = useUniv3LockInfo(recentLockIds[9]);

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

   

    const filteredLocks = locks.filter(
      (lock): lock is Univ3LockInfo => lock !== null
    );


    return filteredLocks;
  }, [lock0, lock1, lock2, lock3, lock4, lock5, lock6, lock7, lock8, lock9]);

  const totalLocks = nextLockId ? Number(nextLockId) - 1 : 0;

  

  return {
    allLocks,
    totalLocks,
  };
};
