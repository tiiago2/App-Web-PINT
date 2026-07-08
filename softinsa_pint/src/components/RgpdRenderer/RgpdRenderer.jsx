import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './RgpdRenderer.css';

const RgpdRenderer = ({ texto = '', className = '' }) => {
    if (!texto || !texto.trim()) {
        return null;
    }

    return (
        <div className={`rgpd-renderer ${className}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {texto}
            </ReactMarkdown>
        </div>
    );
};

export default RgpdRenderer;
