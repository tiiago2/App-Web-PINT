import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import './AtividadeModal.css';

// Mapeia a classe Bootstrap para a variante do ícone no modal
const corParaVariante = {
    'text-success': 'success',
    'text-danger':  'danger',
    'text-primary': 'primary',
    'text-warning': 'warning',
};

/* ── 1. COMPONENTE INTERNO: O MODAL (PORTAL) ──────────────── */
const AtividadeModalContent = ({ atividades, onClose }) => {
    const { t } = useTranslation();

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return ReactDOM.createPortal(
        <div className="ativ-overlay" onClick={onClose}>
            <div className="ativ-modal" onClick={e => e.stopPropagation()}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5>{t('atividade_recente')}</h5>
                    <button className="ativ-btn-close" onClick={onClose}>
                        <i className="fi fi-br-cross"></i>
                    </button>
                </div>

                <div className="ativ-lista">
                    {atividades.map((item, i) => (
                        <div key={i} className="ativ-item">
                            <div className={`ativ-icon-wrap ${corParaVariante[item.cor] || 'primary'}`}>
                                <i className={`fi ${item.icone}`}></i>
                            </div>
                            <div className={`ativ-texto${item.expirado ? ' expirado' : ''}`}>
                                {item.textoNegrito
                                    ? <><strong>{item.textoNegrito}</strong>{' '}{item.texto}</>
                                    : item.texto
                                }
                            </div>
                            <div className="ativ-tempo">{item.tempo}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
};

/* ── 2. COMPONENTE EXPORTADO: O WIDGET PRINCIPAL ────────── */
const AtividadeRecente = ({ atividades, fullHeight }) => {
    const { t } = useTranslation();
    const [showModal, setShowModal] = useState(false);

    if (!atividades || atividades.length === 0) return null;

    return (
        <div className={`p-3 d-flex flex-column bg-white ${fullHeight ? 'h-100' : ''}`} style={{ border: 'var(--borda-principal) solid var(--contorno)', borderRadius: 'var(--border-radius-grande)', boxSizing: 'border-box', height: fullHeight ? '100%' : '35vh' }}>
            
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h5>{t('atividade_recente')}</h5>
                <i className="fi fi-br-expand text-muted me-1" style={{ cursor: 'pointer' }} onClick={() => setShowModal(true)}></i>
            </div>

            {/* 2. MAGIA DO SCROLL: flex-grow-1 e overflow-y-auto com a barra escondida */}
            <div className="d-flex flex-column justify-content-between flex-grow-1 overflow-y-auto pe-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`.overflow-y-auto::-webkit-scrollbar { display: none; }`}</style>
                
                {atividades.slice(0, 6).map((item, i) => (
                    <div key={i} className={`atividade-item${item.expirado ? ' expirado' : ''}`}>
                        <span className="d-flex align-items-center gap-2">
                            <i className={`fi ${item.icone} ${item.cor}`}></i>
                            <span className="texto">
                                {item.textoNegrito && <strong>{item.textoNegrito} </strong>}
                                {item.texto}
                            </span>
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.7rem', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                            {item.tempo}
                        </span>
                    </div>
                ))}
            </div>

            {/* O modal pop-up continua a funcionar igual */}
            {showModal && (
                <AtividadeModalContent 
                    atividades={atividades} 
                    onClose={() => setShowModal(false)} 
                />
            )}
        </div>
    );
};

export default AtividadeRecente;