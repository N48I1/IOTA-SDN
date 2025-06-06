import { createContext, useContext, useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom"; // useNavigate might not be needed here

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void; // Add login function to update state
  logout: () => void; // Add logout function to update state
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // const navigate = useNavigate(); // useNavigate might not be needed here

  // Check for JWT token in localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token); // isAuthenticated is true if token exists

    // We don't need a storage event listener here if login/logout update state directly
  }, []); // Empty dependency array means this effect runs only once on mount

  // Function to update auth state after successful login (called from login components)
  const login = () => {
    setIsAuthenticated(true);
  };

  // Function to update auth state after logout (called from logout logic)
  const logout = () => {
    localStorage.removeItem("token"); // Also remove token from storage
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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
