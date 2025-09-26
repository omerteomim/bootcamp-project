import React, { useState, useEffect, useCallback } from 'react';
import { getHistory, deleteHistory as deleteHistoryApi, deleteHistoryItem as deleteSingleHistoryItemApi } from '../services/api';
import '../App.css';

interface HistoryItem {
    id: string;
    created_at: string;
    question: string;
    answer: string;
    result: string;
}

const HistoryPage: React.FC = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [activeHistoryItem, setActiveHistoryItem] = useState<string | null>(null);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const escapeHtml = (s: string) => {
        return String(s).replace(/[&<>"'/]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;'}[c] || c));
    };

    const loadHistory = useCallback(async () => {
        setLoadingHistory(true);
        setError(null);
        try {
            const data = await getHistory();
            setHistory(data.history || []);
        } catch (err: any) {
            console.error("Error loading history:", err);
            setError(err.message || 'שגיאה בטעינת היסטוריה.');
        } finally {
            setLoadingHistory(false);
        }
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const toggleHistoryItem = (itemId: string) => {
        setActiveHistoryItem(prev => (prev === itemId ? null : itemId));
    };

    const handleDeleteAllHistory = async () => {
        if (!window.confirm('האם למחוק את כל ההיסטוריה? לא ניתן לשחזר פעולה זו.')) {
            return;
        }
        try {
            await deleteHistoryApi();
            loadHistory();
        } catch (err: any) {
            console.error("Error deleting all history:", err);
            alert(err.message || 'שגיאה במחיקת ההיסטוריה.');
        }
    };

    const handleDeleteSingleHistoryItem = async (itemId: string) => {
        if (!window.confirm('האם למחוק פריט היסטוריה זה? לא ניתן לשחזר פעולה זו.')) {
            return;
        }
        try {
            await deleteSingleHistoryItemApi(itemId);
            loadHistory();
        } catch (err: any) {
            console.error("Error deleting single history item:", err);
            alert(err.message || 'שגיאה במחיקת פריט ההיסטוריה.');
        }
    };

    return (
        <div className="history-page-container">
            <h2>📜 היסטוריה</h2>
            <div className="history-controls">
                <button onClick={loadHistory} className="history-btn">רענן</button>
                <button onClick={handleDeleteAllHistory} className="history-btn" id="deleteHistoryBtn">מחק הכל</button>
            </div>
            <div id="historyItems">
                {loadingHistory ? (
                    <p>טוען היסטוריה...</p>
                ) : error ? (
                    <p style={{ color: 'var(--danger-color)' }}>{error}</p>
                ) : history.length === 0 ? (
                    <p>אין היסטוריה להצגה.</p>
                ) : (
                    history.map((item, index) => (
                        <div
                            key={item.id}
                            className={`history-item ${activeHistoryItem === item.id ? 'active' : ''}`}
                            onClick={() => toggleHistoryItem(item.id)}
                        >
                            <div className="history-item-summary">
                                <div><strong>חיבור מספר {history.length - index}</strong></div>
                                <div className="history-item-date">
                                    {new Date(item.created_at).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}
                                </div>
                            </div>
                            {activeHistoryItem === item.id && (
                                <div className="history-item-details">
                                    <hr />
                                    <p><strong>שאלה מלאה:</strong></p>
                                    <pre>{escapeHtml(item.question || '')}</pre>
                                    <p><strong>תשובה מלאה:</strong></p>
                                    <pre>{escapeHtml(item.answer || '')}</pre>
                                    <p><strong>תוצאות הניתוח:</strong></p>
                                    <pre>{escapeHtml(item.result || '')}</pre>
                                    <button
                                        onClick={() => handleDeleteSingleHistoryItem(item.id)}
                                        className="history-btn delete-single-btn"
                                    >
                                        מחק פריט זה
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HistoryPage;