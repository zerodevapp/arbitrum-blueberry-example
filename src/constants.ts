import { defineChain } from "viem";

export const arbitrumBlueberry = defineChain({
    id: 88_153_591_557,
    name: 'Arbitrum Blueberry',
    network: 'arbitrum-blueberry',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: { http: ['https://rpc.arb-blueberry.gelato.digital'] },
        public: { http: ['https://rpc.arb-blueberry.gelato.digital'] },
    },
    blockExplorers: {
        default: { name: 'Gelatoscout', url: 'https://arb-blueberry.gelatoscout.com' },
    },
    testnet: true,
})