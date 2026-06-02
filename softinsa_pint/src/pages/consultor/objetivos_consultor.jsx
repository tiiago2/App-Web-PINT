import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom';
import './objetivos_consultor.css';

/* ─────────────────────────────────────────────────────────────────────
   MOCK DATA — nomes dos campos exatamente como na base de dados
   Tabela Badges:    ID_Badge, Nome_Badge, ID_Area, Pontos_Badge, imagem
   Tabela Area:      ID_Area, Nome_Area, ID_Service_Line
   Tabela Objetivos: ID_Objetivo, ID_Badge, ID_Utilizador,
                     Data_inicial, Data_Objetivo,
                     Deleted_Objetivo, Data_Conclusao
   ───────────────────────────────────────────────────────────────────── */
const badgesMock = [
    { ID_Badge: 1,  Nome_Badge: 'Low Code',        ID_Area: 1, Nome_Area: 'Hybrid Systems',   Pontos_Badge: 100, corFundo: '#E8EBFB', corIcone: '#7B8FD4', icone: 'fi fi-br-coffee'          },
    { ID_Badge: 2,  Nome_Badge: 'Bases de Dados',  ID_Area: 1, Nome_Area: 'Hybrid Systems',   Pontos_Badge: 120, corFundo: '#E0F5EC', corIcone: '#2ECC71', icone: 'fi fi-br-database'        },
    { ID_Badge: 3,  Nome_Badge: 'Cloud DevOps',    ID_Area: 2, Nome_Area: 'Cloud & DevOps',   Pontos_Badge: 150, corFundo: '#E0EEF8', corIcone: '#5BAADD', icone: 'fi fi-br-cloud'           },
    { ID_Badge: 4,  Nome_Badge: 'Agile',           ID_Area: 1, Nome_Area: 'Hybrid Systems',   Pontos_Badge: 80,  corFundo: '#FEF5E0', corIcone: '#E6900A', icone: 'fi fi-br-target'          },
    { ID_Badge: 5,  Nome_Badge: 'React Native',    ID_Area: 3, Nome_Area: 'Mobile Solutions', Pontos_Badge: 130, corFundo: '#E8EBFB', corIcone: '#7B8FD4', icone: 'fi fi-br-mobile'          },
    { ID_Badge: 6,  Nome_Badge: 'Data & AI',       ID_Area: 4, Nome_Area: 'Data & AI',        Pontos_Badge: 200, corFundo: '#E0F5EC', corIcone: '#2ECC71', icone: 'fi fi-br-chart-histogram' },
    { ID_Badge: 7,  Nome_Badge: 'Kubernetes',      ID_Area: 2, Nome_Area: 'Cloud & DevOps',   Pontos_Badge: 170, corFundo: '#E0EEF8', corIcone: '#5BAADD', icone: 'fi fi-br-server'          },
    { ID_Badge: 8,  Nome_Badge: 'Cybersecurity',   ID_Area: 5, Nome_Area: 'Cybersecurity',    Pontos_Badge: 190, corFundo: '#F9E0E0', corIcone: '#E74C3C', icone: 'fi fi-br-shield'          },
    { ID_Badge: 9,  Nome_Badge: 'TypeScript',      ID_Area: 1, Nome_Area: 'Hybrid Systems',   Pontos_Badge: 110, corFundo: '#E8EBFB', corIcone: '#7B8FD4', icone: 'fi fi-br-code'           },
    { ID_Badge: 10, Nome_Badge: 'Machine Learning',ID_Area: 4, Nome_Area: 'Data & AI',        Pontos_Badge: 220, corFundo: '#E0F5EC', corIcone: '#2ECC71', icone: 'fi fi-br-brain'          },
    { ID_Badge: 11, Nome_Badge: 'Docker',          ID_Area: 2, Nome_Area: 'Cloud & DevOps',   Pontos_Badge: 140, corFundo: '#E0EEF8', corIcone: '#5BAADD', icone: 'fi fi-br-layers'         },
    { ID_Badge: 12, Nome_Badge: 'Ethical Hacking', ID_Area: 5, Nome_Area: 'Cybersecurity',    Pontos_Badge: 210, corFundo: '#F9E0E0', corIcone: '#E74C3C', icone: 'fi fi-br-trophy'         },
];

const objetivosMock = [
    { ID_Objetivo: 1, ID_Badge: 1, ID_Utilizador: 1, Data_inicial: '2026-01-01T00:00:00', Data_Objetivo: '2026-06-15T23:59:59', Deleted_Objetivo: 0, Data_Conclusao: null, progresso: 98, badge: badgesMock[0] },
    { ID_Objetivo: 2, ID_Badge: 2, ID_Utilizador: 1, Data_inicial: '2026-02-01T00:00:00', Data_Objetivo: '2026-06-28T23:59:59', Deleted_Objetivo: 0, Data_Conclusao: null, progresso: 57, badge: badgesMock[1] },
    { ID_Objetivo: 3, ID_Badge: 3, ID_Utilizador: 1, Data_inicial: '2026-03-01T00:00:00', Data_Objetivo: '2026-07-11T23:59:59', Deleted_Objetivo: 0, Data_Conclusao: null, progresso: 23, badge: badgesMock[2] },
    { ID_Objetivo: 4, ID_Badge: 4, ID_Utilizador: 1, Data_inicial: '2026-03-15T00:00:00', Data_Objetivo: '2026-07-11T23:59:59', Deleted_Objetivo: 0, Data_Conclusao: null, progresso: 11, badge: badgesMock[3] },
    { ID_Objetivo: 5, ID_Badge: 5, ID_Utilizador: 1, Data_inicial: '2026-04-01T00:00:00', Data_Objetivo: '2026-08-05T23:59:59', Deleted_Objetivo: 0, Data_Conclusao: null, progresso: 65, badge: badgesMock[4] },
];

/* ─────────────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────────────── */
const MESES_PT    = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

const formatarData = (str) => {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
};

const corProgresso = (pct) => {
    if (pct >= 70) return 'var(--aceitar)';
    if (pct >= 40) return '#E6900A';
    return 'var(--rejeitar)';
};

const mesmoDia = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth()    === d2.getMonth()    &&
    d1.getDate()     === d2.getDate();

const piorProgresso = (objs) => Math.min(...objs.map(o => o.progresso));

/* ─────────────────────────────────────────────────────────────────────
   COMPONENTE: CALENDÁRIO
   ───────────────────────────────────────────────────────────────────── */
const Calendario = ({ objetivos, diaSelecionado, onDiaClick }) => {
    const [mesVista,  setMesVista]  = useState(new Date());
    const [hoverInfo, setHoverInfo] = useState(null);

    const hoje = new Date();
    const ano  = mesVista.getFullYear();
    const mes  = mesVista.getMonth();

    const primeiroDia = new Date(ano, mes, 1).getDay();
    const diasNoMes   = new Date(ano, mes + 1, 0).getDate();

    // Constrói array de células: null para espaços vazios + números dos dias
    const celulas = [];
    for (let i = 0; i < primeiroDia; i++) celulas.push(null);
    for (let d = 1; d <= diasNoMes; d++) celulas.push(d);

    const getObjsDia = (dia) => {
        const alvo = new Date(ano, mes, dia);
        return objetivos.filter(o => mesmoDia(new Date(o.Data_Objetivo), alvo));
    };

    const handleClick = (dia) => {
        if (!dia) return;
        const objs = getObjsDia(dia);
        if (objs.length === 0) { onDiaClick(null); return; }
        const alvo = new Date(ano, mes, dia);
        // Clica no mesmo dia → remove filtro
        if (diaSelecionado && mesmoDia(diaSelecionado, alvo)) {
            onDiaClick(null);
        } else {
            onDiaClick(alvo);
        }
    };

    return (
        <div className="obj-cal">

            {/* ── Cabeçalho: navegação de mês ── */}
            <div className="obj-cal-header">
                <button className="obj-cal-nav" onClick={() => setMesVista(new Date(ano, mes - 1, 1))}>
                    <i className="fi fi-br-angle-left" />
                </button>
                <span className="obj-cal-titulo">{MESES_PT[mes]} {ano}</span>
                <button className="obj-cal-nav" onClick={() => setMesVista(new Date(ano, mes + 1, 1))}>
                    <i className="fi fi-br-angle-right" />
                </button>
            </div>

            {/* ── Nomes dos dias da semana ── */}
            <div className="obj-cal-nomes-row">
                {DIAS_SEMANA.map(d => (
                    <div key={d} className="obj-cal-dia-nome">{d}</div>
                ))}
            </div>

            {/* ── Grelha de dias ── */}
            <div className="obj-cal-days-grid">
                {celulas.map((dia, idx) => {
                    if (!dia) return <div key={`v-${idx}`} className="obj-cal-celula vazio" />;

                    const objs    = getObjsDia(dia);
                    const alvo    = new Date(ano, mes, dia);
                    const isHoje  = mesmoDia(hoje, alvo);
                    const isSel   = diaSelecionado && mesmoDia(diaSelecionado, alvo);
                    const temObjs = objs.length > 0;
                    const cor     = temObjs ? corProgresso(piorProgresso(objs)) : null;

                    return (
                        <div
                            key={dia}
                            className={[
                                'obj-cal-celula',
                                isHoje  ? 'hoje'        : '',
                                isSel   ? 'selecionado' : '',
                                temObjs ? 'tem-obj'     : '',
                            ].filter(Boolean).join(' ')}
                            onClick={() => handleClick(dia)}
                            onMouseEnter={(e) => {
                                if (!temObjs) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoverInfo({
                                    objs,
                                    dia,
                                    mesNome: MESES_PT[mes],
                                    top:  rect.bottom + 8,
                                    left: rect.left + rect.width / 2,
                                });
                            }}
                            onMouseLeave={() => setHoverInfo(null)}
                        >
                            <span
                                className="obj-cal-numero"
                                style={cor && !isSel ? { color: cor } : {}}
                            >
                                {dia}
                            </span>
                            {temObjs && !isSel && (
                                <span className="obj-cal-dot" style={{ backgroundColor: cor }} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Legenda de cores ── */}
            <div className="obj-cal-legenda">
                <div className="obj-cal-leg-item">
                    <span className="obj-cal-dot" style={{ backgroundColor: 'var(--aceitar)' }} />
                    <span>≥ 70%</span>
                </div>
                <div className="obj-cal-leg-item">
                    <span className="obj-cal-dot" style={{ backgroundColor: '#E6900A' }} />
                    <span>40–69%</span>
                </div>
                <div className="obj-cal-leg-item">
                    <span className="obj-cal-dot" style={{ backgroundColor: 'var(--rejeitar)' }} />
                    <span>&lt; 40%</span>
                </div>
                {diaSelecionado && (
                    <span className="obj-cal-leg-info">
                        <i className="fi fi-br-cursor-finger" style={{ fontSize: '11px' }} />
                        Clica no dia para remover filtro
                    </span>
                )}
            </div>

            {/* ── Popup de hover (portal) ── */}
            {hoverInfo && ReactDOM.createPortal(
                <div
                    className="obj-cal-popup"
                    style={{ top: hoverInfo.top, left: hoverInfo.left }}
                >
                    <div className="obj-cal-popup-titulo">
                        {hoverInfo.dia} de {hoverInfo.mesNome}
                    </div>
                    {hoverInfo.objs.map(o => (
                        <div key={o.ID_Objetivo} className="obj-cal-popup-item">
                            <i className={o.badge.icone} style={{ color: o.badge.corIcone, fontSize: '13px', flexShrink: 0 }} />
                            <span className="obj-cal-popup-nome">{o.badge.Nome_Badge}</span>
                            <span className="obj-cal-popup-pct" style={{ color: corProgresso(o.progresso) }}>
                                {o.progresso}%
                            </span>
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────────────
   COMPONENTE: DATE PICKER MODERNO
   ───────────────────────────────────────────────────────────────────── */
const DatePickerPopup = ({ value, onChange, min }) => {
    const [open,     setOpen]     = useState(false);
    const [mesVista, setMesVista] = useState(() => {
        if (value) return new Date(value + 'T00:00:00');
        return new Date();
    });
    const [popupPos, setPopupPos] = useState({ top: 0, left: 0, width: 0 });
    const inputRef = useRef(null);

    const hoje        = new Date();
    const minDate     = min   ? new Date(min   + 'T00:00:00') : null;
    const selectedDate = value ? new Date(value + 'T00:00:00') : null;

    const ano        = mesVista.getFullYear();
    const mes        = mesVista.getMonth();
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const diasNoMes  = new Date(ano, mes + 1, 0).getDate();

    const celulas = [];
    for (let i = 0; i < primeiroDia; i++) celulas.push(null);
    for (let d = 1; d <= diasNoMes; d++) celulas.push(d);

    const handleOpen = () => {
        const rect = inputRef.current.getBoundingClientRect();
        setPopupPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
        if (value) setMesVista(new Date(value + 'T00:00:00'));
        setOpen(true);
    };

    const handleDiaClick = (dia) => {
        const alvo = new Date(ano, mes, dia);
        if (minDate && alvo < minDate) return;
        const str = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        onChange(str);
        setOpen(false);
    };

    const handleHoje = () => {
        const t = hoje;
        if (minDate && t < minDate) return;
        const str = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
        onChange(str);
        setOpen(false);
    };

    // Fecha ao clicar fora
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (!e.target.closest('.obj-dp-popup') && !e.target.closest('.obj-dp-input')) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const formatDisplay = (str) => {
        const d = new Date(str + 'T00:00:00');
        return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    return (
        <>
            {/* Campo clicável */}
            <div
                ref={inputRef}
                className={`obj-dp-input${open ? ' aberto' : ''}${value ? ' tem-valor' : ''}`}
                onClick={handleOpen}
            >
                <span className={value ? 'obj-dp-valor' : 'obj-dp-placeholder'}>
                    {value ? formatDisplay(value) : 'Indique a data...'}
                </span>
                <div className="obj-dp-icons">
                    {value && (
                        <i
                            className="fi fi-br-cross-circle obj-dp-clear"
                            onClick={e => { e.stopPropagation(); onChange(''); }}
                            title="Limpar data"
                        />
                    )}
                    <i className="fi fi-br-calendar" />
                </div>
            </div>

            {/* Popup calendário (portal) */}
            {open && ReactDOM.createPortal(
                <div
                    className="obj-dp-popup"
                    style={{ top: popupPos.top, left: popupPos.left, minWidth: Math.max(popupPos.width, 290) }}
                >
                    {/* Cabeçalho de navegação */}
                    <div className="obj-dp-header">
                        <button className="obj-dp-nav" onClick={() => setMesVista(new Date(ano, mes - 1, 1))}>
                            <i className="fi fi-br-angle-left" />
                        </button>
                        <span className="obj-dp-mes-titulo">{MESES_PT[mes]} {ano}</span>
                        <button className="obj-dp-nav" onClick={() => setMesVista(new Date(ano, mes + 1, 1))}>
                            <i className="fi fi-br-angle-right" />
                        </button>
                    </div>

                    {/* Nomes dos dias */}
                    <div className="obj-dp-nomes">
                        {DIAS_SEMANA.map(d => <div key={d} className="obj-dp-dia-nome">{d}</div>)}
                    </div>

                    {/* Grelha de dias */}
                    <div className="obj-dp-grid">
                        {celulas.map((dia, idx) => {
                            if (!dia) return <div key={`v-${idx}`} />;
                            const alvo       = new Date(ano, mes, dia);
                            const isHoje     = mesmoDia(hoje, alvo);
                            const isSel      = selectedDate && mesmoDia(selectedDate, alvo);
                            const isDisabled = minDate && alvo < minDate;

                            return (
                                <div
                                    key={dia}
                                    className={[
                                        'obj-dp-dia',
                                        isHoje     ? 'hoje'       : '',
                                        isSel      ? 'selecionado': '',
                                        isDisabled ? 'desativado' : '',
                                    ].filter(Boolean).join(' ')}
                                    onClick={() => !isDisabled && handleDiaClick(dia)}
                                >
                                    {dia}
                                </div>
                            );
                        })}
                    </div>

                    {/* Rodapé: botão Hoje */}
                    <div className="obj-dp-footer">
                        <button className="obj-dp-btn-hoje" onClick={handleHoje}>Hoje</button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

/* ─────────────────────────────────────────────────────────────────────
   COMPONENTE: MODAL BADGE PICKER
   ───────────────────────────────────────────────────────────────────── */
const BadgePickerModal = ({ onClose, onConfirm }) => {
    const [search,   setSearch]   = useState('');
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const filtrados = badgesMock.filter(b =>
        b.Nome_Badge.toLowerCase().includes(search.toLowerCase()) ||
        b.Nome_Area.toLowerCase().includes(search.toLowerCase())
    );

    return ReactDOM.createPortal(
        <div className="obj-picker-overlay" onClick={onClose}>
            <div className="obj-picker-modal" onClick={e => e.stopPropagation()}>

                <div className="obj-picker-header">
                    <div className="obj-picker-title-row">
                        <span className="obj-picker-title">Escolha um Badge</span>
                        <button className="obj-btn-close" onClick={onClose} title="Fechar">
                            <i className="fi fi-br-cross" />
                        </button>
                    </div>
                    <div className="obj-picker-controls">
                        <button className="obj-picker-btn-ctrl">
                            <i className="fi fi-br-filter" /> Filtrar
                        </button>
                        <div className="obj-picker-search-wrap">
                            <i className="fi fi-br-search" style={{ color: '#aab7c4', fontSize: '13px', flexShrink: 0 }} />
                            <input
                                className="obj-picker-search-input"
                                placeholder="Pesquisar Badge..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <button className="obj-picker-btn-ctrl">
                            Mais recentes <i className="fi fi-br-sort" />
                        </button>
                    </div>
                </div>

                <div className="obj-picker-body">
                    {filtrados.length === 0 ? (
                        <div className="text-center text-muted py-5" style={{ fontSize: '14px' }}>
                            <i className="fi fi-br-search d-block mb-2" style={{ fontSize: '2rem', opacity: 0.3 }} />
                            Nenhum badge encontrado
                        </div>
                    ) : (
                        <div className="obj-badge-grid">
                            {filtrados.map(badge => (
                                <div
                                    key={badge.ID_Badge}
                                    className={`obj-badge-grid-card${selected?.ID_Badge === badge.ID_Badge ? ' selecionado' : ''}`}
                                    onClick={() => setSelected(badge)}
                                >
                                    <div className="obj-badge-grid-circle" style={{ background: badge.corFundo }}>
                                        <i className={badge.icone} style={{ color: badge.corIcone }} />
                                    </div>
                                    <div className="obj-badge-grid-nome">{badge.Nome_Badge}</div>
                                    <div className="obj-badge-grid-area">{badge.Nome_Area}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="obj-picker-footer">
                    <button className="obj-btn-historico">
                        <i className="fi fi-br-time-past" />
                        Ver Histórico
                    </button>
                    <button
                        className="obj-btn-confirmar"
                        disabled={!selected}
                        onClick={() => { onConfirm(selected); onClose(); }}
                    >
                        {selected ? `Confirmar — ${selected.Nome_Badge}` : 'Seleciona um badge'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

/* ─────────────────────────────────────────────────────────────────────
   PÁGINA PRINCIPAL — OBJETIVOS CONSULTOR
   ───────────────────────────────────────────────────────────────────── */
const ObjetivosConsultor = ({ user }) => {
    const navigate = useNavigate();

    const [badgeSelecionado, setBadgeSelecionado] = useState(null);
    const [data,             setData]             = useState('');
    const [showPicker,       setShowPicker]       = useState(false);
    const [objetivos,        setObjetivos]        = useState(objetivosMock);
    const [diaSelecionado,   setDiaSelecionado]   = useState(null);

    // Filtra lista pelo dia clicado no calendário (ou mostra todos)
    const objetivosFiltrados = diaSelecionado
        ? objetivos.filter(o => mesmoDia(new Date(o.Data_Objetivo), diaSelecionado))
        : objetivos;

    const handleSubmeter = (e) => {
        e.preventDefault();
        if (!badgeSelecionado || !data) return;

        const novo = {
            ID_Objetivo:      Date.now(),
            ID_Badge:         badgeSelecionado.ID_Badge,
            ID_Utilizador:    user?.id ?? 1,
            Data_inicial:     new Date().toISOString(),
            Data_Objetivo:    new Date(data).toISOString(),
            Deleted_Objetivo: 0,
            Data_Conclusao:   null,
            progresso:        0,
            badge:            badgeSelecionado,
        };
        setObjetivos(prev => [novo, ...prev]);
        setBadgeSelecionado(null);
        setData('');
        // Se houver filtro de dia ativo e o novo objetivo não é nesse dia, limpa filtro
        if (diaSelecionado && !mesmoDia(new Date(novo.Data_Objetivo), diaSelecionado)) {
            setDiaSelecionado(null);
        }
    };

    // Fase experimental: permite remover objetivos da lista
    const handleRemover = (id) => {
        setObjetivos(prev => prev.filter(o => o.ID_Objetivo !== id));
    };

    return (
        <div className="obj-page">

            {/* ══ FORMULÁRIO — PROPOR OBJETIVO ══════════════════════════ */}
            <div className="obj-form-card">
                <h1 className="texto-titulo-principal m-0">Propor Objetivos</h1>

                <form onSubmit={handleSubmeter}>
                    <div className="obj-form-grid">

                        {/* Campo: Título do Objetivo → abre badge picker */}
                        <div>
                            <label className="obj-form-label">Título do Objetivo</label>
                            <div
                                className={`obj-badge-picker${badgeSelecionado ? ' selecionado' : ''}`}
                                onClick={() => setShowPicker(true)}
                                title="Clique para escolher um badge"
                            >
                                {badgeSelecionado ? (
                                    <>
                                        <div className="obj-picker-mini-circle" style={{ background: badgeSelecionado.corFundo }}>
                                            <i className={badgeSelecionado.icone} style={{ color: badgeSelecionado.corIcone, fontSize: '0.9rem' }} />
                                        </div>
                                        <span style={{ fontSize: '14px', color: 'var(--fontes)', flex: 1 }}>
                                            {badgeSelecionado.Nome_Badge}
                                        </span>
                                        <i
                                            className="fi fi-br-cross-circle"
                                            style={{ color: '#aab7c4', fontSize: '13px', flexShrink: 0 }}
                                            onClick={e => { e.stopPropagation(); setBadgeSelecionado(null); }}
                                            title="Remover seleção"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <span style={{ fontSize: '14px', color: '#aab7c4', flex: 1 }}>Escolher badge...</span>
                                        <i className="fi fi-br-expand" style={{ color: '#aab7c4', fontSize: '13px', flexShrink: 0 }} />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Campo: Data Limite */}
                        <div>
                            <label className="obj-form-label">Data Limite Proposta</label>
                            <DatePickerPopup
                                value={data}
                                onChange={setData}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>

                    <div className="d-flex justify-content-end mt-3">
                        <button
                            type="submit"
                            className="obj-btn-submeter"
                            disabled={!badgeSelecionado || !data}
                        >
                            Submeter
                        </button>
                    </div>
                </form>
            </div>

            {/* ══ SECÇÃO INFERIOR: LISTA (esq) + CALENDÁRIO (dir) ══════ */}
            <div className="obj-bottom">

                {/* ── Painel esquerdo: lista de objetivos ── */}
                <div className="obj-lista-panel">
                    <div className="obj-painel-header">
                        <h2 className="obj-painel-titulo">
                            {diaSelecionado
                                ? `${diaSelecionado.getDate()} ${MESES_PT[diaSelecionado.getMonth()]}`
                                : 'Objetivos em progresso'
                            }
                            <span className="obj-painel-count"> ({objetivosFiltrados.length})</span>
                        </h2>
                        {diaSelecionado && (
                            <button className="obj-painel-voltar" onClick={() => setDiaSelecionado(null)}>
                                <i className="fi fi-br-cross" style={{ fontSize: '10px' }} />
                                Ver todos
                            </button>
                        )}
                    </div>

                    {/* Cards de objetivos */}
                    <div className="obj-lista-scroll">
                        {objetivosFiltrados.length === 0 ? (
                            <div className="obj-painel-vazio">
                                <i className="fi fi-br-calendar" />
                                <span>
                                    {diaSelecionado
                                        ? 'Nenhum objetivo expira neste dia.'
                                        : 'Ainda não tens objetivos em progresso.'
                                    }
                                </span>
                            </div>
                        ) : (
                            objetivosFiltrados.map(obj => {
                                const cor = corProgresso(obj.progresso);
                                return (
                                    <div key={obj.ID_Objetivo} className="obj-item-card">

                                        {/* Botão remover — fase experimental, retirar quando ligar à BD */}
                                        <button
                                            className="obj-item-remover"
                                            onClick={() => handleRemover(obj.ID_Objetivo)}
                                            title="Remover objetivo (fase experimental)"
                                        >
                                            <i className="fi fi-br-cross" />
                                        </button>

                                        {/*
                                         * TODO: Navegar para a página de detalhe do badge quando existir.
                                         * Substituir navigate('/') por navigate(`/badges/${obj.ID_Badge}`)
                                         * ou pela rota que o grupo definir para a página do badge.
                                         */}
                                        <button
                                            className="obj-badge-icon-btn"
                                            style={{ background: obj.badge.corFundo }}
                                            onClick={() => navigate('/')}
                                            title={`Ver badge: ${obj.badge.Nome_Badge}`}
                                        >
                                            <i className={obj.badge.icone} style={{ color: obj.badge.corIcone }} />
                                        </button>

                                        <div className="obj-item-info">
                                            <div className="obj-item-titulo">{obj.badge.Nome_Badge}</div>
                                            <div className="obj-item-area">{obj.badge.Nome_Area}</div>
                                            <div className="obj-progress-wrap">
                                                <div
                                                    className="obj-progress-fill"
                                                    style={{ width: `${obj.progresso}%`, backgroundColor: cor }}
                                                />
                                            </div>
                                        </div>

                                        <div className="obj-item-side">
                                            <div className="obj-prazo-label">
                                                <i className="fi fi-br-calendar" style={{ fontSize: '11px' }} />
                                                {formatarData(obj.Data_Objetivo)}
                                            </div>
                                            <div className="obj-estado-label" style={{ color: cor }}>
                                                <div className="obj-estado-dot" style={{ backgroundColor: cor }} />
                                                {obj.progresso}%
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ── Painel direito: calendário ── */}
                <div className="obj-cal-panel">
                    <Calendario
                        objetivos={objetivos}
                        diaSelecionado={diaSelecionado}
                        onDiaClick={setDiaSelecionado}
                    />
                </div>
            </div>

            {/* ══ MODAL BADGE PICKER ════════════════════════════════════ */}
            {showPicker && (
                <BadgePickerModal
                    onClose={() => setShowPicker(false)}
                    onConfirm={badge => setBadgeSelecionado(badge)}
                />
            )}
        </div>
    );
};

export default ObjetivosConsultor;
