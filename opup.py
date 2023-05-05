from beaker import *
from pyteal import *
from typing import Literal

APP_NAME = "OpUpApp"
opup_app = Application("OpUpApp")


@opup_app.external
def ed25519verify_bare(
    msg: abi.String,
    pubkey: abi.StaticBytes[Literal[32]],
    sig: abi.StaticBytes[Literal[64]],
    *,
    output: abi.Bool,
):
    return Seq(
        output.set(Ed25519Verify_Bare(msg.get(), sig.get(), pubkey.get())),
    )


@opup_app.external
def noop():
    return Approve()


if __name__ == "__main__":
    opup_app.build().export(f"./artifacts/{APP_NAME}")
