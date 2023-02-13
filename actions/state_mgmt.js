const algosdk = require("algosdk");
const {
  readGlobalState,
  readLocalState,
  optIntoApp,
  getMethodByName,
  makeATCCall,
} = require("./helper");
require("dotenv").config();

const algodClient = new algosdk.Algodv2(
  process.env.ALGOD_TOKEN,
  process.env.ALGOD_SERVER,
  process.env.ALGOD_PORT
);

(async () => {
  const creator = algosdk.mnemonicToSecretKey(process.env.MNEMONIC_CREATOR);

  // get app ID
  const appID = Number(process.env.APP_ID);
  console.log("App ID is: ", appID);

  const suggestedParams = await algodClient.getTransactionParams().do();

  const commonParams = {
    appID,
    sender: creator.addr,
    suggestedParams,
    signer: algosdk.makeBasicAccountTransactionSigner(creator),
  };

  // Opt into app
  const ls = await readLocalState(algodClient, process.env.ADDR_CREATOR, appID);
  if (ls === undefined) {
    await optIntoApp(appID, creator);
  }

  // update global and local state
  const txn1 = [
    {
      method: getMethodByName("update_global"),
      methodArgs: ["hi", 555],
      ...commonParams,
    },
  ];

  await makeATCCall(txn1);

  // update global and local state
  const txn2 = [
    {
      method: getMethodByName("update_local"),
      methodArgs: ["bye", 123],
      ...commonParams,
    },
  ];

  await makeATCCall(txn2);

  // print global / local state info
  console.log(await readGlobalState(algodClient, appID));
  console.log(
    await readLocalState(algodClient, process.env.ADDR_CREATOR, appID)
  );
})();
