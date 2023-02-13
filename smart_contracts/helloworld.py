from beaker.application import Application
from beaker.decorators import external, create, opt_in, close_out, delete, Authorize
from beaker.state import ApplicationStateValue, AccountStateValue
from pyteal import Bytes, Approve, Global, Int, Seq, InnerTxnBuilder, TxnField, TxnType, InnerTxn, AssetHolding, Txn
from pyteal.ast import abi
from pyteal.types import TealType
from typing import Final


class HelloWorld(Application):
    '''
    Global States
    '''
    global_text: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.bytes,
        key=Bytes("GlobalText"),
        default=Bytes(""),
        descr="global state text",
    )
    global_integer: Final[ApplicationStateValue] = ApplicationStateValue(
        stack_type=TealType.uint64,
        key=Bytes("GlobalInteger"),
        default=Int(0),
        descr="global state integer",
    )

    '''
    Local States
    '''
    local_text: Final[AccountStateValue] = AccountStateValue(
        stack_type=TealType.bytes,
        key=Bytes("LocalText"),
        default=Bytes("my local state!"),
        descr="local state text",
    )
    local_integer: Final[AccountStateValue] = AccountStateValue(
        stack_type=TealType.uint64,
        key=Bytes("LocalInteger"),
        default=Int(1),
        descr="local state integer",
    )

    @create
    def create(self):
        return self.initialize_application_state()
    
    @opt_in
    def opt_in(self):
        return self.initialize_account_state()

    @close_out
    def close_out(self):
        return Approve()

    @delete(authorize=Authorize.only(Global.creator_address()))
    def delete(self):
        return Approve()

    @external
    def update_global(self, gt: abi.String, gi: abi.Uint64, *, output: abi.String):
        return Seq(
            self.global_text.set(gt.get()),
            self.global_integer.set(gi.get()),
            output.set("Updated global state!")
        )

    @external
    def update_local(self, lt: abi.String, li: abi.Uint64, *, output: abi.String):
        return Seq(
            self.local_text.set(lt.get()),
            self.local_integer.set(li.get()),
            output.set("Updated local state!")
        )

    @external
    def create_nft(self, assetName: abi.String, assetURL: abi.String, metadataHash: abi.String, *, output: abi.Uint64):
        return Seq(
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.AssetConfig,
                TxnField.config_asset_default_frozen: Int(0),
                TxnField.config_asset_url: assetURL.get(),
                TxnField.config_asset_metadata_hash: metadataHash.get(),
                TxnField.config_asset_name: assetName.get(),
                TxnField.config_asset_unit_name: Bytes('AFNFT'),
                TxnField.config_asset_total: Int(1),
                TxnField.config_asset_decimals: Int(0),
            }),
            InnerTxnBuilder.Submit(),
            output.set(InnerTxn.created_asset_id())
        )

    @external
    def transfer_nft(self, *, output: abi.String):
        return Seq(
            # Asset Opt In check
            # AssetHolding.balance(Txn.accounts[1], Txn.assets[0]).hasValue() == Int(0),
            
            # Transfer Asset
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.xfer_asset: Txn.assets[0], # first foreign asset
                TxnField.asset_receiver: Txn.accounts[1],
                TxnField.asset_amount: Int(1),
            }),
            InnerTxnBuilder.Submit(),
            output.set("Transferred!")
        )

    