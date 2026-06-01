import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import './CandidaturaModal.css';

const CandidaturaModal = ({ candidature, user, badge, onClose, onAccept, onReject }) => {
    const { t } = useTranslation();

    useEffect(() => {
        // Prevent background scrolling when modal is open
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    if (!candidature || !user || !badge) return null;

    // Helper to extract how many hours ago it was submitted (mocked for demo)
    const getHoursSubmitted = () => {
        // For demonstration, extract some time from candidature data or use default
        return "2 horas";
    };

    return ReactDOM.createPortal(
        <div className="candidatura-overlay" onClick={onClose}>
            <div className="candidatura-modal" onClick={(e) => e.stopPropagation()}>
                {/* Botão de Fechar */}
                <button className="candidatura-btn-close" onClick={onClose}>
                    <i className="fi fi-br-cross"></i>
                </button>

                {/* Secção Superior: Info Principal */}
                <div className="candidatura-top-section">
                    <div className="candidatura-badge-container">
                        <img className="candidatura-badge-img" src={badge.imagem} alt={badge.titulo} />
                    </div>

                    <div className="candidatura-details">
                        <h2 className="candidatura-title">{badge.titulo}</h2>
                        
                        <div className="candidatura-user-tag">
                            <i className="fi fi-br-user candidatura-user-icon"></i>
                            <span>{user.nome}</span>
                        </div>

                        <p className="candidatura-meta-text">
                            <strong>{t('area')}:</strong> {user.area}
                        </p>
                        <p className="candidatura-meta-text">
                            <strong>Submetido:</strong> {getHoursSubmitted()}
                        </p>
                        <p className="candidatura-meta-text">
                            <strong>Pontuação:</strong> {badge.pontos} pontos
                        </p>

                        <div className="candidatura-progress-bar-wrap">
                            <div className="candidatura-progress-bar-fill" style={{ width: '100%' }}>
                                100%
                            </div>
                        </div>
                    </div>
                </div>

                <hr style={{ border: '0', borderTop: '1px solid #cad5e2', margin: '8px 0' }} />

                {/* Secção do Meio: Descrição */}
                <div>
                    <h5 className="candidatura-section-title">Descrição:</h5>
                    <p className="candidatura-section-content">
                        {badge.descricao || "Aqui estará a descrição do badge"}
                    </p>
                </div>

                {/* Secção de Requisitos */}
                <div>
                    <h5 className="candidatura-section-title">Requisitos:</h5>
                    <div className="candidatura-requirement-box">
                        <span className="candidatura-requirement-text">
                            1. Aqui estará a descrição do requisito 1
                        </span>
                        <button className="candidatura-pdf-btn" title="Download PDF">
                            <i className="fi fi-br-document"></i>
                        </button>
                    </div>
                </div>

                {/* Botões de Ação no Rodapé */}
                <div className="candidatura-footer-actions">
                    <button 
                        className="candidatura-btn-action accept" 
                        onClick={() => {
                            if (onAccept) onAccept(candidature.id);
                            onClose();
                        }}
                    >
                        <i className="fi fi-br-check"></i> {t('aceitar')}
                    </button>
                    <button 
                        className="candidatura-btn-action reject" 
                        onClick={() => {
                            if (onReject) onReject(candidature.id);
                            onClose();
                        }}
                    >
                        <i className="fi fi-br-cross"></i> {t('rejeitar')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CandidaturaModal;
