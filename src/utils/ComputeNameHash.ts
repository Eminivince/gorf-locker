import { keccak256, toBytes } from "viem";

// Function to compute nameHash
export const computeNameHash = (feeName: string): `0x${string}` => {
  return keccak256(toBytes(feeName));
};

// Pre-computed nameHashes for the available fee types
export const FEE_NAME_HASHES = {
  TOKEN: computeNameHash("TOKEN"),
  LP_DEFAULT: computeNameHash("LP_DEFAULT"),
  LP_ONLY: computeNameHash("LP_ONLY"),
  LP_AND_ETH: computeNameHash("LP_AND_ETH"),
} as const;

// Example usage

