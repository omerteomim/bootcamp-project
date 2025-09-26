import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile as updateUserProfileApi } from '../services/api';
import '../App.css';

const AboutPage: React.FC = () => {
    const { user, signOut, updateUser } = useAuth();
    const [name, setName] = useState(user?.profile?.name || '');
    const [phone, setPhone] = useState(user?.profile?.phone || '');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (user?.profile) {
            setName(user.profile.name || '');
            setPhone(user.profile.phone || '');
        }
    }, [user]);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage('');
                setMessageType('');
            }, 3000); // Clear message after 3 seconds
            return () => clearTimeout(timer); // Cleanup the timer
        }
    }, [message]);

    const handleLogout = () => {
        if (window.confirm('האם אתה בטוח שברצונך להתנתק?')) {
            signOut();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setMessageType('');

        try {
            await updateUserProfileApi(name, phone);
            updateUser({ name: name, phone }); // Update the user in the context
            setMessage('פרופיל עודכן בהצלחה!');
            setMessageType('success');
            setIsEditing(false); // Exit edit mode on success
        } catch (err: any) {
            setMessage(err.message || 'שגיאה בעדכון פרופיל.');
            setMessageType('error');
        }
    };

    const handleCancel = () => {
        // Reset to original values and exit edit mode
        setName(user?.profile?.name || '');
        setPhone(user?.profile?.phone || '');
        setIsEditing(false);
        setMessage('');
        setMessageType('');
    };

    return (
        <div className="about-page-container">
            <div className="about-section">
                <h1 style={{ fontSize: "1.8rem", marginBottom: "1rem", textAlign: "center" }}>
                    אודות בודק החיבורים
                </h1>

                <p style={{ fontSize: "1.1rem", lineHeight: "1.8", marginBottom: "1.5rem" }}>
                    ברוכים הבאים <strong>לבודק חיבורי הפסיכומטרי</strong> – אפליקציה חדשנית
                    שנבנתה במטרה לסייע הן לתלמידים והן למורים בתהליך ההכנה למבחן הפסיכומטרי.
                    האפליקציה משלבת בין תחום החינוך לבין טכנולוגיות מתקדמות של בינה מלאכותית,
                    ומספקת כלים ייחודיים לניתוח והבנה מעמיקה של כתיבה אקדמית.
                </p>

                <h3 style={{ fontSize: "1.4rem", marginBottom: "0.8rem" }}>
                    מה האפליקציה יודעת לעשות?
                </h3>
                <ul style={{ fontSize: "1.05rem", lineHeight: "1.8", paddingRight: "1.2rem" }}>
                    <li>להעריך את איכות החיבור ברמה כללית וברמת פירוט.</li>
                    <li>
                    לזהות את החוזקות המרכזיות בכתיבה – החל מהמבנה הלוגי, דרך אוצר המילים ועד
                    ליכולת ניסוח משכנעת.
                    </li>
                    <li>
                    לאתר נקודות חולשה שעשויות לפגוע בציון, כמו טעויות ניסוח, חוסר עקביות או
                    טיעונים חלקיים.
                    </li>
                    <li>
                    להציע המלצות מותאמות אישית לשיפור, כך שהמשתמש יוכל ללמוד מהטעויות ולהתפתח
                    בכתיבה לקראת החיבורים הבאים.
                    </li>
                </ul>

                <p style={{ fontSize: "1.1rem", lineHeight: "1.8", marginTop: "1.5rem" }}>
                    בסופו של דבר, המטרה היא להעניק חוויית למידה חכמה, אישית ויעילה יותר – כזו
                    שתאפשר לנבחנים להתאמן בצורה מדויקת ותספק למורים כלי עזר משמעותי להערכת
                    תלמידיהם.
                </p>
            </div>

            <div className="profile-update-section">
                <h2>פרטי פרופיל</h2>
                {!isEditing ? (
                    <div>
                        <p><strong>אימייל:</strong> {user?.email}</p>
                        <p><strong>שם:</strong> {user?.profile?.name || 'לא הוזן'}</p>
                        <p><strong>טלפון:</strong> {user?.profile?.phone || 'לא הוזן'}</p>
                        <button onClick={() => setIsEditing(true)} className="edit-btn">ערוך פרופיל</button>
                        <button onClick={handleLogout} className="logout-btn">התנתקות</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>אימייל:</label>
                            <p>{user?.email}</p>
                        </div>
                        <div className="form-group">
                            <label htmlFor="name">שם:</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="הכנס שם"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="phone">טלפון:</label>
                            <input
                                type="text"
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="הכנס מספר טלפון"
                            />
                        </div>
                        <button type="submit" className="edit-btn">שמור שינויים</button>
                        <button type="button" onClick={handleCancel} className="edit-btn cancel-btn">ביטול</button>
                    </form>
                )}
                {message && <div className={`message ${messageType}`}>{message}</div>}
            </div>
        </div>
    );
};

export default AboutPage;