// import {
//     AccountApi,
//     ListAccountRequest,
// } from "@safeheron/api-sdk";
// import { readFileSync } from 'fs';

// let API_KEY = "4cfcfe47b11148bd85d6cc4d1f0a88a7";
// let MPC_KEYS_PATH = "/home/ecs-user/app/mpc/keys";

// async function go() {
//     const api: AccountApi = new AccountApi({
//         baseUrl: "https://api.safeheron.vip",
//         apiKey: API_KEY,
//         rsaPrivateKey: readFileSync(`${MPC_KEYS_PATH}/api_private.pem`).toString(),
//         safeheronRsaPublicKey: readFileSync(`${MPC_KEYS_PATH}/platform_public.pem`).toString(),
//         requestTimeout: 20000
//     });

//     const request: ListAccountRequest = {
//         pageNumber: 1,
//         pageSize: 10,
//     };

//     let results = await api.listAccounts(request);

//     console.log(results.content)
//     console.log(results.content[1].pubKeys);
// }

// go()