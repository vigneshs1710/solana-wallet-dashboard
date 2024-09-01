// App.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  WalletAdapterNetwork,
  WalletError,
} from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

import '@solana/wallet-adapter-react-ui/styles.css'; // Import wallet modal styles

const App = () => {
  const network = WalletAdapterNetwork.Devnet; // Use Devnet for testing
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="App">
            <header className="App-header">
              <h1>Solana Wallet Dashboard</h1>
              <WalletMultiButton />
              <Dashboard />
            </header>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

// Dashboard component to display wallet overview and transaction history
const Dashboard = () => {
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);

  // Fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (connected && publicKey) {
        try {
          const connection = new Connection(clusterApiUrl('devnet'));
          const balance = await connection.getBalance(publicKey);
          setBalance(balance / 1e9); // Convert lamports to SOL
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      }
    };

    fetchBalance();
  }, [connected, publicKey]);

  // Fetch transaction history
  useEffect(() => {
    const fetchTransactions = async () => {
      if (connected && publicKey) {
        try {
          const connection = new Connection(clusterApiUrl('devnet'));
          const signatures = await connection.getSignaturesForAddress(new PublicKey(publicKey));
          const confirmedTransactions = await Promise.all(
            signatures.map(async (signature) =>
              await connection.getParsedTransaction(signature.signature)
            )
          );
          setTransactions(confirmedTransactions);
        } catch (error) {
          console.error('Error fetching transactions:', error);
        }
      }
    };

    fetchTransactions();
  }, [connected, publicKey]);

  return (
    <div className="dashboard">
      <h2>Wallet Overview</h2>
      {connected ? (
        <div>
          <p>Wallet Address: {publicKey.toBase58()}</p>
          <p>Balance: {balance.toFixed(2)} SOL</p>

          <h3>Transaction History</h3>
          <ul>
            {transactions.map((tx, index) => (
              <li key={index}>
                <p>Signature: {tx?.transaction.signatures[0]}</p>
                <p>Slot: {tx?.slot}</p>
                <p>
                  Block Time:{' '}
                  {tx?.blockTime ? new Date(tx.blockTime * 1000).toLocaleString() : 'N/A'}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>Please connect your wallet to view details.</p>
      )}
    </div>
  );
};

export default App;
