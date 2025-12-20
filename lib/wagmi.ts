import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Determine if production based on NEXT_PUBLIC_CHAIN_ID
const isProduction = process.env.NEXT_PUBLIC_CHAIN_ID === '8453';

// Use Base Mainnet for production, Base Sepolia for development
const chains = isProduction
  ? [base, baseSepolia] as const
  : [baseSepolia, base] as const;

export const config = createConfig({
  chains,
  connectors: [
    injected(),
  ],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
