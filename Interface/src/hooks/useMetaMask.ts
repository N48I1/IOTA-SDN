import { useState, useEffect } from 'react';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const useMetaMask = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    if (!window.ethereum) {
      setError('MetaMask n\'est pas installé');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError('Erreur lors de la connexion à MetaMask');
      console.error(err);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setIsConnected(false);
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
          }
        } catch (err) {
          console.error('Erreur lors de la vérification de la connexion:', err);
        }
      }
    };

    checkConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        } else {
          disconnect();
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  return {
    account,
    isConnected,
    error,
    connect,
    disconnect
  };
}; 