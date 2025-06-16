import {
  useWriteContract,
  useReadContract,
  useAccount,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";
import type { Address } from "viem";
import Univ3LPLockerContract from "../contracts/Univ3LPLocker.json";
import { useMemo } from "react";

export interface Univ3LockParams {
  nftManager: Address;
  nftId: string;
  collector: Address;
  unlockTime: number;
  feeName: string;
}

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

export interface FeeStruct {
  name: string;
  lpFee: number;
  collectFee: number;
  lockFee: number;
  lockFeeToken: Address;
}

// Hook to fetch a single lock's details
const useUniv3LockInfo = (lockId: bigint | undefined) => {
  const { data: lockData } = useReadContract({
    address: Univ3LPLockerContract.address as Address,
    abi: Univ3LPLockerContract.abi,
    functionName: "locks",
    args: lockId !== undefined ? [lockId] : undefined,
    query: { enabled: lockId !== undefined },
  });

  return useMemo(() => {
    if (!lockData || !lockId) return null;

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
        console.warn("Invalid lock data:", lock);
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

export const useUniv3LPLocker = () => {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Get user's locks
  const { data: userLockIds, refetch: refetchUserLocks } = useReadContract({
    address: Univ3LPLockerContract.address as Address,
    abi: Univ3LPLockerContract.abi,
    functionName: "getUserLocks",
    args: [address],
    query: { enabled: !!address },
  });

  const { data: totalLocks, refetch: refetchTotalLocks } = useReadContract({
    address: Univ3LPLockerContract.address as Address,
    abi: Univ3LPLockerContract.abi,
    functionName: "nextLockId",
  });

  // Get fee structure
  const { data: feeStructure } = useReadContract({
    address: Univ3LPLockerContract.address as Address,
    abi: Univ3LPLockerContract.abi,
    functionName: "getFee",
    args: ["DEFAULT"],
    query: { enabled: true },
  });

  const createLock = async (params: Univ3LockParams) => {
    if (!address) throw new Error("Wallet not connected");

    // Calculate fee value - for now using 0 ETH, will be updated based on fee structure
    const value = parseEther("0");

    return writeContract({
      address: Univ3LPLockerContract.address as Address,
      abi: Univ3LPLockerContract.abi,
      functionName: "lock",
      args: [
        params.nftManager, // INonfungiblePositionManager nftManager_
        BigInt(params.nftId), // uint256 nftId_
        address, // address owner_ (lock owner)
        params.collector, // address collector_ (fee collector)
        BigInt(params.unlockTime), // uint256 endTime_
        params.feeName, // string memory feeName_
      ],
      value,
    });
  };

  const unlockNFT = async (lockId: string) => {
    try {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      return await writeContract({
        address: Univ3LPLockerContract.address as Address,
        abi: Univ3LPLockerContract.abi,
        functionName: "unlock",
        args: [BigInt(lockId)],
      });
    } catch (error) {
      console.error("Error in unlockNFT:", error);
      throw error;
    }
  };

  const refreshLockData = async () => {
    await Promise.all([refetchUserLocks(), refetchTotalLocks()]);
  };

  return {
    // State
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,

    // Data
    userLockIds: userLockIds as readonly bigint[] | undefined,
    totalLocks: totalLocks ? Number(totalLocks) - 1 : 0,
    feeStructure: feeStructure as FeeStruct | undefined,

    // Actions
    createLock,
    unlockNFT,

    // Refetch functions
    refreshLockData,
  };
};
