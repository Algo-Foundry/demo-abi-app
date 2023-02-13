const algosdk = require("algosdk");
const {
  sendAlgos,
  optIntoAsset,
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
  const appAddress = algosdk.getApplicationAddress(appID);
  console.log("App ID is: ", appID);

  const suggestedParams = await algodClient.getTransactionParams().do();

  const commonParams = {
    appID,
    sender: creator.addr,
    suggestedParams,
    signer: algosdk.makeBasicAccountTransactionSigner(creator),
  };

  // fund app with 1 Algos
  await sendAlgos(creator, appAddress, 1e6);

  // create NFT
  const txn2 = [
    {
      method: getMethodByName("create_nft"),
      methodArgs: [
        "Beaker AFNFT",
        "ipfs://path/to/jsonmetadata",
        "16efaa3924a6fd9d3a4824799a4ac65d",
      ],
      ...commonParams,
    },
  ];

  // since there's only 1 txn...
  const txnOutputs = await makeATCCall(txn2);
  const assetID = Number(txnOutputs.methodResults[0].returnValue);
  console.log(`Asset ${assetID} created by contract`);

  // opt into asset
  await optIntoAsset(assetID, creator);

  // transfer NFT
  const txn1 = [
    {
      method: getMethodByName("transfer_nft"),
      ...commonParams,
      appAccounts: [creator.addr],
      appForeignAssets: [assetID],
    },
  ];

  await makeATCCall(txn1);

  // print NFT info
  console.log(
    await algodClient.accountAssetInformation(creator.addr, assetID).do()
  );
})();
