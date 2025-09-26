import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../App.css'; // Assuming App.css contains the global styles

const HomePage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { signIn, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/about');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await signIn(email, password);
            // signIn will handle navigation on success
        } catch (err: any) {
            setError(err.message || 'אימייל או סיסמה שגויים');
        }
    };

    return (
        <div className="body-center">
            <div className="form-container">
                <h1>התחברות</h1>
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="אימייל"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="סיסמה"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit" className="submit-btn">התחבר</button>
                </form>
                <div className="link">
                    <Link to="/signup">אין לך חשבון? הירשם</Link>
                </div>
                {error && <div className="message error">{error}</div>}
            </div>
        </div>
    );
};

export default HomePage;