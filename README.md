## Simple multi attack script for Genesy on Hype EVM

1. Find and attack a user using Genesy front-end (this assumes you attack component 9, will fail if they do not have component 9).
2. Pull their address, simplest way to do this is either through the front-end if it's there, or go to the transaction on purrsec, in the log data the third line has it, from the second char to the char before x (the script will throw an error if it's invalid).
3. After pulling this repo down, run npm install if it's your first time, set your wallet `PRIVATE_KEY` and hyperliquid `RPC_URL` in `.env`, then run `node attack.js 0x<target address>`. If you don't have node setup it's just an install and I'm not going to cover that.
