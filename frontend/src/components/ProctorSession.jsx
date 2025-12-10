import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function ProctorSession({ session_id }) {
    const [started, setStarted] = useState(false);
    const [warnings, setWarnings] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(true);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Enforce Fullscreen & Focus
    useEffect(() => {
        if (!started || submitted) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setWarnings(prev => prev + 1);
                alert("Warning: You switched tabs! This is recorded.");
            }
        };

        const handleBlur = () => {
            setWarnings(prev => prev + 1);
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
        };
    }, [started, submitted]);

    const startSession = async () => {
        setLoading(true);
        try {
            // Request Fullscreen
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            }

            const res = await fetch('http://localhost:8000/qa/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: session_id, topic: "General" })
            });
            const data = await res.json();

            if (data.questions) {
                setQuestions(data.questions);
                setStarted(true);
            } else {
                alert("Failed to generate questions. Try uploading a document first.");
            }
        } catch (e) {
            console.error(e);
            alert("Connection Error");
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (qId, option) => {
        setAnswers(prev => ({ ...prev, [qId]: option }));
    };

    const submitExam = async () => {
        setLoading(true);
        try {
            // Format answers for backend
            const answerPayload = Object.entries(answers).map(([id, ans]) => ({
                id: parseInt(id),
                answer: ans
            }));

            const res = await fetch('http://localhost:8000/qa/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: session_id,
                    answers: answerPayload
                })
            });
            const data = await res.json();
            setResult(data);
            setSubmitted(true);

            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                <span style={{ marginLeft: '1rem' }}>Processing Exam Data...</span>
            </div>
        );
    }

    if (submitted && result) {
        if (result.status === 'error') {
            return (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <AlertTriangle size={64} color="#f87171" style={{ marginBottom: '1rem' }} />
                    <h2>Grading Error</h2>
                    <p>{result.message || "Please contact support."}</p>
                    <button className="btn-primary" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>Return Home</button>
                </div>
            );
        }
        return (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                    <Shield size={64} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                    <h2>Exam Completed</h2>
                    <div className="glass-panel" style={{ margin: '2rem auto', maxWidth: '400px', padding: '2rem' }}>
                        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                            {result.score}%
                        </div>
                        <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>{result.feedback}</p>
                        <p style={{ color: 'var(--text-muted)' }}>Correct: {result.correct_count} / {result.total}</p>
                    </div>
                    <button className="btn-primary" onClick={() => navigate('/')}>Return Home</button>
                </motion.div>
            </div>
        );
    }

    if (!started) {
        return (
            <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
                <Shield size={64} style={{ marginBottom: '1rem', color: 'var(--primary)' }} />
                <h2>Proctored Review Session</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    This session is monitored. Switching tabs or windows will be recorded as warnings.
                    Questions are generated from your uploaded notes.
                </p>
                <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem', textAlign: 'left' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={18} color="#eab308" /> Rules
                    </h4>
                    <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                        <li>Full screen mode is mandatory.</li>
                        <li>Do not switch tabs.</li>
                        <li>Microphone access may be requested (Mock).</li>
                    </ul>
                </div>
                <button className="btn-primary" onClick={startSession}>
                    Enter Exam Hall
                </button>
            </div>
        );
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--glass-border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={20} color={warnings > 0 ? '#f87171' : '#4ade80'} />
                    <span>Status: {warnings > 0 ? 'Warning Issued' : 'Secure'}</span>
                </div>
                <div>Warnings: {warnings}</div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 0' }}>
                {questions.map((q, idx) => (
                    <motion.div
                        key={q.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="glass-panel"
                        style={{ marginBottom: '1.5rem', padding: '1.5rem' }}
                    >
                        <h4 style={{ marginBottom: '1rem' }}>{idx + 1}. {q.question}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {q.options.map((opt, optIdx) => (
                                <label
                                    key={optIdx}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        background: answers[q.id] === opt ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                        cursor: 'pointer',
                                        border: answers[q.id] === opt ? '1px solid var(--primary)' : '1px solid transparent'
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name={`q-${q.id}`}
                                        value={opt}
                                        checked={answers[q.id] === opt}
                                        onChange={() => handleAnswer(q.id, opt)}
                                        style={{ accentColor: 'var(--primary)' }}
                                    />
                                    {opt}
                                </label>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', textAlign: 'right' }}>
                <button className="btn-primary" onClick={submitExam}>
                    Submit Assessment
                </button>
            </div>
        </div>
    );
}
