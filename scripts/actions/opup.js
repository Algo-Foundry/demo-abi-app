const algosdk = require("algosdk");
const { getMethodByName, makeATCCall } = require("../helpers/algorand");
require("dotenv").config();
const nacl = require("tweetnacl");

const algodClient = new algosdk.Algodv2(
  process.env.ALGOD_TOKEN,
  process.env.ALGOD_SERVER,
  process.env.ALGOD_PORT
);

(async () => {
  const creator = algosdk.mnemonicToSecretKey(process.env.CREATOR_MNEMONIC);
  const appName = "OpUpApp";

  // get app ID
  const appID = Number(process.env.APP_ID);
  console.log("App ID is: ", appID);

  let suggestedParams = await algodClient.getTransactionParams().do();
  suggestedParams.fee = algosdk.ALGORAND_MIN_TX_FEE;

  const commonParams = {
    appID,
    sender: creator.addr,
    suggestedParams,
    signer: algosdk.makeBasicAccountTransactionSigner(creator),
  };
  console.log(commonParams);

  // generate keys
  const ephemeralKeyPair = nacl.sign.keyPair();
  const publicKey = Buffer.from(ephemeralKeyPair.publicKey).toString("base64");
  const privateKey = Buffer.from(ephemeralKeyPair.secretKey).toString("base64");

  const msg = "Secret Message Here!";
  const sig = nacl.sign.detached(
    Buffer.from(msg),
    Buffer.from(privateKey, "base64")
  );
  const signedMsg = new Uint8Array(sig.buffer);

  // initial opcode budget is 700, each transaction added increases the budget by another 700
  // ed25519verify_bare has a opcode cost of 1900
  const txn = [
    {
      method: getMethodByName("noop", appName),
      note: new Uint8Array(Buffer.from("nonce1")),
      ...commonParams,
    },
    {
      method: getMethodByName("noop", appName),
      note: new Uint8Array(Buffer.from("nonce2")),
      ...commonParams,
    },
    {
      method: getMethodByName("ed25519verify_bare", appName),
      methodArgs: [msg, Buffer.from(publicKey, "base64"), signedMsg],
      ...commonParams,
    },
  ];

  await makeATCCall(txn);
})();
