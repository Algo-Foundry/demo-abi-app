const algosdk = require("algosdk");
require("dotenv").config();
const fs = require("fs");

const algodClient = new algosdk.Algodv2(
  process.env.ALGOD_TOKEN,
  process.env.ALGOD_SERVER,
  process.env.ALGOD_PORT
);

const sendAlgos = async (from, toAddress, amount) => {
  console.log(
    `Sending ${amount} microAlgos from ${from.addr} to ${toAddress}...`
  );

  const suggestedParams = await algodClient.getTransactionParams().do();

  const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: from.addr,
    to: toAddress,
    suggestedParams,
    amount,
  });

  const signedTxn = paymentTxn.signTxn(from.sk);

  return submitToNetwork(signedTxn);
};

const optIntoAsset = async (assetID, from) => {
  console.log(`${from.addr} is opting into asset ${assetID}...`);

  const suggestedParams = await algodClient.getTransactionParams().do();

  const assetOptInTxn =
    algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: from.addr,
      to: from.addr,
      suggestedParams,
      assetIndex: assetID,
      amount: 0,
    });

  const signedTxn = assetOptInTxn.signTxn(from.sk);

  return submitToNetwork(signedTxn);
};

const optIntoApp = async (app, from) => {
  console.log(`${from} is opting into app ${app}...`);

  const suggestedParams = await algodClient.getTransactionParams().do();

  const optInTxn = algosdk.makeApplicationOptInTxnFromObject({
    from: from.addr,
    suggestedParams,
    appIndex: app,
  });

  const signedTxn = optInTxn.signTxn(from.sk);

  return submitToNetwork(signedTxn);
};

const submitToNetwork = async (signedTxn) => {
  // send txn
  let tx = await algodClient.sendRawTransaction(signedTxn).do();
  console.log("Transaction : " + tx.txId);

  // Wait for transaction to be confirmed
  confirmedTxn = await algosdk.waitForConfirmation(algodClient, tx.txId, 4);

  //Get the completed Transaction
  console.log(
    "Transaction " +
      tx.txId +
      " confirmed in round " +
      confirmedTxn["confirmed-round"]
  );

  return confirmedTxn;
};

async function readGlobalState(client, index) {
  const app = await client.getApplicationByID(index).do();
  const globalState = app.params["global-state"];

  const formattedGlobalState = globalState.map((item) => {
    // decode from base64 encoded bytes
    const formattedKey = decodeURIComponent(Buffer.from(item.key, "base64"));

    let formattedValue;
    if (item.value.type === 1) {
      //value is base64 encoded bytes, convert it back to string
      formattedValue = decodeURIComponent(
        Buffer.from(item.value.bytes, "base64")
      );
    } else {
      formattedValue = item.value.uint;
    }

    return {
      key: formattedKey,
      value: formattedValue,
    };
  });

  return formattedGlobalState;
}

async function readLocalState(client, address, index) {
  const acc = await client.accountInformation(address).do();
  const localStates = acc["apps-local-state"];

  const appLocalState = localStates.find((ls) => {
    return ls.id === index;
  });

  let formattedLocalState;
  if (appLocalState !== undefined) {
    formattedLocalState = appLocalState["key-value"].map((item) => {
      // decode from base64 encoded bytes
      const formattedKey = decodeURIComponent(Buffer.from(item.key, "base64"));

      let formattedValue;
      if (item.value.type === 1) {
        //value is base64 encoded bytes, convert it back to string
        formattedValue = decodeURIComponent(
          Buffer.from(item.value.bytes, "base64")
        );
      } else {
        formattedValue = item.value.uint;
      }

      return {
        key: formattedKey,
        value: formattedValue,
      };
    });
  }

  return formattedLocalState;
}

const getMethodByName = (methodName) => {
  // Read in the local contract.json file
  const buff = fs.readFileSync(
    "./smart_contracts/artifacts/helloworld.HelloWorld/contract.json"
  );

  // Parse the json file into an object, pass it to create an ABIContract object
  const contract = new algosdk.ABIContract(JSON.parse(buff.toString()));

  const method = contract.methods.find((mt) => mt.name === methodName);

  if (method === undefined) throw Error("Method undefined: " + method);

  return method;
};

const makeATCCall = async (txns) => {
  // create atomic transaction composer
  const atc = new algosdk.AtomicTransactionComposer();

  // add calls to atc
  txns.forEach((txn) => {
    atc.addMethodCall(txn);
  });

  // execute
  const result = await atc.execute(algodClient, 10);
  for (const idx in result.methodResults) {
    console.log(result.methodResults[idx]);
  }

  return result;
};

module.exports = {
  readGlobalState,
  readLocalState,
  sendAlgos,
  optIntoApp,
  optIntoAsset,
  getMethodByName,
  makeATCCall,
};
