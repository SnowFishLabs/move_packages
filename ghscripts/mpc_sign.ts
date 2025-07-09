// import {
//     CreateMPCSignTransactionRequest,
//     MPCSignApi,
//     OneMPCSignTransactionsRequest
// } from "@safeheron/api-sdk";
// import { readFileSync } from 'fs';
// import {
//     AccountAuthenticator,
//     AccountAuthenticatorEd25519,
//     Aptos,
//     AptosConfig,
//     Deserializer,
//     Ed25519PublicKey,
//     Ed25519Signature,
//     Hex,
//     Network,
//     NetworkToNetworkName,
// } from "@aptos-labs/ts-sdk"
// import fs from "fs";

// async function requestMpcSign(mpcSignApi: MPCSignApi, customerRefId: string, hash: string, accountKey: string): Promise<string> {
//     const request: CreateMPCSignTransactionRequest = {
//         customerRefId,
//         sourceAccountKey: accountKey,
//         signAlg: 'ed25519',
//         dataList: [{
//             // 32-byte hex string without '0x' prefix
//             data: hash.substring(2)
//         }]
//     };

//     const txResult = await mpcSignApi.createMPCSignTransactions(request)
//     return txResult.txKey;
// }

// async function retrieveSig(mpcSignApi: MPCSignApi, txKey: string): Promise<string> {
//     // wait and get sig from "v1/transactions/mpcsign/one" api
//     const retrieveRequest: OneMPCSignTransactionsRequest = {
//         txKey
//     };

//     for (let i = 0; i < 100; i++) {
//         const retrieveResponse = await mpcSignApi.oneMPCSignTransactions(retrieveRequest)
//         console.log(`mpc sign transaction status: ${retrieveResponse.transactionStatus}, sub status: ${retrieveResponse.transactionSubStatus}`);
//         if (retrieveResponse.transactionStatus === 'FAILED' || retrieveResponse.transactionStatus === 'REJECTED') {
//             throw new Error(`mpc sign transaction was FAILED or REJECTED`);
//         }

//         if (retrieveResponse.transactionStatus === 'COMPLETED' && retrieveResponse.transactionSubStatus === 'CONFIRMED') {
//             return retrieveResponse.dataList[0].sig;
//         }

//         await delay(5000);
//     }

//     throw new Error("can't get sig.");
// }

// function delay(num: number) {
//     console.log(`wait ${num}ms.`);
//     return new Promise((resolve) => {
//         setTimeout(() => {
//             resolve(1);
//         }, num)
//     })
// };

// let API_KEY = "4cfcfe47b11148bd85d6cc4d1f0a88a7";
// let ACCOUNT_KEY = "accountcf9f1f3289134869aab5c8d7ebeb461f";
// let MPC_KEYS_PATH = "/home/ecs-user/app/mpc/keys";
// let CUSTOMER_REF_ID = "0x9b2916b5f46b5600d72c3a32624794d05bbad5e50de62853baeaad97887c386d";

// let from_user = {
//     address: "0xe9b90e14385d189f53a70c7d3399e3ba30c06a7e0e5cf651f0d464fec8dfe87c",
//     public_key: "0xd777e8e6b32c6762a3e387f2ff62b112993d0aa4083636a491cf619869971df5"
// }

// const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK ?? Network.TESTNET];
// const config = new AptosConfig({ network: APTOS_NETWORK });
// const aptos = new Aptos(config);

// async function go() {
//     const mpcSignApi: MPCSignApi = new MPCSignApi({
//         baseUrl: "https://api.safeheron.vip",
//         apiKey: API_KEY,
//         rsaPrivateKey: readFileSync(`${MPC_KEYS_PATH}/api_private.pem`).toString(),
//         safeheronRsaPublicKey: readFileSync(`${MPC_KEYS_PATH}/platform_public.pem`).toString(),
//         requestTimeout: 20000
//     });

//     let payload = read_payload("payload_1.json");

//     let ledger_info = await aptos.getLedgerInfo();
    
//     let account_data = await aptos.getAccountInfo({accountAddress: from_user.address});

//     console.log(ledger_info);

//     const simpleTransaction = await aptos.transaction.build.simple({
//         sender: from_user.address,
//         data: payload,
//         options: {
//             expireTimestamp: Number.parseInt(ledger_info.ledger_timestamp) + 600,
//             maxGasAmount: 100000,
//             accountSequenceNumber: Number.parseInt(account_data.sequence_number)
//         }
//     });

//     // const deserializer = new Deserializer(simpleTransaction.bcsToBytes());
//     // const transaction = SimpleTransaction.deserialize(deserializer);

//     // Some changes to make it signable, this would need more logic for fee payer or additional signers
//     // TODO: Make BCS handle any object type?
//     const signingMessage = aptos.getSigningMessage({ transaction: simpleTransaction });

//     let signingMessageHex = Hex.fromHexInput(signingMessage).toString();

//     console.log(`signingMessageHex ${signingMessageHex}`);

//     // Pretend that it's an external signer that only knows bytes using a raw crypto library
//     const mpcSignTxKey = await requestMpcSign(mpcSignApi, CUSTOMER_REF_ID + "_" + Date.now(), signingMessageHex, ACCOUNT_KEY);

//     console.log(`transaction created, txKey: ${mpcSignTxKey}`);
//     // Get sig
//     const mpcSig = await retrieveSig(mpcSignApi, mpcSignTxKey);
//     console.log(`got mpc sign result, sig: ${mpcSig}`);

//     let signatureHex = "0x" + mpcSig;

//     // Construct the authenticator with the public key for the submission
//     const authenticator = new AccountAuthenticatorEd25519(new Ed25519PublicKey(from_user.public_key), new Ed25519Signature(signatureHex));

//     let signBytes = authenticator.bcsToBytes();

//     const signed_deserializer = new Deserializer(signBytes);
//     const signed_authenticator = AccountAuthenticator.deserialize(signed_deserializer);

//     console.log(`Retrieved authenticator: ${JSON.stringify(signed_authenticator)}`);

//     // Combine the transaction and send
//     console.log("\n=== Transfer transaction ===\n");
//     const committedTxn = await aptos.transaction.submit.simple({
//         transaction: simpleTransaction,
//         senderAuthenticator: signed_authenticator,
//     });

//     await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
//     console.log(`Committed transaction: ${committedTxn.hash}`);
// }

// function read_payload(payload_path: string) {
//     let payload_str = fs.readFileSync(payload_path).toString();
//     let payload = JSON.parse(payload_str);

//     return {
//         function: payload["function_id"],
//         functionArguments: [
//             Hex.fromHexInput(payload["args"][0]["value"]).toUint8Array(),
//             payload["args"][1]["value"],
//             (payload["args"][2]["value"] as string[]).map((hex) => Hex.fromHexInput(hex).toUint8Array()),
//         ]
//     }
// }

// go()