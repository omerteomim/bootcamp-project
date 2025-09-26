import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import '../App.css';

interface DashboardLayoutProps {
    children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    return (
        <div className="body-dashboard">
            <div id="main-container">
                <Navbar />
                {children}
            </div>
        </div>
    );
};

export default DashboardLayout;