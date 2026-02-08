import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import './MainLayout.css';

export function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="main-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="main-layout__content">
                <Header onMenuClick={toggleSidebar} />
                <main className="main-layout__main">
                    <Outlet />
                </main>
            </div>

            {sidebarOpen && (
                <div
                    className="main-layout__overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
