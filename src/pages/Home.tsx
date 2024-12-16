import React, { useEffect, useState } from "react";

import { useWallets, usePrivy } from "@privy-io/react-auth";
import { addressToEmptyAccount, createKernelAccount, createKernelAccountClient, createZeroDevPaymasterClient } from "@zerodev/sdk";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { http, createPublicClient, zeroAddress } from "viem";
import { getEntryPoint, KERNEL_V3_1 } from "@zerodev/sdk/constants";
import { b3 } from 'viem/chains';
import { deserializePermissionAccount, serializePermissionAccount, toPermissionValidator } from "@zerodev/permissions";
import { toECDSASigner } from "@zerodev/permissions/signers";
import {
  toSudoPolicy,
} from "@zerodev/permissions/policies";
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

type KernelClientType = Awaited<ReturnType<typeof createKernelAccountClient>>;

const bundlerRpcUrl = 'bundlerRpcUrl'
const paymasterRpcUrl = 'paymasterRpcUrl'

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
        transport: http("https://mainnet-rpc.b3.fun"),
        chain: b3,
      });

      const entryPoint = getEntryPoint("0.7")

      const kernelVersion = KERNEL_V3_1;
      const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signer: privyProvider as any,
        entryPoint,
        kernelVersion,
      });

      const sessionKeySigner = await toECDSASigner({
        signer: privateKeyToAccount(generatePrivateKey()),
      });
    
      const emptyAccount = addressToEmptyAccount(sessionKeySigner.account.address)
    
      const emptySessionKeySigner = await toECDSASigner({ signer: emptyAccount })
    
      const permissionPlugin = await toPermissionValidator(publicClient, {
        entryPoint,
        signer: emptySessionKeySigner,
        policies: [
          toSudoPolicy({}),
        ],
        kernelVersion: KERNEL_V3_1,
      });

      const account = await createKernelAccount(publicClient, {
        plugins: {
          sudo: ecdsaValidator,
          regular: permissionPlugin
        },
        entryPoint,
        kernelVersion,
      });
      console.log("My account:", account.address);

      const approval = await serializePermissionAccount(account)

      const paymasterClient = createZeroDevPaymasterClient({
        chain: b3,
        transport: http(paymasterRpcUrl),
      });

      const sessionKeyAccount = await deserializePermissionAccount(
        publicClient,
        entryPoint,
        KERNEL_V3_1,
        approval,
        sessionKeySigner
      );

      const kernelClient = createKernelAccountClient({
        account: sessionKeyAccount,
        chain: b3,
        bundlerTransport: http(bundlerRpcUrl),
        paymaster: {
          getPaymasterData(userOperation) {
            return paymasterClient.sponsorUserOperation({ userOperation });
          },
        },
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
