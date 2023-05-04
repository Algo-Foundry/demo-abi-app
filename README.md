# ABI Compliant Application Demo

The following ABI compliant application demo is built using Beaker, compiled with AlgoKit. It includes the following,

1. Updating local / global state values
2. Create and send NFT

## Setup instructions

### Install python packages via AlgoKit
run `algokit bootstrap poetry` within this folder

### Install JS packages
run `yarn install`

### Update environement variables
1. Copy `.env.example` to `.env`
2. Update Algorand Sandbox credentials in `.env` file
3. Update accounts in `.env` file

### Initialize virtual environment
run `poetry shell`

### Compile contracts
1. run `python demoapp.py`

### Deploy App
1. run `node scripts/deploy.js`
2. Save deployed application ID to `.env` file

### Create and send NFTs
run `node scripts/actions/nft.js`

### State Management
run `node scripts/actions/state_mgmt.js`