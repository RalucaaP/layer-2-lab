#!/bin/bash

echo "Installing project dependencies..."

cd "$(dirname "$0")/zksync-burst-demo" || {
  echo "❌ Error: zksync-burst-demo folder not found!"
  exit 1
}

echo "Running npm install..."
npm install

echo "Cleaning Hardhat cache..."
npx hardhat clean

echo "✅ Dependencies installed successfully!"
