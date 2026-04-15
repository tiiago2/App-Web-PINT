import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactDOM from 'react-dom';
import './ClassificacaoModal.css';
import user_logo from '../assets/utilizador.png';

/**
 * Modal da Classificação Geral
 */
const ClassificacaoModal = ({ classificacao, onClose }) => {
    // Top 3 prontos; ordem visual do pódio: 2º | 1º | 3º
    const { t } = useTranslation();
    const podio = [classificacao[1], classificacao[0], classificacao[2]];
    const lista = classificacao.slice(3);

    // Dropdown state
    const [filtrarOpen, setFiltrarOpen] = useState(false);
    const [semanaOpen, setSemanaOpen] = useState(false);
    const [filtroSel, setFiltroSel] = useState(null);
    const [semanaSel, setSemanaSel] = useState('semana');

    // Fechar dropdowns ao clicar fora
    const filtrarRef = useRef(null);
    const semanaRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (filtrarRef.current && !filtrarRef.current.contains(e.target)) setFiltrarOpen(false);
            if (semanaRef.current && !semanaRef.current.contains(e.target)) setSemanaOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Bloqueia scroll do body enquanto o modal está aberto
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    // Opções dos dropdowns
    const filtrarOpcoes = ['area', 'service_line', 'funcao', 'data'];
    const semanaOpcoes = ['semana', 'mes', 'ano', 'sempre'];

    return ReactDOM.createPortal(
        <div className="classif-overlay" onClick={onClose}>
            <div className="classif-modal" onClick={e => e.stopPropagation()}>

                {/* ── Header ── */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold m-0">{t('classificacao')}</h5>
                    <button className="classif-btn-close" onClick={onClose}>
                        <i className="fi fi-br-cross"></i>
                    </button>
                </div>

                {/* ── Filtros ── */}
                <div className="d-flex justify-content-between align-items-center mb-4">

                    {/* Filtrar */}
                    <div className="classif-dropdown-wrap" ref={filtrarRef}>
                        <button
                            className={`classif-filtro-btn${filtrarOpen ? ' active' : ''}`}
                            onClick={() => { setFiltrarOpen(o => !o); setSemanaOpen(false); }}
                        >
                            {t('filtrar')}
                            <i className="fi fi-br-filter" style={{ fontSize: '0.7rem' }}></i>
                        </button>
                        {filtrarOpen && (
                            <div className="classif-dropdown">
                                <div className="classif-dropdown-header">{t('filtrar_por')}</div>
                                {filtrarOpcoes.map(op => (
                                    <div
                                        key={op}
                                        className={`classif-dropdown-item${filtroSel === op ? ' selected' : ''}`}
                                        onClick={() => { setFiltroSel(op); setFiltrarOpen(false); }}
                                    >
                                        {t(op)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Semana */}
                    <div className="classif-dropdown-wrap" ref={semanaRef}>
                        <button
                            className={`classif-filtro-btn${semanaOpen ? ' active' : ''}`}
                            onClick={() => { setSemanaOpen(o => !o); setFiltrarOpen(false); }}
                        >
                            {t(semanaSel)}
                            <i className="fi fi-br-list" style={{ fontSize: '0.7rem' }}></i>
                        </button>
                        {semanaOpen && (
                            <div className="classif-dropdown classif-dropdown-right">
                                <div className="classif-dropdown-header">{t('rankear')}</div>
                                {semanaOpcoes.map(op => (
                                    <div
                                        key={op}
                                        className={`classif-dropdown-item${semanaSel === op ? ' selected' : ''}`}
                                        onClick={() => { setSemanaSel(op); setSemanaOpen(false); }}
                                    >
                                        {t(op)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                {/* ── Pódio Top 3 ── */}
                <div className="classif-podio">
                    {podio.map((item) => (
                        <div key={item.pos} className={`classif-podio-card ${item.classe}`}>
                            <img
                                src={user_logo}
                                className="rounded-circle bg-light mb-2"
                                width="48"
                                height="48"
                                alt="user"
                                style={{ objectFit: 'cover' }}
                            />
                            <div className="fw-bold" style={{ fontSize: '0.85rem' }}>{item.nome}</div>
                            <div className="text-muted" style={{ fontSize: '0.72rem' }}>{item.area}</div>
                            <div className="fw-bold mt-1" style={{ fontSize: '0.92rem' }}>{item.pontos}</div>
                        </div>
                    ))}
                </div>

                {/* ── Lista 4º em diante ── */}
                <div className="classif-lista">
                    {lista.map((item) => (
                        <div
                            key={item.pos}
                            className="d-flex align-items-center justify-content-between p-2 mb-2"
                            style={{ border: '1px solid #CAD5E2', borderRadius: '12px' }}
                        >
                            <div className="d-flex align-items-center gap-2">
                                <span className="fw-bold" style={{ minWidth: '28px', fontSize: '0.9rem' }}>
                                    {item.pos}.
                                </span>
                                <img
                                    src={user_logo}
                                    className="rounded-circle bg-light"
                                    width="32"
                                    height="32"
                                    alt="user"
                                    style={{ objectFit: 'cover' }}
                                />
                                <div>
                                    <div className="fw-bold" style={{ fontSize: '0.82rem' }}>{item.nome}</div>
                                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>{item.area}</div>
                                </div>
                            </div>
                            <div className="fw-bold" style={{ fontSize: '0.85rem' }}>{item.pontos}</div>
                        </div>
                    ))}
                </div>

            </div>
        </div>,
        document.body
    );
};

export default ClassificacaoModal;
