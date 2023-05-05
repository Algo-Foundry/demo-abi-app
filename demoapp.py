from beaker import *
from pyteal import *


class DemoAppState:
    """
    Global States
    """

    global_text = GlobalStateValue(
        stack_type=TealType.bytes,
        key=Bytes("GlobalText"),
        default=Bytes(""),
        descr="global state text",
    )

    global_integer = GlobalStateValue(
        stack_type=TealType.uint64,
        key=Bytes("GlobalInteger"),
        default=Int(0),
        descr="global state integer",
    )

    """
    Local States
    """
    local_text = LocalStateValue(
        stack_type=TealType.bytes,
        key=Bytes("LocalText"),
        default=Bytes("my local state!"),
        descr="local state text",
    )

    local_integer = LocalStateValue(
        stack_type=TealType.uint64,
        key=Bytes("LocalInteger"),
        default=Int(1),
        descr="local state integer",
    )


APP_NAME = "DemoApp"
app = Application(APP_NAME, state=DemoAppState())


@app.create(bare=True)
def create():
    return app.initialize_global_state()


@app.opt_in(bare=True)
def opt_in():
    return app.initialize_local_state()


@app.close_out(bare=True)
def close_out():
    return Approve()


@app.delete(bare=True, authorize=Authorize.only(Global.creator_address()))
def delete():
    return Approve()


@app.external
def update_global(gt: abi.String, gi: abi.Uint64, *, output: abi.String):
    return Seq(
        app.state.global_text.set(gt.get()),
        app.state.global_integer.set(gi.get()),
        output.set("Updated global state!"),
    )


@app.external
def update_local(lt: abi.String, li: abi.Uint64, *, output: abi.String):
    return Seq(
        app.state.local_text.set(lt.get()),
        app.state.local_integer.set(li.get()),
        output.set("Updated local state!"),
    )


@app.external
def create_nft(
    assetName: abi.String,
    assetURL: abi.String,
    metadataHash: abi.String,
    *,
    output: abi.Uint64,
):
    return Seq(
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.AssetConfig,
                TxnField.config_asset_default_frozen: Int(0),
                TxnField.config_asset_url: assetURL.get(),
                TxnField.config_asset_metadata_hash: metadataHash.get(),
                TxnField.config_asset_name: assetName.get(),
                TxnField.config_asset_unit_name: Bytes("AFNFT"),
                TxnField.config_asset_total: Int(1),
                TxnField.config_asset_decimals: Int(0),
            }
        ),
        InnerTxnBuilder.Submit(),
        output.set(InnerTxn.created_asset_id()),
    )


@app.external
def transfer_nft(*, output: abi.String):
    return Seq(
        # Transfer Asset
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.xfer_asset: Txn.assets[0],  # first foreign asset
                TxnField.asset_receiver: Txn.accounts[0],
                TxnField.asset_amount: Int(1),
            }
        ),
        InnerTxnBuilder.Submit(),
        output.set("Transferred!"),
    )


@app.external
def atomic_check(
    text1: abi.String,
    pay1: abi.Transaction,
    pay2: abi.Transaction,
    num1: abi.Uint64,
    *,
    output: abi.String,
):
    return Seq(
        Assert(text1.get() == Bytes("text1")),
        Assert(num1.get() == Int(100)),
        Assert(pay1.get().type_enum() == TxnType.Payment),
        Assert(pay2.get().type_enum() == TxnType.Payment),
        output.set("Pass!"),
    )


if __name__ == "__main__":
    app.build().export(f"./artifacts/{APP_NAME}")
