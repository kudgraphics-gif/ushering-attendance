import { Outlet } from 'react-router-dom';
import { useSidebarStore } from '../../stores/sidebarStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ProfileCompletionPopup } from '../ui/ProfileCompletionPopup';
import './MainLayout.css';

export function MainLayout() {
    const sidebarOpen = useSidebarStore((state) => state.isOpen);
    const setSidebarOpen = useSidebarStore((state) => state.setOpen);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className={`main-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            <ProfileCompletionPopup />
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
