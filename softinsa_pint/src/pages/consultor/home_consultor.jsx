import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './home_consultor.css';
import api from '../../services/api.js';
import { BotaoVerMais } from '../../components/components.jsx';
import { calcularTempoRestante } from '../../utils/dateUtils.js';
import AtividadeRecente from '../../components/AtividadeModal.jsx';
import ClassificacaoGeral from '../../components/ClassificacaoModal.jsx';

function formatarTempoAtras(data) {
    const agora = new Date();
    const diffMs = agora - new Date(data);
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHoras < 1) return 'Há menos de uma hora';
    if (diffHoras < 24) return `Há ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    if (diffDias === 1) return 'Ontem';
    return `Há ${diffDias} dias`;
}

function mapearAtividade(item) {
    const tempo = formatarTempoAtras(item.timestamp);

    switch (item.type) {
        case 'received':
            return { icone: 'fi-br-check', cor: 'text-success', texto: `${item.item} concluído`, tempo, expirado: false };
        case 'rejected':
            return { icone: 'fi-br-cross', cor: 'text-danger', texto: `${item.item} rejeitado`, tempo, expirado: false };
        case 'updated':
            return { icone: 'fi-br-badge', cor: 'text-warning', textoNegrito: item.user, texto: `atualizou ${item.item}`, tempo, expirado: false };
        case 'policy':
            return { icone: 'fi-br-document', cor: 'text-primary', textoNegrito: item.user, texto: `atualizou ${item.item}`, tempo, expirado: false };
        default:
            return { icone: 'fi-br-info', cor: 'text-muted', texto: `${item.user} - ${item.item}`, tempo, expirado: false };
    }
}

function corPorProgresso(progresso) {
    const pct = Math.max(0, Math.min(100, Number(progresso) || 0));
    if (pct >= 80) return { principal: 'var(--aceitar)', fundo: 'rgba(0, 153, 102, 0.12)' };
    if (pct >= 50) return { principal: 'var(--progresso)', fundo: 'rgba(230, 144, 10, 0.14)' };
    if (pct >= 25) return { principal: '#E6A817', fundo: 'rgba(230, 168, 23, 0.14)' };
    return { principal: 'var(--rejeitar)', fundo: 'rgba(196, 0, 3, 0.12)' };
}

function iconeObjetivo(idx) {
    const icones = ['fi-br-bolt', 'fi-br-target', 'fi-br-trophy', 'fi-br-star', 'fi-br-rocket', 'fi-br-crown'];
    return icones[idx % icones.length];
}

function iconeProgresso(idx) {
    const icones = ['fi-br-check-circle', 'fi-br-list-check', 'fi-br-chart-pie-alt', 'fi-br-badge', 'fi-br-time-forward', 'fi-br-folder'];
    return icones[idx % icones.length];
}

const HomeConsultor = ({ user, saudacao }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [badgesProgresso, setBadgesProgresso] = useState([]);
    const [objetivos, setObjetivos] = useState([]);
    const [progressoItems, setProgressoItems] = useState([]);
    const [classificacao, setClassificacao] = useState([]);
    const [atividades, setAtividades] = useState([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        const carregarDados = async () => {
            try {
                const [resBadges, resObjetivos, resProgresso, resRanking, resAtividade] = await Promise.all([
                    api.get('/homeconsultor/badges-progresso'),
                    api.get('/homeconsultor/objetivos'),
                    api.get('/homeconsultor/progresso'),
                    api.get('/homeconsultor/ranking'),
                    api.get('/atividade')
                ]);

                setBadgesProgresso(resBadges.data || []);
                setObjetivos(resObjetivos.data || []);
                setProgressoItems(resProgresso.data || []);
                setClassificacao(resRanking.data || []);
                setAtividades((resAtividade.data || []).map(mapearAtividade));
            } catch (erro) {
                console.error('Erro ao carregar dados da homepage do consultor:', erro);
            } finally {
                setCarregando(false);
            }
        };

        carregarDados();
    }, []);

    return (
        <div className="home-consultor-container">
            <div className="flex-shrink-0">
                <h1 className="texto-titulo-principal m-0">{saudacao}</h1>
            </div>
            <div className="row" style={{ rowGap: 'var(--gap-default-seccoes)' }}>
                <div className="col-12 col-xl-8">
                    <div className="badges-container d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="home-card-title m-0 fw-medium">{t('badges_progresso')}</h5>
                            <BotaoVerMais onClick={() => navigate('/candidaturas')} tamanho={0.7}/>
                        </div>
                        <div className="badges-grid flex-grow-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <style>{`.badges-grid::-webkit-scrollbar { display: none; }`}</style>
                            {carregando && badgesProgresso.length === 0 ? (
                                <div className="badges-estado-vazio">
                                    <i className="fi fi-br-spinner hc-spinner"></i>
                                    <span>{t('a_carregar') || 'A carregar...'}</span>
                                </div>
                            ) : badgesProgresso.length === 0 ? (
                                <div className="badges-estado-vazio">
                                    <i className="fi fi-br-badge"></i>
                                    <span>{t('sem_badges_progresso') || 'Sem badges em progresso.'}</span>
                                </div>
                            ) : (
                                badgesProgresso.map((badge, idx) => {
                                    const pct = Math.max(0, Math.min(100, Number(badge.progresso) || 0));
                                    const cor = corPorProgresso(pct);
                                    return (
                                        <div className={`badge-col${idx < badgesProgresso.length - 1 ? ' badge-col-separator' : ''}`} key={badge.id}>
                                            <div className="badge-card-premium">
                                                <div className="badge-card-imagem-wrap" style={{ '--badge-progress': `${pct}%`, '--badge-cor': cor.principal }}>
                                                    <img className="badge-card-imagem" src={badge.imagem} alt={badge.titulo} />
                                                    <div className="badge-card-progress-ring" aria-hidden="true"></div>
                                                </div>
                                                <h6 className="badge-card-titulo text-truncate w-100" title={badge.titulo}>{badge.titulo}</h6>
                                                <div className="badge-card-progresso">
                                                    <div className="badge-card-barra-wrap">
                                                        <div className="badge-card-barra-fill" style={{ width: `${pct}%`, backgroundColor: cor.principal }} />
                                                    </div>
                                                    <span className="badge-card-pct" style={{ color: cor.principal }}>{pct}%</span>
                                                </div>
                                                <button className="btn-detalhes-figma" onClick={() => navigate('/candidaturas')}>
                                                    <i className="fi fi-br-eye"></i> {t('mais_detalhes')}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
                <div className="col-12 col-xl-4">
                    <ClassificacaoGeral user={user} classificacao={classificacao} fullHeight={true} />
                </div>
            </div>
            <div className="row" style={{ minHeight: 0, rowGap: 'var(--gap-default-seccoes)' }}>
                {/* Atividade Recente */}
                <div className="col-12 col-lg-4 d-flex flex-column">
                    <AtividadeRecente atividades={atividades} fullHeight={true} />
                </div>
                {/* Objetivos Propostos */}
                <div className="col-12 col-lg-4 d-flex flex-column">
                    <div className="home-card p-3 h-100">
                        <h5 className="home-card-title mb-3 fw-medium flex-shrink-0">{t('objetivos_propostos')}</h5>
                        <div className="objetivos-lista-v3 flex-grow-1">
                            {carregando && objetivos.length === 0 ? (
                                <div className="objetivos-estado-vazio">
                                    <i className="fi fi-br-spinner hc-spinner"></i>
                                    <span>{t('a_carregar') || 'A carregar...'}</span>
                                </div>
                            ) : objetivos.length === 0 ? (
                                <div className="objetivos-estado-vazio">
                                    <i className="fi fi-br-bolt"></i>
                                    <span>{t('sem_objetivos') || 'Sem objetivos propostos.'}</span>
                                </div>
                            ) : (
                                objetivos.slice(0, 3).map((obj, idx) => {
                                    const pct = Math.max(0, Math.min(100, Number(obj.progresso) || 0));
                                    const cor = corPorProgresso(pct);
                                    return (
                                        <div
                                            key={obj.id}
                                            className="objetivo-item-v3"
                                            onClick={() => navigate('/objetivos')}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/objetivos'); }}
                                        >
                                            <div className="objetivo-icone-v3" style={{ backgroundColor: cor.fundo, color: cor.principal }}>
                                                <i className={`fi ${obj.icone || iconeObjetivo(idx)}`}></i>
                                            </div>
                                            <div className="objetivo-corpo-v3">
                                                <div className="objetivo-topo-v3">
                                                    <span className="objetivo-titulo-v3">{obj.titulo}</span>
                                                    <span className="objetivo-pct-v3" style={{ color: cor.principal }}>{pct}%</span>
                                                </div>
                                                <div className="objetivo-barra-wrap-v3">
                                                    <div className="objetivo-barra-fill-v3" style={{ width: `${pct}%`, backgroundColor: cor.principal }} />
                                                </div>
                                                <div className="objetivo-rodape-v3">
                                                    <span className="objetivo-data-v3">
                                                        <i className="fi fi-br-calendar"></i>
                                                        {new Date(obj.data).toLocaleDateString('pt-PT')}
                                                    </span>
                                                    <span className="objetivo-prazo-v3" style={{ color: cor.principal }}>{calcularTempoRestante(obj.data)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
                {/* Progresso */}
                <div className="col-12 col-lg-4 d-flex flex-column">
                    <div className="home-card p-3 h-100">
                        <h5 className="home-card-title mb-3 fw-medium flex-shrink-0">{t('progresso')}</h5>
                        <div className="progresso-lista flex-grow-1 overflow-y-auto pe-1">
                            {carregando && progressoItems.length === 0 ? (
                                <div className="progresso-estado-vazio">
                                    <i className="fi fi-br-spinner hc-spinner"></i>
                                    <span>{t('a_carregar') || 'A carregar...'}</span>
                                </div>
                            ) : progressoItems.length === 0 ? (
                                <div className="progresso-estado-vazio">
                                    <i className="fi fi-br-chart-pie-alt"></i>
                                    <span>{t('sem_progresso') || 'Sem dados de progresso.'}</span>
                                </div>
                            ) : (
                                progressoItems.map((prog, i) => {
                                    const pct = Math.max(0, Math.min(100, Number(prog.pct) || 0));
                                    const cor = corPorProgresso(pct);
                                    return (
                                        <div key={i} className="progresso-card">
                                            <div className="progresso-icone-wrap" style={{ backgroundColor: cor.fundo, color: cor.principal }}>
                                                <i className={`fi ${prog.icone || iconeProgresso(i)}`}></i>
                                            </div>
                                            <div className="progresso-conteudo">
                                                <div className="progresso-cabecalho">
                                                    <span className="progresso-titulo">{prog.titulo}</span>
                                                    <span className="progresso-contagem">
                                                        <strong>{prog.concluidos}</strong> / {prog.total}
                                                    </span>
                                                </div>
                                                <div className="progresso-barra-wrap">
                                                    <div className="progresso-barra-fill" style={{ width: `${pct}%`, backgroundColor: cor.principal }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeConsultor;