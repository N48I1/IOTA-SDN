import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ethers } from 'ethers';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';

interface RegisterFormData {
    username: string;
    email: string;
    password: string;
}

export function RegisterForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [ethAddress, setEthAddress] = useState<string | null>(null);
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>();

    const connectWallet = async () => {
        if (!window.ethereum) {
            toast.error('MetaMask n\'est pas installé');
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            setEthAddress(address);
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
        }
    };

    const onSubmit = async (data: RegisterFormData) => {
        if (!ethAddress) {
            toast.error('Veuillez connecter votre portefeuille MetaMask');
            return;
        }

        try {
            setIsLoading(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // Message à signer
            const message = "Welcome to IOTASDN";
            const signature = await signer.signMessage(message);

            const response = await fetch('http://192.168.1.8:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    eth_address: ethAddress,
                    signature
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message);
            }

            toast.success(result.message);
            navigate('/login');
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Erreur lors de l\'inscription');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-[350px]">
            <CardHeader>
                <CardTitle>Inscription</CardTitle>
                <CardDescription>Créez votre compte pour accéder à l'application</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Nom d'utilisateur</Label>
                        <Input
                            id="username"
                            {...register('username', { required: 'Ce champ est requis' })}
                        />
                        {errors.username && (
                            <p className="text-sm text-red-500">{errors.username.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            {...register('email', {
                                required: 'Ce champ est requis',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Email invalide'
                                }
                            })}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Mot de passe</Label>
                        <Input
                            id="password"
                            type="password"
                            {...register('password', {
                                required: 'Ce champ est requis',
                                minLength: {
                                    value: 6,
                                    message: 'Le mot de passe doit contenir au moins 6 caractères'
                                }
                            })}
                        />
                        {errors.password && (
                            <p className="text-sm text-red-500">{errors.password.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Adresse Ethereum</Label>
                        {ethAddress ? (
                            <div className="text-sm font-mono break-all bg-gray-100 p-2 rounded">
                                {ethAddress}
                            </div>
                        ) : (
                            <Button
                                type="button"
                                onClick={connectWallet}
                                variant="outline"
                                className="w-full"
                            >
                                Connecter MetaMask
                            </Button>
                        )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading || !ethAddress}>
                        {isLoading ? 'Inscription...' : 'S\'inscrire'}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <p className="text-sm text-gray-500">
                    Déjà un compte ?{' '}
                    <a href="/login" className="text-blue-500 hover:underline">
                        Se connecter
                    </a>
                </p>
            </CardFooter>
        </Card>
    );
} 