import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { MetaMaskLogin } from './MetaMaskLogin';

interface LoginFormData {
    email: string;
    password: string;
}

export function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

    const onSubmit = async (data: LoginFormData) => {
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message);
            }

            localStorage.setItem('token', result.token);
            toast.success('Connexion réussie !');
            window.location.href = '/dashboard';
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erreur de connexion');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-full max-w-md p-8 bg-white border border-gray-200 rounded-lg">
                <div className="flex flex-col items-center mb-6">
                    <svg width="40" height="40" fill="none" viewBox="0 0 24 24" className="mb-2 text-blue-600">
                        <rect x="9" y="2" width="6" height="6" rx="1" fill="currentColor"/>
                        <rect x="2" y="16" width="6" height="6" rx="1" fill="currentColor"/>
                        <rect x="16" y="16" width="6" height="6" rx="1" fill="currentColor"/>
                        <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor"/>
                    </svg>
                    <h1 className="text-2xl font-bold">Bienvenue sur IOTASDN</h1>
                    <p className="text-gray-500">Connectez-vous pour accéder au dashboard</p>
                </div>
                <Tabs defaultValue="email" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="email">Email</TabsTrigger>
                        <TabsTrigger value="metamask">MetaMask</TabsTrigger>
                    </TabsList>
                    <TabsContent value="email">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="votre@email.com"
                                    {...register('email', { required: 'Email requis' })}
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
                                    {...register('password', { required: 'Mot de passe requis' })}
                                />
                                {errors.password && (
                                    <p className="text-sm text-red-500">{errors.password.message}</p>
                                )}
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Connexion...' : 'Se connecter'}
                            </Button>
                        </form>
                    </TabsContent>
                    <TabsContent value="metamask">
                        <MetaMaskLogin />
                    </TabsContent>
                </Tabs>
                <CardFooter className="flex flex-col space-y-2">
                    <a
                        href="/forgot-password"
                        className="text-sm text-blue-500 hover:text-blue-700"
                    >
                        Mot de passe oublié ?
                    </a>
                    <p className="text-sm text-gray-500">
                        Pas encore de compte ?{' '}
                        <a href="/register" className="text-blue-500 hover:text-blue-700">
                            S'inscrire
                        </a>
                    </p>
                </CardFooter>
            </div>
        </div>
    );
} 