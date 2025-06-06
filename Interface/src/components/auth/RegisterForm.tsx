import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Network } from 'lucide-react';

interface RegisterFormData {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export function RegisterForm() {
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>();
    const password = watch('password');

    const onSubmit = async (data: RegisterFormData) => {
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: data.username,
                    email: data.email,
                    password: data.password,
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message);
            }

            localStorage.setItem('token', result.token);
            toast.success('Inscription réussie !');
            window.location.href = '/login';
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erreur d\'inscription');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-[400px] shadow-lg rounded-xl">
                <CardHeader className="flex flex-col items-center">
                    <Network className="h-12 w-12 text-blue-600 mb-2" />
                    <CardTitle>Inscription</CardTitle>
                    <CardDescription>Créez votre compte</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Nom d'utilisateur</Label>
                            <Input
                                id="username"
                                {...register('username', { required: 'Nom d\'utilisateur requis' })}
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
                                placeholder="votre@email.com"
                                {...register('email', {
                                    required: 'Email requis',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Email invalide',
                                    },
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
                                    required: 'Mot de passe requis',
                                    minLength: {
                                        value: 8,
                                        message: 'Le mot de passe doit contenir au moins 8 caractères',
                                    },
                                })}
                            />
                            {errors.password && (
                                <p className="text-sm text-red-500">{errors.password.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                {...register('confirmPassword', {
                                    required: 'Confirmation du mot de passe requise',
                                    validate: value =>
                                        value === password || 'Les mots de passe ne correspondent pas',
                                })}
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                            )}
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Inscription...' : 'S\'inscrire'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-gray-500">
                        Déjà un compte ?{' '}
                        <a href="/login" className="text-blue-500 hover:text-blue-700">
                            Se connecter
                        </a>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
} 