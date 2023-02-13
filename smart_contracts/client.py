from beaker import sandbox
from beaker.client.application_client import ApplicationClient

def deploy(app):
    # Set up accounts we'll use
    creator = sandbox.kmd.get_accounts().pop()
    print(f"Creator account address: {creator.address}")

    # Here we use `sandbox` but beaker.client.api_providers can also be used
    # with something like ``AlgoNode(Network.TestNet).algod()``
    algod_client = sandbox.clients.get_algod_client()

    # Create an Application client containing both an algod client and app
    app_client = ApplicationClient(
        client=algod_client, app=app, signer=creator.signer
    )

    # Create the application on chain, set the app id for the app client
    app_id, app_addr, txid = app_client.create()
    print(f"Created App with id: {app_id} and address addr: {app_addr} in tx: {txid}")

    return (
        app_id,
        app_addr,
        txid
    )

    