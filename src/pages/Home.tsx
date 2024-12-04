import React, { useEffect, useState } from "react";

import { useWallets, usePrivy } from "@privy-io/react-auth";
import { createKernelAccount, createKernelAccountClient } from "@zerodev/sdk";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { http, createPublicClient, Address, zeroAddress } from "viem";
import { KERNEL_V2_4 } from "@zerodev/sdk/constants";
import {
  entryPoint06Address,
  EntryPointVersion,
} from "viem/account-abstraction";
import { arbitrumBlueberry } from "../constants";

type KernelClientType = Awaited<ReturnType<typeof createKernelAccountClient>>;

function App() {
  const [kernelClient, setKernelClient] = useState<
    KernelClientType | undefined
  >();
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const embeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy"
  );

  useEffect(() => {
    const getKernelClient = async () => {
      if (!embeddedWallet) return;
      const privyProvider = await embeddedWallet.getEthereumProvider();

      const publicClient = createPublicClient({
        transport: http("https://rpc.arb-blueberry.gelato.digital"),
        chain: arbitrumBlueberry,
      });

      const entryPoint = {
        address: entryPoint06Address as Address,
        version: "0.6" as EntryPointVersion,
      };

      const kernelVersion = KERNEL_V2_4;
      const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signer: privyProvider as any,
        entryPoint,
        kernelVersion,
      });

      const account = await createKernelAccount(publicClient, {
        plugins: {
          sudo: ecdsaValidator,
        },
        entryPoint,
        kernelVersion,
      });
      console.log("My account:", account.address);

      const kernelClient = createKernelAccountClient({
        account,
        chain: arbitrumBlueberry,
        bundlerTransport: http(import.meta.env.VITE_BUNDLER_RPC),
      });
      setKernelClient(kernelClient);
    };
    if (!kernelClient) {
      console.log("getting kernel client");
      getKernelClient();
    }
  }, [embeddedWallet]);

  const sendUserOp = async () => {
    if (!kernelClient) return;
    console.log("sending user op");

    const userOpHash = await kernelClient.sendUserOperation({
      callData: await kernelClient.account!.encodeCalls([
        {
          to: zeroAddress,
          value: BigInt(0),
          data: "0x",
        },
      ]),
      // Gelato-specific configurations
      maxFeePerGas: BigInt(0),
      maxPriorityFeePerGas: BigInt(0),
    });
    const _receipt = await kernelClient.waitForUserOperationReceipt({
      hash: userOpHash,
    });
    console.log({ txHash: _receipt.receipt.transactionHash });

    console.log("userOp completed");
  };

  const eoa =
    wallets.find((wallet) => wallet.walletClientType === "privy") || wallets[0];

  return (
    <div className="App">
      <div>Authenticated: {authenticated.toString()}</div>
      {ready && authenticated && (
        <div>
          <p>Your Smart Wallet Address: {kernelClient?.account?.address}</p>
          <p>Your signer address: {eoa?.address}</p>
        </div>
      )}
      <button onClick={sendUserOp}>Send User Op</button>
    </div>
  );
}

export default App;
