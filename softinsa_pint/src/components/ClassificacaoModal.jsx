import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactDOM from 'react-dom';
import './ClassificacaoModal.css';
import user_logo from '../assets/utilizador.png';
import { mockClassificacao } from '../defs/classificacao_mock';

/* ── 1. COMPONENTE INTERNO: O MODAL ─────────────────────── */
const ClassificacaoModal = ({ 
    classificacao = mockClassificacao, 
    filtroInicial = null, 
    filtroValorInicial = null,
    onClose 
}) => {
    const { t } = useTranslation();

    const [filtrarOpen, setFiltrarOpen] = useState(false);
    const [semanaOpen, setSemanaOpen] = useState(false);
    
    // Manage active filters
    const [filtroSel, setFiltroSel] = useState(filtroInicial); // e.g. 'area', 'service_line', 'funcao'
    const [filtroValorSel, setFiltroValorSel] = useState(filtroValorInicial); // e.g. 'Hybrid Systems'
    const [subMenuActive, setSubMenuActive] = useState(null); // e.g. 'area', 'service_line', 'funcao'
    const [semanaSel, setSemanaSel] = useState('sempre'); // Default to Always/Sempre

    const filtrarRef = useRef(null);
    const semanaRef = useRef(null);

    // Reset sub-menu on close or toggle
    const toggleFiltrarOpen = () => {
        setFiltrarOpen(o => {
            if (o) setSubMenuActive(null);
            return !o;
        });
        setSemanaOpen(false);
    };

    useEffect(() => {
        const handler = (e) => {
            if (filtrarRef.current && !filtrarRef.current.contains(e.target)) {
                setFiltrarOpen(false);
                setSubMenuActive(null);
            }
            if (semanaRef.current && !semanaRef.current.contains(e.target)) setSemanaOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    // Extract unique values from the classification dataset dynamically
    const getUniqueValues = (categoryKey) => {
        // Map function column or standard columns
        const key = categoryKey === 'funcao' ? 'funcao' : categoryKey;
        return [...new Set(classificacao.map(u => u[key]).filter(Boolean))];
    };

    // Calculate leaderboard derived state directly during render
    const getListaOrdenada = () => {
        let dadosFiltrados = [...classificacao];

        // Apply dynamic sub-menu filters based on selected category AND selected value
        if (filtroSel && filtroValorSel) {
            if (filtroSel === 'area') {
                dadosFiltrados = dadosFiltrados.filter(u => u.area === filtroValorSel);
            } else if (filtroSel === 'service_line') {
                dadosFiltrados = dadosFiltrados.filter(u => u.service_line === filtroValorSel);
            } else if (filtroSel === 'funcao') {
                dadosFiltrados = dadosFiltrados.filter(u => u.funcao === filtroValorSel);
            }
        }

        // Sort by the points of the selected timeframe
        const pontosChave = `pontos_${semanaSel}`;
        dadosFiltrados.sort((a, b) => {
            const pontosA = a[pontosChave] || 0;
            const pontosB = b[pontosChave] || 0;
            return pontosB - pontosA;
        });

        // Re-assign ranks and podium properties dynamically
        const medalhasCores = ["#FFD700", "#C0C0C0", "#CD7F32"]; // Gold, Silver, Bronze
        const medalhasClasses = ["ouro", "prata", "bronze"];
        
        return dadosFiltrados.map((item, idx) => {
            const pos = idx + 1;
            const formattedPontos = (item[pontosChave] || 0).toLocaleString('pt-PT');
            return {
                ...item,
                pos,
                pontos: formattedPontos,
                cor: pos <= 3 ? medalhasCores[pos - 1] : undefined,
                classe: pos <= 3 ? medalhasClasses[pos - 1] : undefined
            };
        });
    };

    const listaOrdenada = getListaOrdenada();
    const filtrarOpcoes = ['area', 'service_line', 'funcao'];
    const semanaOpcoes = ['semana', 'mes', 'ano', 'sempre'];

    // Safely structure the podium: 2nd place (left), 1st place (center), 3rd place (right)
    const podio = [];
    if (listaOrdenada.length > 1 && listaOrdenada[1]) podio.push(listaOrdenada[1]);
    if (listaOrdenada.length > 0 && listaOrdenada[0]) podio.push(listaOrdenada[0]);
    if (listaOrdenada.length > 2 && listaOrdenada[2]) podio.push(listaOrdenada[2]);

    const lista = listaOrdenada.slice(3);

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
                        <button className={`classif-filtro-btn${filtrarOpen ? ' active' : ''}`} onClick={toggleFiltrarOpen}>
                            {filtroSel && filtroValorSel 
                                ? `${t(filtroSel)}: ${filtroSel === 'funcao' ? t(filtroValorSel) : filtroValorSel}` 
                                : t('filtrar')
                            } <i className="fi fi-br-filter" style={{ fontSize: '0.7rem' }}></i>
                        </button>
                        {filtrarOpen && (
                            <div className="classif-dropdown">
                                {subMenuActive === null ? (
                                    <>
                                        <div className="classif-dropdown-header">{t('filtrar_por')}</div>
                                        <div 
                                            className={`classif-dropdown-item${filtroSel === null ? ' selected' : ''}`} 
                                            onClick={() => { 
                                                setFiltroSel(null); 
                                                setFiltroValorSel(null);
                                                setFiltrarOpen(false); 
                                            }}
                                        >
                                            {t('todos')}
                                        </div>
                                        {filtrarOpcoes.map(op => (
                                            <div 
                                                key={op} 
                                                className={`classif-dropdown-item d-flex justify-content-between align-items-center${filtroSel === op ? ' selected' : ''}`} 
                                                onClick={() => setSubMenuActive(op)}
                                            >
                                                <span>{t(op)}</span>
                                                <i className="fi fi-br-angle-right" style={{ fontSize: '0.7rem', color: '#999' }}></i>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <>
                                        <div 
                                            className="classif-dropdown-header d-flex align-items-center gap-2" 
                                            style={{ cursor: 'pointer' }} 
                                            onClick={() => setSubMenuActive(null)}
                                            title="Voltar"
                                        >
                                            <i className="fi fi-br-angle-left" style={{ fontSize: '0.75rem' }}></i>
                                            <span>{t(subMenuActive)}</span>
                                        </div>
                                        {getUniqueValues(subMenuActive).map(val => (
                                            <div 
                                                key={val} 
                                                className={`classif-dropdown-item${filtroSel === subMenuActive && filtroValorSel === val ? ' selected' : ''}`} 
                                                onClick={() => { 
                                                    setFiltroSel(subMenuActive);
                                                    setFiltroValorSel(val);
                                                    setSubMenuActive(null);
                                                    setFiltrarOpen(false); 
                                                }}
                                            >
                                                {subMenuActive === 'funcao' ? t(val) : val}
                                            </div>
                                        ))}
                                    </>
                                )}
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

                {/* Podium view */}
                <div className="classif-podio">
                    {podio.map((item) => (
                        <div key={item.id} className={`classif-podio-card ${item.classe}`}>
                            <img src={user_logo} className="rounded-2 mb-2" width="48" height="48" alt="user" style={{ objectFit: 'cover' }} />
                            <div className="fw-medium" style={{ fontSize: '0.85rem' }}>{item.nome}</div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>{item.area}</div>
                            <div className="fw-semibold mt-1" style={{ fontSize: '0.9rem' }}>{item.pontos}</div>
                        </div>
                    ))}
                    {podio.length === 0 && (
                        <p className="text-center w-100 my-4 text-muted">Nenhum utilizador encontrado para este filtro.</p>
                    )}
                </div>

                {/* Leaderboard list view */}
                <div className="classif-lista">
                    {lista.map((item) => (
                        <div key={item.id} className="d-flex align-items-center justify-content-between p-2 mb-2" style={{ border: '1px solid #CAD5E2', borderRadius: '12px' }}>
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


/* ── 2. COMPONENTE EXPORTADO: O WIDGET DA HOMEPAGE ────────── */
const ClassificacaoGeral = ({ 
    classificacao = mockClassificacao, 
    user, 
    filtroInicial = null, 
    filtroValorInicial = null,
    titulo 
}) => {
    const { t } = useTranslation();
    const [showClassificacao, setShowClassificacao] = useState(false);

    // Resolve what the initial filter value should be
    const getResolvedFilterValue = () => {
        if (filtroValorInicial) return filtroValorInicial;
        if (filtroInicial === 'area') return user?.area;
        if (filtroInicial === 'service_line') return user?.service_line;
        if (filtroInicial === 'funcao') return user?.cargo;
        return null;
    };

    const valorFiltro = getResolvedFilterValue();

    // Sort/Filter preview list based on the widget setup during render
    const getListaOrdenada = () => {
        let dadosFiltrados = [...classificacao];

        if (filtroInicial && valorFiltro) {
            if (filtroInicial === 'area') {
                dadosFiltrados = dadosFiltrados.filter(u => u.area === valorFiltro);
            } else if (filtroInicial === 'service_line') {
                dadosFiltrados = dadosFiltrados.filter(u => u.service_line === valorFiltro);
            } else if (filtroInicial === 'funcao') {
                dadosFiltrados = dadosFiltrados.filter(u => u.funcao === valorFiltro);
            }
        }

        // Always sort by pontos_sempre (All-time points) in the preview
        dadosFiltrados.sort((a, b) => (b.pontos_sempre || 0) - (a.pontos_sempre || 0));

        return dadosFiltrados.map((item, idx) => {
            const pos = idx + 1;
            const formattedPontos = (item.pontos_sempre || 0).toLocaleString('pt-PT');
            return {
                ...item,
                pos,
                pontos: formattedPontos,
                cor: pos === 1 ? "#FFD700" : pos === 2 ? "#C0C0C0" : pos === 3 ? "#CD7F32" : undefined,
                classe: pos === 1 ? "ouro" : pos === 2 ? "prata" : pos === 3 ? "bronze" : undefined
            };
        });
    };

    const listaOrdenada = getListaOrdenada();

    if (!listaOrdenada || listaOrdenada.length === 0) return null;

    return (
        <div className="p-3 d-flex flex-column bg-white" style={{ border: 'var(--borda-principal) solid var(--contorno)', borderRadius: 'var(--border-radius-grande)', boxSizing: 'border-box', height: fullHeight ? '100%' : '35vh' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h5>{titulo || t('classificacao_geral')}</h5>
                <i className="fi fi-br-expand me-1" style={{ cursor: 'pointer' }} onClick={() => setShowClassificacao(true)}></i>
            </div>

            <div className="d-flex flex-column gap-2 flex-grow-1 overflow-y-auto pe-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`.overflow-y-auto::-webkit-scrollbar { display: none; }`}</style>
                {classificacao.slice(0, maxItems).map((item, index) => (
                    <div key={index} className={`ranking-row ${item.classe || ''}`}>
                        <div className="d-flex align-items-center gap-2">
                            {item.pos <= 3 ? (
                                <i className="fi fi-br-badge" style={{ color: item.cor, fontSize: '1.2rem', minWidth: '22px' }}></i>
                            ) : (
                                <span className="fw-semibold text-muted" style={{ minWidth: '22px', fontSize: '0.82rem' }}>{item.pos}.</span>
                            )}
                            <img src={user_logo} className="rounded-2" width="28" height="28" alt="user" style={{ objectFit: 'cover' }} />
                            <div>
                                <div className="fw-medium" style={{ fontSize: '0.8rem'}}>{item.Nome_User || item.nome}</div>
                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>{item.Nome_Area || item.area}</div>
                            </div>
                        </div>
                        <div className="fw-bold" style={{ fontSize: '0.8rem' }}>{item.Pontos_Totais || item.pontos}</div>
                    </div>
                ))}
            </div>

            {showClassificacao && (
                <ClassificacaoModal 
                    classificacao={classificacao} 
                    user={user}
                    filtroInicial={filtroInicial}
                    filtroValorInicial={valorFiltro}
                    onClose={() => setShowClassificacao(false)} 
                />
            )}
        </div>
    );
};

export default ClassificacaoGeral;