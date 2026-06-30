import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar,
    ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, LabelList
} from 'recharts';
import ClassificacaoGeral from '../../components/ClassificacaoModal.jsx';
import StatusCandidaturas from '../../components/StatusCandidaturas/StatusCandidaturas.jsx';
import BadgesPorNivel from '../../components/BadgesPorNivel/BadgesPorNivel.jsx';
import { mockClassificacao } from '../../defs/classificacao_mock.js';
import {
    getConsultoresServiceLine,
    getTotalBadgesAtribuidos,
    getTotalUtilizadoresServiceLine,
    getBadgesPorNivel,
    getTaxaAprovacao,
    getAreasServiceLine,
    serviceLines,
    submissoes,
} from '../../defs/service_mock.js';
import { getDadosBadgesAtribuidos } from '../../utils/estatisticasUtils.js';
import './estatisticas_service.css';

const periodos = [
    { chave: 'semana',    label: 'esta_semana' },
    { chave: 'mes',       label: 'este_mes' },
    { chave: 'trimestre', label: 'este_trimestre' },
    { chave: 'ano',       label: 'este_ano' },
];

const TODAS_AREAS = 'todas';

const opcoesExportar = [
    { chave: 'pedidos',     label: 'exportar_pedidos' },
    { chave: 'badges',      label: 'exportar_badges' },
    { chave: 'consultores', label: 'exportar_consultores' },
    { chave: 'aprovacoes',  label: 'exportar_aprovacoes' },
];

const TIP = {
    borderRadius: 'var(--border-radius-pequeno)',
    border: 'var(--borda-principal) solid var(--contorno)',
    fontSize: '11px'
};
const COR = '#39639C';

const EstatisticasService = ({ user }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const exportRef = useRef(null);

    const [periodo, setPeriodo] = useState('mes');
    const [area, setArea] = useState(TODAS_AREAS);
    const [showExport, setShowExport] = useState(false);

    /* Identifica a service line do utilizador logado */
    const serviceLineAtual = useMemo(() => {
        return user?.service_line || 'Hybrid Systems';
    }, [user]);

    const serviceLineId = useMemo(() => {
        return serviceLines.find((s) => s.Nome_Service_Line === serviceLineAtual)?.ID_Service_Line || 1;
    }, [serviceLineAtual]);

    /* Dados derivados dos mocks (base de dados) */
    const consultoresSL = useMemo(() => getConsultoresServiceLine(serviceLineId), [serviceLineId]);

    const kpiCards = useMemo(() => {
        const totalBadges = getTotalBadgesAtribuidos();
        const totalUsers = getTotalUtilizadoresServiceLine(serviceLineId);
        const badgesPorUser = totalUsers > 0 ? (totalBadges / totalUsers).toFixed(1).replace('.', ',') : '0,0';
        const taxaAprovacao = `${getTaxaAprovacao()}%`;

        return [
            { label: 'badges_por_utilizador', valor: badgesPorUser, icone: 'fi fi-br-award' },
            { label: 'total_badges',          valor: totalBadges,    icone: 'fi fi-br-badge' },
            { label: 'total_utilizadores',    valor: totalUsers,     icone: 'fi fi-br-users' },
            { label: 'taxa_aprovacao',        valor: taxaAprovacao,  icone: 'fi fi-br-ribbon' },
        ];
    }, [serviceLineId]);

    const dadosNiveis = useMemo(() => getBadgesPorNivel(), []);

    const dadosSemana = useMemo(() => getDadosBadgesAtribuidos(periodo, t), [periodo, t]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (exportRef.current && !exportRef.current.contains(e.target)) {
                setShowExport(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="estat-service-page">

            {/* ── CABEÇALHO ── */}
            <div className="estat-service-header">
                <h1 className="texto-titulo-principal m-0">{t('estatisticas')}</h1>
                <div className="estat-service-actions">
                    <button
                        className="estat-service-btn-outline"
                        onClick={() => navigate('/atividade')}
                    >
                        {t('historico_atribuidos')}
                    </button>
                    <div className="estat-service-export-wrap" ref={exportRef}>
                        <button
                            className="estat-service-btn-primary"
                            onClick={() => setShowExport(o => !o)}
                        >
                            {t('exportar')}
                        </button>
                        {showExport && (
                            <div className="estat-service-export-menu">
                                <div className="estat-service-export-header">{t('exportar_como')}</div>
                                {opcoesExportar.map((op) => (
                                    <div key={op.chave} className="estat-service-export-item">
                                        <span className="estat-service-export-label">{t(op.label)}</span>
                                        <div className="estat-service-export-formats">
                                            <span>Excel</span>
                                            <span>PDF</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── FILTROS RÁPIDOS ── */}
            <div className="estat-service-filters">
                <div className="estat-service-filtro-grupo">
                    <span className="estat-service-filtro-label">
                        <i className="fi fi-br-clock"></i>
                        {t('periodo')}
                    </span>
                    <div className="estat-service-pills">
                        {periodos.map((p) => (
                            <button
                                key={p.chave}
                                className={`estat-service-pill ${periodo === p.chave ? 'active' : ''}`}
                                onClick={() => setPeriodo(p.chave)}
                            >
                                {t(p.label)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="estat-service-filtro-grupo">
                    <span className="estat-service-filtro-label">
                        <i className="fi fi-br-target"></i>
                        {t('area')}
                    </span>
                    <div className="estat-service-pills">
                        <button
                            className={`estat-service-pill ${area === TODAS_AREAS ? 'active' : ''}`}
                            onClick={() => setArea(TODAS_AREAS)}
                        >
                            {t('todas_as_areas')}
                        </button>
                        {getAreasServiceLine(serviceLineId).map((a) => (
                            <button
                                key={a}
                                className={`estat-service-pill ${area === a ? 'active' : ''}`}
                                onClick={() => setArea(a)}
                            >
                                {a}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── CORPO PRINCIPAL ── */}
            <div className="estat-service-body">

                {/* COLUNA ESQUERDA — KPIs, gráficos e contribuidores */}
                <div className="estat-service-col-esq">

                    {/* ROW 1 — KPI + Badges por Nível */}
                    <div className="estat-service-row">

                        {/* KPI 2×2 */}
                        <div className="estat-service-kpi-wrap">
                            <div className="estat-service-kpi-grid">
                                {kpiCards.map((kpi, i) => (
                                    <div key={i} className="estat-service-kpi-card">
                                        <span className="estat-service-kpi-label">{t(kpi.label)}</span>
                                        <div className="estat-service-kpi-row">
                                            <i className={`${kpi.icone} estat-service-kpi-icon`} />
                                            <span className="estat-service-kpi-valor">{kpi.valor}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Badges Atribuídos por Nível */}
                        <div className="estat-service-niveis-wrap">
                            <div className="estat-service-card h-100">
                                <div className="estat-service-card-header">
                                    <p className="estat-service-chart-title m-0">{t('badges_atribuidos_nivel')}</p>
                                </div>
                                <BadgesPorNivel dados={dadosNiveis} />
                            </div>
                        </div>
                    </div>

                    {/* ROW 2 — Badges atribuídos por período + Melhores contribuidores */}
                    <div className="estat-service-row">

                        {/* Badges atribuídos por período */}
                        <div className="estat-service-bar-wrap">
                            <div className="estat-service-card h-100">
                                <div className="estat-service-card-header">
                                    <p className="estat-service-chart-title m-0">{t('badges_atribuidos')}</p>
                                </div>
                                <div style={{ flex: 1, minHeight: 0 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={dadosSemana}
                                            margin={{ top: 18, right: 8, left: 8, bottom: 0 }}
                                            barSize={dadosSemana.length > 6 ? 20 : 34}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                            <XAxis
                                                dataKey="label"
                                                tick={{ fontSize: 10, fill: '#8fa3b8' }}
                                                axisLine={false}
                                                tickLine={false}
                                                interval={0}
                                                angle={dadosSemana.length > 6 ? -30 : 0}
                                                textAnchor={dadosSemana.length > 6 ? 'end' : 'middle'}
                                                height={dadosSemana.length > 6 ? 50 : 30}
                                            />
                                            <YAxis hide />
                                            <Tooltip
                                                contentStyle={TIP}
                                                formatter={(v) => [`${v}`, t('badges_atribuidos')]}
                                            />
                                            <Bar dataKey="atribuidos" fill={COR} radius={[6, 6, 0, 0]}>
                                                <LabelList
                                                    dataKey="atribuidos"
                                                    position="top"
                                                    style={{ fontSize: '10px', fill: '#8fa3b8', fontWeight: 600 }}
                                                />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Status das candidaturas */}
                        <div className="estat-service-status-wrap">
                            <StatusCandidaturas dados={submissoes} />
                        </div>
                    </div>
                </div>

                {/* COLUNA DIREITA — Classificação Geral */}
                <div className="estat-service-col-dir">
                    <ClassificacaoGeral
                        classificacao={mockClassificacao}
                        user={user}
                        filtroInicial="service_line"
                        filtroValorInicial={serviceLineAtual}
                        titulo={t('classificacao_geral')}
                        fullHeight={true}
                        maxItems={10}
                    />
                </div>
            </div>
        </div>
    );
};

export default EstatisticasService;
