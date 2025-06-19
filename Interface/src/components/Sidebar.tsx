import React from 'react';

const Sidebar: React.FC = () => {
    return (
        <aside className="w-64 bg-gray-800 text-white p-4">
            <h1 className="text-2xl font-bold mb-6">IOTA-SDN</h1>
            <nav>
                <ul>
                    {/* Ajoutez ici les liens de navigation, par exemple vers /dashboard, /admin */}
                    <li><a href="/dashboard" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">Dashboard</a></li>
                    <li><a href="/admin" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">Admin</a></li>
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar; 