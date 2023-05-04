const algosdk = require("algosdk");
const {
  optIntoAsset,
  getMethodByName,
  makeATCCall,
  getAlgodClient,
} = require("../helpers/algorand");
require("dotenv").config();

const algodClient = getAlgodClient();

(async () => {
  const creator = algosdk.mnemonicToSecretKey(process.env.CREATOR_MNEMONIC);

  // get application
  const appID = Number(process.env.APP_ID);
  console.log(algosdk.getApplicationAddress(appID));
  console.log("App ID is: ", appID);

  const suggestedParams = await algodClient.getTransactionParams().do();

  const commonParams = {
    appID,
    sender: creator.addr,
    suggestedParams,
    signer: algosdk.makeBasicAccountTransactionSigner(creator),
  };

  // create NFT
  const txn1 = [
    {
      method: getMethodByName("create_nft"),
      methodArgs: [
        "Beaker AFNFT", // asset name
        "ipfs://path/to/jsonmetadata", // asset url
        "16efaa3924a6fd9d3a4824799a4ac65d", // metadata hash
      ],
      ...commonParams,
    },
  ];

  // fetch the return value from the app call txn
  const txnOutputs = await makeATCCall(txn1);
  const assetID = Number(txnOutputs.methodResults[0].returnValue);
  console.log(`Asset ${assetID} created by contract`);

  // opt into asset
  await optIntoAsset(creator, assetID);

  // transfer NFT
  const txn2 = [
    {
      method: getMethodByName("transfer_nft"),
      ...commonParams,
      appForeignAssets: [assetID],
    },
  ];

  await makeATCCall(txn2);

  // print NFT info
  console.log(
    await algodClient.accountAssetInformation(creator.addr, assetID).do()
  );
})();
