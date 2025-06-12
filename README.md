# Abstract Locker UI

A modern web interface for the Abstract Locker protocol, a decentralized token locking and vesting platform built on Abstract Chain. This application allows users to securely lock and manage their tokens with various vesting schedules.

## 🌟 Key Features

- **Token Locking**: Lock any ERC20 token with customizable lock periods
- **LP Token Support**: Lock liquidity pool (LP) tokens from various DEX versions (V2, V3, V4)
- **Vesting Schedules**: Create custom vesting schedules with:
  - Token Generation Event (TGE) percentage
  - Cycle-based unlocks
  - Customizable vesting periods
- **Lock Management**:
  - View all active locks
  - Monitor lock status and unlock times
  - Transfer lock ownership
  - Unlock tokens when vesting period ends
- **Multiple Fee Structures**: Support for different fee types:
  - Token-based fees
  - LP token fees
  - Custom fee structures

## 🛠️ Technical Stack

- **Frontend Framework**: React 19 with TypeScript
- **Web3 Integration**:
  - wagmi for Ethereum interactions
  - viem for low-level blockchain operations
- **UI/UX**:
  - Tailwind CSS for styling
  - Lucide React for icons
  - Recharts for data visualization
- **Build Tools**:
  - Vite 6 for fast development and building
  - ESLint for code quality
  - TypeScript for type safety

## 🚀 Getting Started

1. **Prerequisites**:

   - Node.js (Latest LTS version)
   - Yarn package manager
   - MetaMask or compatible Web3 wallet

2. **Installation**:

   ```bash
   yarn install
   ```

3. **Development**:

   ```bash
   yarn dev
   ```

   The application will be available at `http://localhost:5173`

4. **Building for Production**:
   ```bash
   yarn build
   ```
