import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactDOM from 'react-dom';
import './ClassificacaoModal.css';
import user_logo from '../assets/utilizador.png';

/* ── 1. COMPONENTE INTERNO: O MODAL ─────────────────────── */
const ClassificacaoModal = ({ classificacao, onClose }) => {
    const { t } = useTranslation();
    const podio = [classificacao[1], classificacao[0], classificacao[2]];
    const lista = classificacao.slice(3);

    const [filtrarOpen, setFiltrarOpen] = useState(false);
    const [semanaOpen, setSemanaOpen] = useState(false);
    const [filtroSel, setFiltroSel] = useState(null);
    const [semanaSel, setSemanaSel] = useState('semana');

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

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const filtrarOpcoes = ['area', 'service_line', 'funcao'];
    const semanaOpcoes = ['semana', 'mes', 'ano', 'sempre'];

    return ReactDOM.createPortal(
        <div className="classif-overlay" onClick={onClose}>
            <div className="classif-modal" onClick={e => e.stopPropagation()}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>{t('classificacao')}</h5>
                    <button className="classif-btn-close" onClick={onClose}>
                        <i className="fi fi-br-cross"></i>
                    </button>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="classif-dropdown-wrap" ref={filtrarRef}>
                        <button className={`classif-filtro-btn${filtrarOpen ? ' active' : ''}`} onClick={() => { setFiltrarOpen(o => !o); setSemanaOpen(false); }}>
                            {t('filtrar')} <i className="fi fi-br-filter" style={{ fontSize: '0.7rem' }}></i>
                        </button>
                        {filtrarOpen && (
                            <div className="classif-dropdown">
                                <div className="classif-dropdown-header">{t('filtrar_por')}</div>
                                {filtrarOpcoes.map(op => (
                                    <div key={op} className={`classif-dropdown-item${filtroSel === op ? ' selected' : ''}`} onClick={() => { setFiltroSel(op); setFiltrarOpen(false); }}>
                                        {t(op)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="classif-dropdown-wrap" ref={semanaRef}>
                        <button className={`classif-filtro-btn${semanaOpen ? ' active' : ''}`} onClick={() => { setSemanaOpen(o => !o); setFiltrarOpen(false); }}>
                            {t(semanaSel)} <i className="fi fi-br-list" style={{ fontSize: '0.7rem' }}></i>
                        </button>
                        {semanaOpen && (
                            <div className="classif-dropdown classif-dropdown-right">
                                <div className="classif-dropdown-header">{t('rankear')}</div>
                                {semanaOpcoes.map(op => (
                                    <div key={op} className={`classif-dropdown-item${semanaSel === op ? ' selected' : ''}`} onClick={() => { setSemanaSel(op); setSemanaOpen(false); }}>
                                        {t(op)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="classif-podio">
                    {podio.map((item) => (
                        <div key={item.pos} className={`classif-podio-card ${item.classe}`}>
                            <img src={user_logo} className="rounded-2 mb-2" width="48" height="48" alt="user" style={{ objectFit: 'cover' }} />
                            <div className="fw-medium" style={{ fontSize: '0.85rem' }}>{item.nome}</div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>{item.area}</div>
                            <div className="fw-semibold mt-1" style={{ fontSize: '0.9rem' }}>{item.pontos}</div>
                        </div>
                    ))}
                </div>

                <div className="classif-lista">
                    {lista.map((item) => (
                        <div key={item.pos} className="d-flex align-items-center justify-content-between p-2 mb-2" style={{ border: '1px solid #CAD5E2', borderRadius: '12px' }}>
                            <div className="d-flex align-items-center gap-2">
                                <span className="fw-bold" style={{ minWidth: '28px', fontSize: '0.9rem' }}>{item.pos}.</span>
                                <img src={user_logo} className="rounded-3" width="32" height="32" alt="user" style={{ objectFit: 'cover' }} />
                                <div>
                                    <div className="fw-medium" style={{ fontSize: '0.82rem' }}>{item.nome}</div>
                                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>{item.area}</div>
                                </div>
                            </div>
                            <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{item.pontos}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
};


const ClassificacaoGeral = ({ classificacao }) => {
    const { t } = useTranslation();
    const [showClassificacao, setShowClassificacao] = useState(false);

    if (!classificacao || classificacao.length === 0) return null;

    return (
        <div className="border border-2 rounded-4 p-3 d-flex flex-column bg-white" style={{ height: '35vh' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h5>{t('classificacao_geral')}</h5>
                <i className="fi fi-br-expand me-1" style={{ cursor: 'pointer' }} onClick={() => setShowClassificacao(true)}></i>
            </div>

            <div className="d-flex flex-column gap-2 flex-grow-1 overflow-y-auto pe-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`.overflow-y-auto::-webkit-scrollbar { display: none; }`}</style>
                {classificacao.slice(0, 5).map((item, index) => (
                    <div key={index} className={`ranking-row ${item.classe || ''}`}>
                        <div className="d-flex align-items-center gap-2">
                            {item.pos <= 3 ? (
                                <i className="fi fi-br-badge" style={{ color: item.cor, fontSize: '1.2rem', minWidth: '22px' }}></i>
                            ) : (
                                <span className="fw-semibold" style={{ minWidth: '22px', fontSize: '0.85rem' }}>{item.pos}.</span>
                            )}
                            <img src={user_logo} className="rounded-2" width="28" height="28" alt="user" style={{ objectFit: 'cover' }} />
                            <div>
                                <div className="fw-medium" style={{ fontSize: '0.8rem'}}>{item.nome}</div>
                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>{item.area}</div>
                            </div>
                        </div>
                        <div className="fw-bold" style={{ fontSize: '0.8rem' }}>{item.pontos}</div>
                    </div>
                ))}
            </div>

            {showClassificacao && (
                <ClassificacaoModal 
                    classificacao={classificacao} 
                    onClose={() => setShowClassificacao(false)} 
                />
            )}
        </div>
    );
};

export default ClassificacaoGeral;