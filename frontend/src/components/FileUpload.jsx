import React, { useState } from 'react';
import { UploadCloud, File, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FileUpload({ user_id }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState(null); // 'success', 'error'

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type === 'application/pdf') {
            setFile(droppedFile);
            setStatus(null);
        } else {
            alert("Please upload a PDF file.");
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setStatus(null);
        }
    };

    const uploadFile = async () => {
        if (!file) return;
        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`http://localhost:8000/upload?user_id=${user_id}`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            setStatus('success');
            setFile(null); // Clear after success
        } catch (error) {
            console.error(error);
            setStatus('error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <h2 style={{ marginBottom: '2rem' }}>Upload Study Material</h2>

            <motion.div
                className="glass-panel"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                    width: '100%',
                    maxWidth: '500px',
                    height: '300px',
                    border: '2px dashed var(--glass-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative'
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput').click()}
            >
                <input
                    type="file"
                    id="fileInput"
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />

                <AnimatePresence>
                    {!file ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="empty">
                            <UploadCloud size={64} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--text-muted)' }}>Drag & Drop PDF or Click to Browse</p>
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="file">
                            <File size={64} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                            <p style={{ fontWeight: 'bold' }}>{file.name}</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {uploading && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px' }}>
                        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                    </div>
                )}
            </motion.div>

            <div style={{ marginTop: '2rem', height: '50px' }}>
                {file && !uploading && (
                    <button className="btn-primary" onClick={(e) => { e.stopPropagation(); uploadFile(); }}>
                        Process Document
                    </button>
                )}

                {status === 'success' && (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4ade80' }}>
                        <CheckCircle size={20} />
                        <span>Document Ingested Successfully!</span>
                    </motion.div>
                )}

                {status === 'error' && (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171' }}>
                        <AlertCircle size={20} />
                        <span>Upload Failed. Check backend.</span>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
