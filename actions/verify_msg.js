const algosdk = require("algosdk");
const { getMethodByName, makeATCCall } = require("./helper");
const nacl = require("tweetnacl");
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

  // generate keys
  // const ephemeralKeyPair = nacl.sign.keyPair();
  // const publicKey = Buffer.from(ephemeralKeyPair.publicKey).toString("base64");
  // const privateKey = Buffer.from(ephemeralKeyPair.secretKey).toString("base64");
  const privateKey =
    "/zlDM+r15cpfXfYzbd8SSjpGiMhDN4p3D4GjtNO2kslyS9SGSoc8Nvzq13vOjTYSAkRKXK+Df1iIDPHHwv7uCA==";
  const publicKey = "ckvUhkqHPDb86td7zo02EgJESlyvg39YiAzxx8L+7gg=";

  // sign msg
  const msg = "ifps://QmfYUkmTiNHnCygAtoSkZduWG8uqEsDoYPHGSuQWfRjey9";
  const sig = nacl.sign.detached(
    Buffer.from(msg),
    Buffer.from(privateKey, "base64")
  );
  const signedMsg = new Uint8Array(sig.buffer);

  console.log("msg:", new Uint8Array(Buffer.from(msg)));
  console.log("sig:", signedMsg);
  console.log("publickey:", new Uint8Array(Buffer.from(publicKey, "base64")));

  const txns = [
    {
      method: getMethodByName("noop"),
      note: new Uint8Array(Buffer.from("nonce1")),
      ...commonParams,
    },
    {
      method: getMethodByName("noop"),
      note: new Uint8Array(Buffer.from("nonce2")),
      ...commonParams,
    },
    {
      method: getMethodByName("ed25519verify_bare"),
      methodArgs: [msg, Buffer.from(publicKey, "base64"), signedMsg],
      ...commonParams,
    },
  ];

  await makeATCCall(txns);
})();
