const algosdk = require("algosdk");
const { getMethodByName, makeATCCall } = require("../helpers/algorand");
require("dotenv").config();

const algodClient = new algosdk.Algodv2(
  process.env.ALGOD_TOKEN,
  process.env.ALGOD_SERVER,
  process.env.ALGOD_PORT
);

(async () => {
  const creator = algosdk.mnemonicToSecretKey(process.env.CREATOR_MNEMONIC);
  const acc1 = algosdk.mnemonicToSecretKey(process.env.ACC1_MNEMONIC);

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

  // payment 1 txn
  const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: creator.addr,
    to: acc1.addr,
    amount: 1e6,
    suggestedParams,
  });

  // payment 2 txn
  const txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: creator.addr,
    to: acc1.addr,
    amount: 2e6,
    suggestedParams,
  });

  const txnsigner = algosdk.makeBasicAccountTransactionSigner(creator);

  const txns = [
    {
      method: getMethodByName("atomic_check"),
      methodArgs: [
        "text1",
        { txn: txn1, signer: txnsigner },
        { txn: txn2, signer: txnsigner },
        100,
      ],
      ...commonParams,
    },
  ];

  await makeATCCall(txns);
})();
