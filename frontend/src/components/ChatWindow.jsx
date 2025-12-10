import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ChatWindow({ session_id, user_id }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load History
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`http://localhost:8000/chat/history/${session_id}`);
                const data = await res.json();
                setMessages(data.history || []);
            } catch (e) {
                console.error("Failed to load history", e);
            }
        };
        if (session_id) fetchHistory();
    }, [session_id]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user_id,
                    session_id: session_id,
                    message: userMsg.text
                })
            });

            const data = await response.json();
            if (data.response) {
                setMessages(prev => [...prev, { role: 'bot', text: data.response }]);
            }
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: 'bot', text: "Error connecting to Study Buddy." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{
                flex: 1,
                overflowY: 'auto',
                paddingRight: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        <MessageSquare size={48} style={{ marginBottom: '1rem' }} />
                        <p>Start a new conversation with your Study Buddy!</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '80%',
                            display: 'flex',
                            gap: '0.75rem',
                            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                        }}
                    >
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: msg.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                        </div>

                        <div style={{
                            padding: '1rem',
                            borderRadius: '16px',
                            background: msg.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                            borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
                            borderTopLeftRadius: msg.role === 'bot' ? '4px' : '16px',
                            border: '1px solid var(--glass-border)'
                        }}>
                            {msg.text}
                        </div>
                    </motion.div>
                ))}
                {loading && (
                    <div style={{ alignSelf: 'flex-start', marginLeft: '3rem', color: 'var(--text-muted)' }}>
                        Study Buddy is thinking...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask a doubt..."
                    style={{ flex: 1 }}
                />
                <button className="btn-primary" onClick={sendMessage} disabled={loading}>
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
}
