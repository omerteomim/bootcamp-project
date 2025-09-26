import React, { useState } from 'react';
import { analyzeEssay } from '../services/api';
import '../App.css';

const DashboardPage: React.FC = () => {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [result, setResult] = useState('שלח חיבור כדי לראות את תוצאות הניתוח כאן.');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || !answer.trim()) return;

        setIsAnalyzing(true);
        setResult('מנתח... אנא המתן.');

        try {
            const data = await analyzeEssay(question, answer);
            setResult(data.result);
            setQuestion('');
            setAnswer('');
        } catch (err: any) {
            setResult(err.message || 'הניתוח נכשל.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="container">
            <div className="input-section">
                <h2>📝 ניתוח חיבור</h2>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="question"><strong>שאלה/נושא:</strong></label>
                        <textarea
                            id="question"
                            name="question"
                            placeholder="הכנס כאן את נושא החיבור..."
                            required
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                        ></textarea>
                    </div>
                    <div>
                        <label htmlFor="answer"><strong>תשובת התלמיד:</strong></label>
                        <textarea
                            id="answer"
                            name="answer"
                            placeholder="הדבק כאן את החיבור המלא של התלמיד..."
                            required
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                        ></textarea>
                    </div>
                    <button type="submit" className="analyze-btn" disabled={isAnalyzing}>
                        {isAnalyzing ? 'מנתח...' : 'נתח חיבור'}
                    </button>
                </form>
            </div>

            <div className="result-section">
                <h2>📊 תוצאות הניתוח</h2>
                <div id="resultContainer">
                    <div className="result-content">
                        {result}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;