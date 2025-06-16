import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Layout from '@/components/Layout'; // Assuming you have a Layout component for navigation/sidebar

interface User {
    id: number;
    username: string;
    email: string;
    eth_address: string;
    is_authorized: boolean;
    is_admin: boolean;
}

const AdminPage: React.FC = () => {
    const { isAuthenticated, isAdmin, checkAuthStatus } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (!isAdmin) {
            toast.error('Accès non autorisé. Vous n\'êtes pas administrateur.');
            navigate('/dashboard'); // Redirect non-admins
            return;
        }

        fetchUsers();
    }, [isAuthenticated, isAdmin, navigate]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://192.168.1.8:5000/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la récupération des utilisateurs');
            }
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Erreur inconnue lors de la récupération des utilisateurs.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAuthorize = async (userId: number) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://192.168.1.8:5000/api/admin/authorize/${userId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de l\'autorisation de l\'utilisateur');
            }
            toast.success('Utilisateur autorisé avec succès !');
            fetchUsers(); // Refresh list
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Erreur inconnue lors de l\'autorisation de l\'utilisateur.');
            }
        }
    };

    if (isLoading) {
        return <Layout><p>Chargement des utilisateurs...</p></Layout>;
    }

    // This check is already done in useEffect, but good for robustness
    if (!isAdmin) {
        return <Layout><p>Accès refusé.</p></Layout>;
    }

    return (
        <Layout>
            <div className="container mx-auto p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Administration des Utilisateurs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Nom d\'utilisateur</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Adresse Ethereum</TableHead>
                                    <TableHead>Autorisé</TableHead>
                                    <TableHead>Admin</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.id}</TableCell>
                                        <TableCell>{user.username}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell className="font-mono text-sm break-all">{user.eth_address}</TableCell>
                                        <TableCell>{user.is_authorized ? '✅ Oui' : '❌ Non'}</TableCell>
                                        <TableCell>{user.is_admin ? '👑 Oui' : 'No'}</TableCell>
                                        <TableCell>
                                            {!user.is_authorized && !user.is_admin && (
                                                <Button
                                                    onClick={() => handleAuthorize(user.id)}
                                                    size="sm"
                                                >
                                                    Autoriser
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default AdminPage; 