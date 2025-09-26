import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const Navbar: React.FC = () => {
    return (
        <div className="header">
            <img src="/image.png" alt="Logo" className="navbar-logo" />
            <nav className="nav-links">
                <Link to="/dashboard" className="nav-link">ניתוח חיבורים</Link>
                <Link to="/history" className="nav-link">היסטוריה</Link>
                <Link to="/about" className="nav-link">אודות</Link>
            </nav>
        </div>
    );
};

export default Navbar;