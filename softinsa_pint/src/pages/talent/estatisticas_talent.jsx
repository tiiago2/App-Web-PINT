import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    PieChart, Pie, Cell, Tooltip
} from 'recharts';
import ClassificacaoGeral from '../../components/ClassificacaoModal.jsx';
import BadgesPorNivel from '../../components/BadgesPorNivel/BadgesPorNivel.jsx';
import { mockClassificacao } from '../../defs/classificacao_mock.js';
import './estatisticas_talent.css';

/* ── DADOS MOCKUP ─────────────────────────── */
const kpiCards = [
    { label: 'badges_por_utilizador', valor: '12,4', icone: 'fi fi-br-award' },
    { label: 'total_badges',          valor: '1000', icone: 'fi fi-br-badge' },
    { label: 'total_utilizadores',    valor: '360',  icone: 'fi fi-br-users' },
    { label: 'taxa_aprovacao',        valor: '85%',  icone: 'fi fi-br-ribbon' },
];

/* Badges por nível — percentuais do talent manager */
const dadosNiveis = [
    { Nome_Nivel: 'junior',            valor: 90 },
    { Nome_Nivel: 'intermedio',        valor: 30 },
    { Nome_Nivel: 'senior',            valor: 40 },
    { Nome_Nivel: 'especialista',      valor: 5 },
    { Nome_Nivel: 'especialista_tec',  valor: 5 },
];

const dadosPie = [
    { Nome_Area: 'Low Code',        total_badges: 5,  cor: '#4CAF50' },
    { Nome_Area: 'Hybrid Systems',  total_badges: 35, cor: '#64B5F6' },
    { Nome_Area: 'Cloud',           total_badges: 20, cor: '#F44336' },
    { Nome_Area: 'Cibersegurança',  total_badges: 20, cor: '#FFEB3B' },
    { Nome_Area: 'Data & AI',       total_badges: 5,  cor: '#E91E63' },
];

const learningPaths = [
    { nome: 'Hybrid Systems',  badges: 12, icone: 'fi-br-rocket',        cor: '#64B5F6', fundo: '#e8f4fd' },
    { nome: 'Cloud',           badges: 18, icone: 'fi-br-cloud',         cor: '#F44336', fundo: '#fdecec' },
    { nome: 'Low Code',        badges: 9,  icone: 'fi-br-window-alt',    cor: '#4CAF50', fundo: '#e8f5e9' },
    { nome: 'Data & AI',       badges: 14, icone: 'fi-br-brain',         cor: '#E91E63', fundo: '#fde4ec' },
];

const TIP = {
    borderRadius: 'var(--border-radius-pequeno)',
    border: 'var(--borda-principal) solid var(--contorno)',
    fontSize: '11px'
};
const COR = '#39639C';

const EstatisticasTalent = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const exportRef = useRef(null);

    const [showExport, setShowExport] = useState(false);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (exportRef.current && !exportRef.current.contains(e.target)) {
                setShowExport(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const totalAtribuidos = dadosPie.reduce((s, x) => s + x.total_badges, 0);

    return (
        <div className="estat-talent-page">

            {/* ── CABEÇALHO ── */}
            <div className="estat-talent-header">
                <h1 className="texto-titulo-principal m-0">{t('estatisticas')}</h1>
                <div className="estat-talent-actions">
                    <button
                        className="estat-talent-btn-outline"
                        onClick={() => navigate('/atividade')}
                    >
                        {t('historico_atribuidos')}
                    </button>
                    <div className="estat-talent-export-wrap" ref={exportRef}>
                        <button
                            className="estat-talent-btn-primary"
                            onClick={() => setShowExport(o => !o)}
                        >
                            {t('exportar')}
                        </button>
                        {showExport && (
                            <div className="estat-talent-export-menu">
                                <div className="estat-talent-export-item">Excel</div>
                                <div className="estat-talent-export-item">PDF</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── CORPO PRINCIPAL ── */}
            <div className="estat-talent-body">

                {/* COLUNA ESQUERDA — KPIs, gráficos e learning paths */}
                <div className="estat-talent-col-esq">

                    {/* ROW 1 — KPI + Badges por Nível */}
                    <div className="estat-talent-row">

                        {/* KPI 2×2 */}
                        <div className="estat-talent-kpi-wrap">
                            <div className="estat-talent-kpi-grid">
                                {kpiCards.map((kpi, i) => (
                                    <div key={i} className="estat-talent-kpi-card">
                                        <span className="estat-talent-kpi-label">{t(kpi.label)}</span>
                                        <div className="estat-talent-kpi-row">
                                            <i className={`${kpi.icone} estat-talent-kpi-icon`} />
                                            <span className="estat-talent-kpi-valor">{kpi.valor}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Badges Atribuídos por Nível */}
                        <div className="estat-talent-niveis-wrap">
                            <div className="estat-talent-card h-100">
                                <div className="estat-talent-card-header">
                                    <p className="estat-talent-chart-title m-0">{t('badges_atribuidos_nivel')}</p>
                                </div>
                                <BadgesPorNivel dados={dadosNiveis} />
                            </div>
                        </div>
                    </div>

                    {/* ROW 2 — Pie (Atribuídos este mês) + Learning Paths */}
                    <div className="estat-talent-row">

                        {/* Donut — Atribuídos este mês */}
                        <div className="estat-talent-pie-wrap">
                            <div className="estat-talent-card h-100">
                                <div className="estat-talent-card-header">
                                    <p className="estat-talent-chart-title m-0">{t('atribuidos_este_mes')}</p>
                                    <span className="estat-talent-total">{totalAtribuidos}</span>
                                </div>
                                <div className="estat-talent-pie-inner">
                                    <div className="estat-talent-donut-container">
                                        <PieChart width={160} height={160}>
                                            <Pie
                                                data={dadosPie}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={48}
                                                outerRadius={72}
                                                dataKey="total_badges"
                                                strokeWidth={2}
                                                stroke="#fff"
                                                paddingAngle={2}
                                            >
                                                {dadosPie.map((e, i) => (
                                                    <Cell key={i} fill={e.cor} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={TIP} formatter={(v, n) => [`${v}`, n]} />
                                        </PieChart>
                                        <div className="estat-talent-donut-center">
                                            <div className="estat-talent-donut-total">{totalAtribuidos}</div>
                                            <div className="estat-talent-donut-label">{t('total')}</div>
                                        </div>
                                    </div>
                                    <div className="estat-talent-legenda">
                                        {dadosPie.map((e, i) => (
                                            <div key={i} className="estat-talent-legenda-item">
                                                <div className="estat-talent-legenda-esq">
                                                    <span className="estat-talent-legenda-dot" style={{ backgroundColor: e.cor }} />
                                                    <span>{e.Nome_Area}</span>
                                                </div>
                                                <span className="estat-talent-legenda-valor">{e.total_badges}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Learning Paths */}
                        <div className="estat-talent-learning-wrap">
                            <div className="estat-talent-card h-100">
                                <div className="estat-talent-card-header">
                                    <p className="estat-talent-chart-title m-0">{t('learning_paths')}</p>
                                    <span className="estat-talent-total">{learningPaths.length}</span>
                                </div>
                                <div className="estat-talent-learning-grid">
                                    {learningPaths.map((lp, i) => (
                                        <div key={i} className="estat-talent-learning-card" style={{ '--lp-cor': lp.cor, '--lp-fundo': lp.fundo }}>
                                            <div className="estat-talent-learning-icone">
                                                <i className={`fi ${lp.icone}`} />
                                            </div>
                                            <div className="estat-talent-learning-info">
                                                <span className="estat-talent-learning-name">{lp.nome}</span>
                                                <span className="estat-talent-learning-meta">
                                                    {lp.badges} {t('badges').toLowerCase()}
                                                </span>
                                            </div>
                                            <div className="estat-talent-learning-count">
                                                <span>{lp.badges}</span>
                                                <i className="fi fi-br-badge" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUNA DIREITA — Classificação Geral */}
                <div className="estat-talent-col-dir">
                    <ClassificacaoGeral
                        classificacao={mockClassificacao}
                        fullHeight={true}
                        maxItems={10}
                    />
                </div>
            </div>
        </div>
    );
};

export default EstatisticasTalent;
