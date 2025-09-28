import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../App.css'; // Assuming App.css contains the global styles

const SignupPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'
    const { signUp } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setMessageType('');

        try {
            await signUp(email, password);
            setMessage('הרשמה בוצעה בהצלחה! אנא התחבר.');
            setMessageType('success');
            setEmail('');
            setPassword('');
        } catch (err: any) {
            setMessage(err.message || 'שגיאה ביצירת חשבון');
            setMessageType('error');
        }
    };

    return (
        <div className="body-center">
            <div className="form-container">
                <h1>הרשמה</h1>
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
                        placeholder="סיסמה (לפחות 6 תווים)"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit" className="submit-btn">הירשם</button>
                </form>
                <div className="link">
                    <Link to="/">כבר יש לך חשבון? התחבר</Link>
                </div>
                {message && <div className={`message ${messageType}`}>{message}</div>}
            </div>
        </div>
    );
};

export default SignupPage;