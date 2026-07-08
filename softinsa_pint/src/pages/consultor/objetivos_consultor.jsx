import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom';
import BadgeCirculo from '../../components/Galeria/BadgeCirculo/BadgeCirculo';
import SeletorAbas from '../../components/ui/SeletorAbas/SeletorAbas_Galeria';
import BotaoDropdown from '../../components/ui/BotaoDropdown/BotaoDropdown';
import GaleriaFiltroDropdown from '../../components/Galeria/GaleriaFiltroDropdown/GaleriaFiltroDropdown';
import ModalConfirmacao from '../../components/ui/ModalConfirmacao/ModalConfirmacao';
import BadgeDetalheModal from '../../components/BadgeDetalhe/BadgeDetalheModal';
import {
    obterBadgeDetalheConsultor,
    anexarRequisitoAoBadge,
    submeterCandidaturaBadge,
    obterUrlPublicaDoBadge,
    obterUrlPartilhaLinkedInDoBadge
} from '../../services/badgeDetalheService';
import { verificarPermissaoPartilhaLinkedIn } from '../../services/permissoesService';
import { obterObjetivosConsultor, criarObjetivoConsultor, obterBadgesParaPropor, removerObjetivoConsultor } from '../../services/objetivosService';
import './objetivos_consultor.css';

/* ── Imagens de badges (mock — na BD vêm da API) ── */
import badgeImg1 from '../../assets/badges/Low Code.png';
import badgeImg2 from '../../assets/badges/Low Code 2.png';
import badgeImg3 from '../../assets/badges/Low Code 3.png';
import badgeImg4 from '../../assets/badges/Low Code 4.png';
import badgeImg5 from '../../assets/badges/Low Code 5.png';

/* ─────────────────────────────────────────────────────────────────────
   MOCK DATA — nomes dos campos exatamente como na base de dados
   Tabela Badges:    ID_Badge, Nome_Badge, ID_Area, Pontos_Badge, imagem
   Tabela Area:      ID_Area, Nome_Area, ID_Service_Line
   Tabela Objetivos: ID_Objetivo, ID_Badge, ID_Utilizador,
                     Data_inicial, Data_Objetivo,
                     Deleted_Objetivo, Data_Conclusao
   ───────────────────────────────────────────────────────────────────── */


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

const corObjetivo = (obj) => {
    const isConcluido = obj.progresso === 100 || obj.Data_Conclusao !== null;
    const isExpirado = new Date(obj.Data_Objetivo) < new Date() && !isConcluido;
    if (isConcluido) return 'var(--aceitar)';
    if (isExpirado) return 'var(--rejeitar)';
    return 'var(--progresso)'; // amarelo em progresso
};

const mesmoDia = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth()    === d2.getMonth()    &&
    d1.getDate()     === d2.getDate();

const corAgrupada = (objs) => {
    if (objs.some(o => corObjetivo(o) === 'var(--rejeitar)')) return 'var(--rejeitar)';
    if (objs.some(o => corObjetivo(o) === 'var(--progresso)')) return 'var(--progresso)';
    return 'var(--aceitar)';
};

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
        const alvo = new Date(ano, mes, dia);
        const objs = getObjsDia(dia);
        const hojeLimpo = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        const isFuturo = alvo >= hojeLimpo;

        if (objs.length === 0 && !isFuturo) {
            onDiaClick(null); 
            return; 
        }

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
                    const cor     = temObjs ? corAgrupada(objs) : null;
                    const hojeLimpo = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
                    const isFuturo = alvo >= hojeLimpo;

                    return (
                        <div
                            key={dia}
                            className={[
                                'obj-cal-celula',
                                isHoje  ? 'hoje'        : '',
                                isSel   ? 'selecionado' : '',
                                temObjs ? 'tem-obj'     : '',
                                (!temObjs && isFuturo) ? 'clicavel-futuro' : ''
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
                    <span className="obj-cal-dot" style={{ backgroundColor: 'var(--progresso)' }} />
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
                            <span className="obj-cal-popup-pct" style={{ color: corObjetivo(o) }}>
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
        const popupWidth = 260;
        const maxLeft = window.innerWidth - popupWidth - 12;
        setPopupPos({ top: rect.bottom + 6, left: Math.min(rect.left, maxLeft), width: rect.width });
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
                    style={{ top: popupPos.top, left: popupPos.left, minWidth: popupPos.width }}
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
    const [listaBadges, setListaBadges] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [search,    setSearch]    = useState('');
    const [selected,  setSelected]  = useState(null);
    const [ordenacao, setOrdenacao] = useState('recentes');
    const [filtro,    setFiltro]    = useState({
        tipo: 'todos',
        valor: '',
        label: 'Todos'
    });

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        let active = true;

        obterBadgesParaPropor()
            .then(badges => {
                if (active) {
                    if (badges && badges.length > 0) {
                        setListaBadges(badges);
                    } else {
                        setListaBadges([]);
                    }
                }
            })
            .catch(err => {
                console.error("Erro ao carregar badges:", err);
                if (active) setListaBadges([]);
            })
            .finally(() => {
                if (active) setCarregando(false);
            });

        return () => {
            active = false;
            document.body.style.overflow = '';
        };
    }, []);

    // Obter opções únicas para cada filtro a partir dos badges reais da BD
    const opcoesFiltro = {
        learningPath: Array.from(new Set(listaBadges.map(b => b.Nome_Learning_Path || b.nome_learning_path).filter(Boolean))).map(lp => ({
            valor: lp,
            label: lp
        })),
        serviceLine: Array.from(new Set(listaBadges.map(b => b.Nome_Service_Line || b.nome_service_line).filter(Boolean))).map(sl => ({
            valor: sl,
            label: sl
        })),
        area: Array.from(new Set(listaBadges.map(b => b.Nome_Area || b.nome_area).filter(Boolean))).map(area => ({
            valor: area,
            label: area
        }))
    };

    const opcoesOrdenacao = [
        { valor: "recentes", label: "Mais recentes" },
        { valor: "antigos", label: "Mais antigos" },
        { valor: "az", label: "A-Z" },
        { valor: "za", label: "Z-A" },
    ];

    const filtrados = listaBadges
        .filter(b => {
            const nomeBadge = b.Nome_Badge || b.nome_badge || '';
            const nomeArea = b.Nome_Area || b.nome_area || '';
            const nomeSL = b.Nome_Service_Line || b.nome_service_line || '';
            const nomeLP = b.Nome_Learning_Path || b.nome_learning_path || '';

            const matchesSearch = nomeBadge.toLowerCase().includes(search.toLowerCase()) ||
                                  nomeArea.toLowerCase().includes(search.toLowerCase()) ||
                                  nomeSL.toLowerCase().includes(search.toLowerCase()) ||
                                  nomeLP.toLowerCase().includes(search.toLowerCase());
            
            const matchesFiltro = filtro.tipo === "todos" || 
                                  (filtro.tipo === "area" && nomeArea === filtro.valor) ||
                                  (filtro.tipo === "serviceLine" && nomeSL === filtro.valor) ||
                                  (filtro.tipo === "learningPath" && nomeLP === filtro.valor);
            
            return matchesSearch && matchesFiltro;
        })
        .sort((a, b) => {
            if (ordenacao === "az") {
                return a.Nome_Badge.localeCompare(b.Nome_Badge);
            }
            if (ordenacao === "za") {
                return b.Nome_Badge.localeCompare(a.Nome_Badge);
            }
            if (ordenacao === "antigos") {
                return a.ID_Badge - b.ID_Badge;
            }
            // default 'recentes'
            return b.ID_Badge - a.ID_Badge;
        });

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
                        <div className="obj-picker-actions-row">
                            <GaleriaFiltroDropdown
                                valor={filtro}
                                opcoes={opcoesFiltro}
                                onChange={setFiltro}
                            />
                            <BotaoDropdown
                                titulo="Ordenar por"
                                valor={ordenacao}
                                opcoes={opcoesOrdenacao}
                                onChange={setOrdenacao}
                            />
                        </div>
                    </div>
                </div>

                <div className="obj-picker-body">
                    {carregando ? (
                        <div className="text-center text-muted py-5" style={{ fontSize: '14px' }}>
                            <div className="spinner-border text-primary mb-2" role="status" style={{ width: '2rem', height: '2rem' }}>
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <div className="d-block">A carregar badges da base de dados...</div>
                        </div>
                    ) : filtrados.length === 0 ? (
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
                                    <div className="obj-badge-grid-circle-wrap">
                                        <BadgeCirculo
                                            imagemBadge={badge.imagemBadge || null}
                                            icone={badge.icone}
                                            nomeBadge={badge.Nome_Badge}
                                        />
                                    </div>
                                    <div className="obj-badge-grid-nome">{badge.Nome_Badge}</div>
                                    <div className="obj-badge-grid-area">
                                        {badge.Nome_Area}
                                        {` • ${badge.Nome_Service_Line || 'Sem Service Line'}`}
                                        {` • ${badge.Nome_Learning_Path || 'Sem Learning Path'}`}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="obj-picker-footer">
                    <button className="obj-btn-cancelar" onClick={onClose}>
                        Cancelar
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

function obterIdBadge(badge = {}) {
    return badge.id_badge ?? badge.idBadge ?? badge.id ?? badge.ID_Badge;
}

/* ─────────────────────────────────────────────────────────────────────
   PÁGINA PRINCIPAL — OBJETIVOS CONSULTOR
   ───────────────────────────────────────────────────────────────────── */
const ObjetivosConsultor = ({ user }) => {
    const navigate = useNavigate();

    const [badgeSelecionado, setBadgeSelecionado] = useState(null);
    const [data,             setData]             = useState('');
    const [showPicker,       setShowPicker]       = useState(false);
    const [objetivos,        setObjetivos]        = useState([]);
    const [isLoadingObjetivos, setIsLoadingObjetivos] = useState(true);
    const [erroAPIObjetivos, setErroAPIObjetivos] = useState(null);
    const [diaSelecionado,   setDiaSelecionado]   = useState(null);
    const [viewMode,         setViewMode]         = useState('progresso');
    const [historicoFiltro,  setHistoricoFiltro]  = useState('todos'); // 'todos' | 'concluidos' | 'expirados'
    const [objetivoParaRemover, setObjetivoParaRemover] = useState(null);

    const [isDetalheBadgeOpen, setIsDetalheBadgeOpen] = useState(false);
    const [detalheBadge, setDetalheBadge] = useState(null);
    const [isLoadingDetalheBadge, setIsLoadingDetalheBadge] = useState(false);
    const [anexoPendente, setAnexoPendente] = useState(null);
    const [avisoPermissaoLinkedIn, setAvisoPermissaoLinkedIn] = useState(false);

    const carregarObjetivosAPI = async () => {
        setIsLoadingObjetivos(true);
        setErroAPIObjetivos(null);
        try {
            const dados = await obterObjetivosConsultor();
            setObjetivos(dados);
        } catch (error) {
            console.error("Erro ao carregar objetivos da API:", error);
            setErroAPIObjetivos("Não foi possível carregar os teus objetivos.");
        } finally {
            setIsLoadingObjetivos(false);
        }
    };

    useEffect(() => {
        carregarObjetivosAPI();
    }, []);

    // Filtra lista pelo dia clicado no calendário e pelo separador ativo
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const objetivosFiltrados = objetivos.filter(obj => {
        const dataLimite = new Date(obj.Data_Objetivo);
        const isConcluido = obj.progresso === 100 || obj.Data_Conclusao !== null;
        const isExpirado = dataLimite < hoje && !isConcluido;
        const isHistorico = isConcluido || isExpirado;
        if (viewMode === 'historico') {
            if (!isHistorico) return false;
            if (historicoFiltro === 'concluidos' && !isConcluido) return false;
            if (historicoFiltro === 'expirados' && !isExpirado) return false;
            if (diaSelecionado && !mesmoDia(dataLimite, diaSelecionado)) return false;
            return true; // 'todos'
        } else {
            if (isHistorico) return false; // Em progresso

            if (diaSelecionado) {
                return mesmoDia(dataLimite, diaSelecionado);
            }
            return true;
        }
    });

    const handleSubmeter = async (e) => {
        e.preventDefault();
        if (!badgeSelecionado || !data) return;

        const idBadge = obterIdBadge(badgeSelecionado);
        if (!idBadge) return;

        try {
            const novoObj = await criarObjetivoConsultor({
                idBadge,
                dataFinal: new Date(data).toISOString()
            });

            setObjetivos(prev => [novoObj, ...prev]);
            setBadgeSelecionado(null);
            setData('');

            if (diaSelecionado && !mesmoDia(new Date(novoObj.Data_Objetivo), diaSelecionado)) {
                setDiaSelecionado(null);
            }
        } catch (error) {
            console.error("Erro ao criar objetivo:", error);
            alert("Não foi possível propor o objetivo. Garante que o badge selecionado existe no sistema.");
        }
    };

    // Fase experimental: abre modal de confirmação para remover objetivo da lista
    const handleRemover = (id) => {
        setObjetivoParaRemover(id);
    };

    const executarRemover = async (id) => {
        try {
            await removerObjetivoConsultor(id);
            setObjetivos(prev => prev.filter(o => o.ID_Objetivo !== id));
            if (diaSelecionado) {
                const restantes = objetivos.filter(o => o.ID_Objetivo !== id);
                const dataLim = objetivos.find(o => o.ID_Objetivo === id)?.Data_Objetivo;
                if (dataLim) {
                    const restDia = restantes.filter(o => mesmoDia(new Date(o.Data_Objetivo), new Date(dataLim)));
                    if (restDia.length === 0) setDiaSelecionado(null);
                }
            }
        } catch (error) {
            console.error("Erro ao remover objetivo:", error);
            alert("Não foi possível remover o objetivo. Tenta novamente.");
        } finally {
            setObjetivoParaRemover(null);
        }
    };

    // Modal de Detalhes do Badge
    const handleOpenDetalheBadgeConsultor = async (badgeId, badgeObj = null) => {
        if (!badgeId) {
            return;
        }

        setIsDetalheBadgeOpen(true);
        setDetalheBadge(null);
        setIsLoadingDetalheBadge(true);

        try {
            const detalhe = await obterBadgeDetalheConsultor(badgeId, { badgeData: badgeObj });
            setDetalheBadge(detalhe);
        } catch (error) {
            console.error("Erro ao carregar detalhe do badge:", error);
            setDetalheBadge(null);
        } finally {
            setIsLoadingDetalheBadge(false);
        }
    };

    const handleCloseDetalheBadge = () => {
        setIsDetalheBadgeOpen(false);
        setDetalheBadge(null);
        setAnexoPendente(null);
    };

    const handleSelecionarFicheiroRequisito = ({ requisito, ficheiro }) => {
        setAnexoPendente({
            requisito,
            ficheiro,
        });
    };

    const handleConfirmarAnexoRequisito = async () => {
        if (!anexoPendente || !detalheBadge) {
            return;
        }

        const idBadge = obterIdBadge(detalheBadge);
        const idRequisito =
            anexoPendente.requisito.id_requisito ??
            anexoPendente.requisito.idRequisito ??
            anexoPendente.requisito.id;

        if (!idBadge || !idRequisito) {
            return;
        }

        setIsLoadingDetalheBadge(true);

        try {
            const detalheAtualizado = await anexarRequisitoAoBadge({
                idBadge,
                idRequisito,
                ficheiro: anexoPendente.ficheiro,
            });

            setDetalheBadge(detalheAtualizado);
            setObjetivos((prev) =>
                prev.map((o) => {
                    if (Number(o.ID_Badge) === Number(idBadge)) {
                        return {
                            ...o,
                            progresso: detalheAtualizado.progresso,
                            Data_Conclusao: detalheAtualizado.progresso === 100 ? new Date().toISOString() : o.Data_Conclusao
                        };
                    }
                    return o;
                })
            );
        } catch (error) {
            console.error("Erro ao anexar requisito:", error);
            alert("Não foi possível anexar o requisito.");
        } finally {
            setIsLoadingDetalheBadge(false);
            setAnexoPendente(null);
        }
    };

    const handleSubmeterCandidatura = async (badgeDetalhe) => {
        const idBadge = obterIdBadge(badgeDetalhe);

        if (!idBadge) {
            return;
        }

        setIsLoadingDetalheBadge(true);

        try {
            const detalheAtualizado = await submeterCandidaturaBadge(idBadge);
            setDetalheBadge(detalheAtualizado);
            
            setObjetivos((prev) =>
                prev.map((o) => {
                    if (Number(o.ID_Badge) === Number(idBadge)) {
                        return {
                            ...o,
                            progresso: detalheAtualizado.progresso,
                            Data_Conclusao: detalheAtualizado.progresso === 100 ? new Date().toISOString() : o.Data_Conclusao
                        };
                    }
                    return o;
                })
            );
        } catch (error) {
            console.error("Erro ao submeter candidatura:", error);
            alert("Não foi possível submeter a candidatura.");
        } finally {
            setIsLoadingDetalheBadge(false);
        }
    };

    const handleVerPaginaPublicaBadge = (badgeDetalhe) => {
        const idBadge = obterIdBadge(badgeDetalhe);
        if (!idBadge) return;
        const urlPublica = badgeDetalhe?.urlPublica ?? obterUrlPublicaDoBadge(idBadge);
        window.open(urlPublica, "_blank", "noopener,noreferrer");
    };

    const handleCopiarLinkPublicoBadge = async (badgeDetalhe) => {
        const idBadge = obterIdBadge(badgeDetalhe);
        if (!idBadge) return;
        const urlPublica = badgeDetalhe?.urlPublica ?? obterUrlPublicaDoBadge(idBadge);
        const urlAbsoluta = `${window.location.origin}${urlPublica}`;
        try {
            await navigator.clipboard.writeText(urlAbsoluta);
            alert("Link público copiado.");
        } catch (error) {
            console.error("Erro ao copiar link público:", error);
            window.prompt("Copia o link público:", urlAbsoluta);
        }
    };

    const handlePartilharLinkedIn = async (badgeDetalhe) => {
        const idBadge = obterIdBadge(badgeDetalhe);
        if (!idBadge) return;
        const temPermissao = await verificarPermissaoPartilhaLinkedIn();
        if (!temPermissao) {
            setAvisoPermissaoLinkedIn(true);
            return;
        }
        const urlLinkedIn = obterUrlPartilhaLinkedInDoBadge(idBadge);
        window.open(urlLinkedIn, "_blank", "noopener,noreferrer");
    };

    // Quando clica num dia no calendário
    const handleDiaClick = (dia) => {
        setDiaSelecionado(dia);
        if (!dia) return;

        // Verifica se há apenas objetivos de um tipo nesse dia para auto-switch da tab
        const objsNesteDia = objetivos.filter(o => mesmoDia(new Date(o.Data_Objetivo), dia));
        
        if (objsNesteDia.length === 0) {
            const hojeLimpo = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
            if (dia >= hojeLimpo) {
                const yyyy = dia.getFullYear();
                const mm = String(dia.getMonth() + 1).padStart(2, '0');
                const dd = String(dia.getDate()).padStart(2, '0');
                setData(`${yyyy}-${mm}-${dd}`);
            }
            return;
        }

        let temProgresso = false;
        let temHistorico = false;

        objsNesteDia.forEach(o => {
            const isConcluido = o.progresso === 100 || o.Data_Conclusao !== null;
            const isExpirado = new Date(o.Data_Objetivo) < hoje && !isConcluido;
            if (isConcluido || isExpirado) temHistorico = true;
            else temProgresso = true;
        });

        if (viewMode === 'progresso' && !temProgresso && temHistorico) {
            setViewMode('historico');
            setHistoricoFiltro('todos');
        } else if (viewMode === 'historico' && !temHistorico && temProgresso) {
            setViewMode('progresso');
        }
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
                                        <div className="obj-picker-mini-wrap">
                                            <BadgeCirculo
                                                imagemBadge={badgeSelecionado.imagemBadge || null}
                                                icone={badgeSelecionado.icone}
                                                nomeBadge={badgeSelecionado.Nome_Badge}
                                            />
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
                        <div className="obj-tabs-container">
                            <SeletorAbas
                                opcoes={[
                                    { valor: "progresso", label: "Em progresso" },
                                    { valor: "historico", label: "Histórico" }
                                ]}
                                valorAtivo={viewMode}
                                onChange={(val) => {
                                    setViewMode(val);
                                    setDiaSelecionado(null);
                                }}
                            />
                        </div>
                        
                        {viewMode === 'progresso' && diaSelecionado && (
                            <button className="obj-painel-voltar" onClick={() => setDiaSelecionado(null)}>
                                <i className="fi fi-br-cross" style={{ fontSize: '10px' }} />
                                Ver todos
                            </button>
                        )}
                        {viewMode === 'progresso' && !diaSelecionado && (
                            <span className="obj-painel-count">({objetivosFiltrados.length})</span>
                        )}
                        {viewMode === 'historico' && (
                            <span className="obj-painel-count">({objetivosFiltrados.length})</span>
                        )}
                    </div>

                    {viewMode === 'historico' && (
                        <div className="obj-historico-submenu fade-in">
                            <button 
                                className={`obj-sub-btn ${historicoFiltro === 'todos' ? 'active' : ''}`}
                                onClick={() => setHistoricoFiltro('todos')}
                            >
                                Todos
                            </button>
                            <button 
                                className={`obj-sub-btn ${historicoFiltro === 'concluidos' ? 'active' : ''}`}
                                onClick={() => setHistoricoFiltro('concluidos')}
                            >
                                Concluídos
                            </button>
                            <button 
                                className={`obj-sub-btn ${historicoFiltro === 'expirados' ? 'active' : ''}`}
                                onClick={() => setHistoricoFiltro('expirados')}
                            >
                                Expirados
                            </button>
                        </div>
                    )}

                    {/* Cards de objetivos */}
                    <div className="obj-lista-scroll">
                        {isLoadingObjetivos ? (
                            <div className="obj-painel-vazio fade-in">
                                <div className="spinner-border text-primary mb-2" role="status" style={{ width: '2rem', height: '2rem' }}>
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <span>A carregar os teus objetivos...</span>
                            </div>
                        ) : erroAPIObjetivos ? (
                            <div className="obj-painel-vazio fade-in">
                                <i className="fi fi-br-exclamation" style={{ color: '#e74c3c' }} />
                                <span>{erroAPIObjetivos}</span>
                                <button
                                    type="button"
                                    className="obj-btn-propor mt-2"
                                    style={{ padding: '6px 16px', fontSize: '12px' }}
                                    onClick={carregarObjetivosAPI}
                                >
                                    Tentar novamente
                                </button>
                            </div>
                        ) : objetivosFiltrados.length === 0 ? (
                            <div className="obj-painel-vazio fade-in">
                                <i className={viewMode === 'historico' ? "fi fi-br-time-past" : "fi fi-br-calendar"} />
                                <span>
                                    {viewMode === 'historico' 
                                        ? 'Ainda não tens histórico de objetivos.'
                                        : diaSelecionado
                                            ? 'Nenhum objetivo expira neste dia.'
                                            : 'Ainda não tens objetivos em progresso.'
                                    }
                                </span>
                            </div>
                        ) : (
                            objetivosFiltrados.map(obj => {
                                const cor = corObjetivo(obj);
                                const isConcluido = obj.progresso === 100 || obj.Data_Conclusao;
                                const isExpirado = new Date(obj.Data_Objetivo) < new Date() && !isConcluido;

                                return (
                                    <div key={obj.ID_Objetivo} className="obj-item-card fade-in">
                                        <div className="obj-item-main-row">
                                            {/* Botão remover — só para progresso */}
                                            {viewMode === 'progresso' && (
                                                <button
                                                    className="obj-item-remover"
                                                    onClick={() => handleRemover(obj.ID_Objetivo)}
                                                    title="Remover objetivo (fase experimental)"
                                                >
                                                    <i className="fi fi-br-cross" />
                                                </button>
                                            )}

                                            <button
                                                className="obj-badge-icon-btn"
                                                onClick={() => navigate('/')}
                                                title={`Ver badge: ${obj.badge.Nome_Badge}`}
                                            >
                                                <BadgeCirculo
                                                    imagemBadge={obj.badge.imagemBadge || null}
                                                    icone={obj.badge.icone}
                                                    nomeBadge={obj.badge.Nome_Badge}
                                                />
                                            </button>

                                            <div className="obj-item-info">
                                                <div className="obj-item-titulo">{obj.badge.Nome_Badge}</div>
                                                <div className="obj-item-area">
                                                    {obj.badge.Nome_Area}
                                                    {` • ${obj.badge.Nome_Service_Line || 'Sem Service Line'}`}
                                                    {` • ${obj.badge.Nome_Learning_Path || 'Sem Learning Path'}`}
                                                </div>
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
                                                    {isConcluido ? 'Concluído' : (isExpirado ? 'Expirado' : `${obj.progresso}%`)}
                                                </div>
                                            </div>
                                        </div>

                                        {viewMode === 'progresso' && (
                                            <div className="obj-item-expansor">
                                                <div className="obj-item-expansor-inner">
                                                    <div className="obj-item-divider" />
                                                    <div className="obj-item-expansor-content">
                                                        <div className="obj-item-descricao-wrap">
                                                            <span className="obj-item-descricao-titulo">Sobre este badge</span>
                                                            <p className="obj-item-descricao-texto">
                                                                {obj.badge.descricao || obj.badge.Descricao_Badge || "Desenvolva esta competência realizando as submissões e provas necessárias para obter esta certificação."}
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="card-badge-sugerido-botao card-badge-sugerido-botao-primario obj-btn-continuar-hover"
                                                            onClick={() => handleOpenDetalheBadgeConsultor(obterIdBadge(obj.badge), obj.badge)}
                                                            title={`Continuar progresso de: ${obj.badge.Nome_Badge ?? obj.badge.nome_badge ?? 'Badge'}`}
                                                        >
                                                            Continuar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
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
                        onDiaClick={handleDiaClick}
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

            {/* ══ MODAL CONFIRMAÇÃO DE REMOÇÃO ═══════════════════════════ */}
            <ModalConfirmacao
                isOpen={!!objetivoParaRemover}
                onClose={() => setObjetivoParaRemover(null)}
                onConfirm={() => {
                    if (objetivoParaRemover) {
                        executarRemover(objetivoParaRemover);
                    }
                }}
                titulo="Remover Objetivo"
                mensagem="Tens a certeza que desejas remover este objetivo? Esta ação não poderá ser revertida."
                textoConfirmar="Remover"
                textoCancelar="Cancelar"
                isDanger={true}
            />

            {/* ══ MODAL DETALHE DO BADGE ════════════════════════════════ */}
            <BadgeDetalheModal
                isOpen={isDetalheBadgeOpen}
                onClose={handleCloseDetalheBadge}
                modo="consultor"
                detalhe={detalheBadge}
                isLoading={isLoadingDetalheBadge}
                onSelecionarFicheiroRequisito={handleSelecionarFicheiroRequisito}
                onSubmeterCandidatura={handleSubmeterCandidatura}
                onVerPaginaPublica={handleVerPaginaPublicaBadge}
                onCopiarLinkPublico={handleCopiarLinkPublicoBadge}
                onPartilharLinkedIn={handlePartilharLinkedIn}
            />

            {/* ══ MODAL CONFIRMAÇÃO DO LINKEDIN ══════════════════════════ */}
            <ModalConfirmacao
                isOpen={avisoPermissaoLinkedIn}
                onClose={() => setAvisoPermissaoLinkedIn(false)}
                onConfirm={() => setAvisoPermissaoLinkedIn(false)}
                titulo="Sem autorização"
                mensagem="Não tens autorização para partilhar badges no LinkedIn. Esta permissão pode ser ativada nas definições pelo Administrador."
                textoConfirmar="Compreendido"
                textoCancelar="Fechar"
                isDanger={false}
            />

            {/* ══ MODAL CONFIRMAÇÃO DE ANEXO ═════════════════════════════ */}
            <ModalConfirmacao
                isOpen={!!anexoPendente}
                onClose={() => setAnexoPendente(null)}
                onConfirm={handleConfirmarAnexoRequisito}
                titulo="Confirmar Envio de Requisito"
                mensagem={`Deseja enviar o ficheiro "${
                    anexoPendente?.ficheiro?.name ?? ""
                }" como comprovativo para o requisito "${
                    anexoPendente?.requisito?.nome_requisito ??
                    anexoPendente?.requisito?.nome ??
                    ""
                }"?`}
                textoConfirmar="Enviar Comprovativo"
                textoCancelar="Cancelar"
                isDanger={false}
            />
        </div>
    );
};

export default ObjetivosConsultor;
