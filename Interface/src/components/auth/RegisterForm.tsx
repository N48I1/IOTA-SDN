import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ethers } from 'ethers';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { Network } from "lucide-react";

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

            const response = await fetch('http://192.168.11.143:8080/api/auth/register', {
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-background/80 p-4">
            <Card className="w-full max-w-md shadow-2xl border-border/50 bg-card/95 backdrop-blur-sm">
                <CardHeader className="space-y-4 text-center">
                    <div className="flex justify-center">
                        <Network className="h-12 w-12 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Inscription</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Créez votre compte pour accéder à l'application
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-sm font-medium">Nom d'utilisateur</Label>
                            <Input
                                id="username"
                                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                {...register('username', { required: 'Ce champ est requis' })}
                            />
                            {errors.username && (
                                <p className="text-sm text-destructive">{errors.username.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                {...register('email', {
                                    required: 'Ce champ est requis',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Email invalide'
                                    }
                                })}
                            />
                            {errors.email && (
                                <p className="text-sm text-destructive">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">Mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                {...register('password', {
                                    required: 'Ce champ est requis',
                                    minLength: {
                                        value: 6,
                                        message: 'Le mot de passe doit contenir au moins 6 caractères'
                                    }
                                })}
                            />
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Adresse Ethereum</Label>
                            {ethAddress ? (
                                <div className="text-sm font-mono break-all bg-muted/50 p-3 rounded-lg border border-border/50">
                                    {ethAddress}
                                </div>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={connectWallet}
                                    variant="outline"
                                    className="w-full transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
                                >
                                    Connecter MetaMask
                                </Button>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                            disabled={isLoading || !ethAddress}
                        >
                            {isLoading ? 'Inscription...' : 'S\'inscrire'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t border-border/50 pt-6">
                    <p className="text-sm text-muted-foreground">
                        Déjà un compte ?{' '}
                        <a href="/login" className="text-primary hover:text-primary/80 transition-colors duration-200">
                            Se connecter
                        </a>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
} 