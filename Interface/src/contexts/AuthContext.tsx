import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
// import { useNavigate } from "react-router-dom"; // useNavigate might not be needed here

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean; // Nouveau champ pour le statut admin
  token: string | null; // Added token property
  login: () => void; // Add login function to update state
  logout: () => void; // Add logout function to update state
  checkAuthStatus: () => Promise<void>; // Fonction pour vérifier l'état auth (incluant admin)
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // Nouvel état pour l'admin
  // const navigate = useNavigate(); // useNavigate might not be needed here

  const checkAuthStatus = useCallback(async () => {
    const token = localStorage.getItem("token");
    const authenticated = !!token;
    setIsAuthenticated(authenticated);

    if (authenticated) {
      try {
        const response = await fetch('http://192.168.1.8:5000/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.is_admin); // Mettre à jour isAdmin basé sur la réponse
        } else {
          // Token invalide ou expiré, déconnecter l'utilisateur
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          setIsAdmin(false);
          // toast.error("Votre session a expiré. Veuillez vous reconnecter."); // Optional: show toast
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du statut d'authentification:", error);
        // En cas d'erreur réseau ou autre, supposer non authentifié/non admin
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Function to update auth state after successful login (called from login components)
  const login = () => {
    setIsAuthenticated(true);
    checkAuthStatus(); // Re-vérifier l'état après login
  };

  // Function to update auth state after logout (called from logout logic)
  const logout = () => {
    localStorage.removeItem("token"); // Also remove token from storage
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, login, logout, checkAuthStatus, token: localStorage.getItem("token") }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
