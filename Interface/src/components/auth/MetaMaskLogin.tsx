import { useState } from 'react';
import { ethers } from 'ethers';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function MetaMaskLogin() {
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [address, setAddress] = useState<string | null>(null);
    const navigate = useNavigate();
    const { login } = useAuth();

    const connectWallet = async () => {
        if (!window.ethereum) {
            toast.error('MetaMask n\'est pas installé');
            return;
        }

        try {
            setIsLoading(true);
            const provider = new ethers.BrowserProvider(window.ethereum);

            // Demander la connexion au portefeuille
            const accounts = await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const userAddress = await signer.getAddress();

            setAddress(userAddress);
            setIsConnected(true);

            // Message à signer
            const message = "Welcome to IOTASDN";
            const signature = await signer.signMessage(message);

            // Envoyer la signature au serveur
            const response = await fetch('http://localhost:5000/api/auth/metamask-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ address: userAddress, signature }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message);
            }

            // Stocker le token JWT
            localStorage.setItem('token', result.token);
            login();
            toast.success('Connexion avec MetaMask réussie !');

            // Rediriger vers le tableau de bord
            navigate('/dashboard');
        } catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('user rejected')) {
                    toast.error('Connexion refusée par l\'utilisateur');
                } else {
                    toast.error(error.message);
                }
            } else {
                toast.error('Erreur lors de la connexion avec MetaMask');
            }
            setIsConnected(false);
            setAddress(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col items-center mb-4">
                <h3 className="text-xl font-semibold">Connexion avec MetaMask</h3>
                <p className="text-sm text-gray-500">Connectez-vous avec votre portefeuille Ethereum</p>
            </div>
            {isConnected && address ? (
                <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">Connecté avec :</p>
                    <p className="font-mono text-sm break-all">{address}</p>
                </div>
            ) : (
                <Button
                    onClick={connectWallet}
                    className="w-full"
                    disabled={isLoading}
                >
                    {isLoading ? 'Connexion...' : 'Se connecter avec MetaMask'}
                </Button>
            )}
        </div>
    );
} 