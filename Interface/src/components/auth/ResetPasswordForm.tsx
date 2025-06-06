import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface ResetPasswordFormData {
    new_password: string;
    confirm_password: string;
}

export function ResetPasswordForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordFormData>();
    const newPassword = watch('new_password');

    const onSubmit = async (data: ResetPasswordFormData) => {
        if (!token) {
            toast.error('Token de réinitialisation manquant');
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5000/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    new_password: data.new_password,
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message);
            }

            toast.success('Mot de passe réinitialisé avec succès !');
            // Rediriger vers la page de connexion
            window.location.href = '/login';
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erreur lors de la réinitialisation');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-[400px]">
            <CardHeader>
                <CardTitle>Réinitialiser le mot de passe</CardTitle>
                <CardDescription>
                    Entrez votre nouveau mot de passe
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="new_password">Nouveau mot de passe</Label>
                        <Input
                            id="new_password"
                            type="password"
                            {...register('new_password', {
                                required: 'Nouveau mot de passe requis',
                                minLength: {
                                    value: 8,
                                    message: 'Le mot de passe doit contenir au moins 8 caractères',
                                },
                            })}
                        />
                        {errors.new_password && (
                            <p className="text-sm text-red-500">{errors.new_password.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm_password">Confirmer le mot de passe</Label>
                        <Input
                            id="confirm_password"
                            type="password"
                            {...register('confirm_password', {
                                required: 'Confirmation du mot de passe requise',
                                validate: value =>
                                    value === newPassword || 'Les mots de passe ne correspondent pas',
                            })}
                        />
                        {errors.confirm_password && (
                            <p className="text-sm text-red-500">{errors.confirm_password.message}</p>
                        )}
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
} 