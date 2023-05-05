const algosdk = require("algosdk");
const {
  readGlobalState,
  readLocalState,
  optIntoApp,
  getMethodByName,
  makeATCCall,
} = require("../helpers/algorand");
require("dotenv").config();

const algodClient = new algosdk.Algodv2(
  process.env.ALGOD_TOKEN,
  process.env.ALGOD_SERVER,
  process.env.ALGOD_PORT
);

(async () => {
  const creator = algosdk.mnemonicToSecretKey(process.env.CREATOR_MNEMONIC);
  const appName = "DemoApp";

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
  await optIntoApp(creator, appID);

  // update global and local state
  const txn1 = [
    {
      method: getMethodByName("update_global", appName),
      methodArgs: ["hi", 555],
      ...commonParams,
    },
  ];

  await makeATCCall(txn1);

  // update global and local state
  const txn2 = [
    {
      method: getMethodByName("update_local", appName),
      methodArgs: ["bye", 123],
      ...commonParams,
    },
  ];

  await makeATCCall(txn2);

  // print global / local state info
  console.log(await readGlobalState(appID));
  console.log(await readLocalState(creator.addr, appID));
})();
