import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import './AtividadeModal.css';

/**
 * Modal da Atividade Recente
 *
 * Props:
 *   atividades  – array completo de atividades
 *   onClose     – função para fechar o modal
 *
 * Cada item do array deve ter:
 *   { icone, cor, texto, textoNegrito?, tempo, expirado }
 *
 * cor pode ser: "text-success" | "text-danger" | "text-primary" | "text-warning"
 */

// Mapeia a classe Bootstrap para a classe do ícone no modal
const corParaVariante = {
    'text-success': 'success',
    'text-danger':  'danger',
    'text-primary': 'primary',
    'text-warning': 'warning',
};

const AtividadeModal = ({ atividades, onClose }) => {
    const { t } = useTranslation();

    // Bloqueia scroll do body enquanto o modal está aberto
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return ReactDOM.createPortal(
        <div className="ativ-overlay" onClick={onClose}>
            <div className="ativ-modal" onClick={e => e.stopPropagation()}>

                {/* ── Header ── */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold m-0">{t('atividade_recente')}</h5>
                    <button className="ativ-btn-close" onClick={onClose}>
                        <i className="fi fi-br-cross"></i>
                    </button>
                </div>

                {/* ── Lista (scroll a partir de ~10 itens) ── */}
                <div className="ativ-lista">
                    {atividades.map((item, i) => (
                        <div key={i} className="ativ-item">

                            {/* Ícone grande com fundo colorido */}
                            <div className={`ativ-icon-wrap ${corParaVariante[item.cor] || 'primary'}`}>
                                <i className={`fi ${item.icone}`}></i>
                            </div>

                            {/* Texto (com suporte a negrito opcional) */}
                            <div className={`ativ-texto${item.expirado ? ' expirado' : ''}`}>
                                {item.textoNegrito
                                    ? <><strong>{item.textoNegrito}</strong>{' '}{item.texto}</>
                                    : item.texto
                                }
                            </div>

                            {/* Tempo */}
                            <div className="ativ-tempo">{item.tempo}</div>

                        </div>
                    ))}
                </div>

            </div>
        </div>,
        document.body
    );
};

export default AtividadeModal;
