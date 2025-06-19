import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'; // Assuming Sidebar exists or will be created
import Header from './Header'; // Assuming Header exists or will be created

interface LayoutProps {
    children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 p-6">
                    {children || <Outlet />}
                </main>
            </div>
        </div>
    );
};

export default Layout; 