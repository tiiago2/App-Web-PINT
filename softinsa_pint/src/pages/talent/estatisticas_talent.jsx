import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    PieChart, Pie, Cell, Tooltip
} from 'recharts';
import ClassificacaoGeral from '../../components/ClassificacaoModal.jsx';
import BadgesPorNivel from '../../components/BadgesPorNivel/BadgesPorNivel.jsx';
import api from '../../services/api.js';
import './estatisticas_talent.css';

const CORES_DONUT = ['#4CAF50', '#64B5F6', '#F44336', '#FFEB3B', '#E91E63', '#9C27B0', '#00BCD4', '#FF9800'];

const TIP = {
    borderRadius: 'var(--border-radius-pequeno)',
    border: 'var(--borda-principal) solid var(--contorno)',
    fontSize: '11px'
};

const EstatisticasTalent = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const exportRef = useRef(null);

    const [showExport, setShowExport] = useState(false);

    /* Estados para os dados reais da API */
    const [kpis, setKpis] = useState({
        badges_por_utilizador: '0,0',
        total_badges: 0,
        total_utilizadores: 0,
        taxa_aprovacao: '0%'
    });
    const [dadosNiveis, setDadosNiveis] = useState([]);
    const [dadosPie, setDadosPie] = useState([]);
    const [learningPaths, setLearningPaths] = useState([]);
    const [classificacao, setClassificacao] = useState([]);
    const [carregando, setCarregando] = useState(true);

    /* KPIs formatados para os cards */
    const kpiCards = useMemo(() => [
        { label: 'badges_por_utilizador', valor: kpis.badges_por_utilizador, icone: 'fi fi-br-award' },
        { label: 'total_badges',          valor: kpis.total_badges,          icone: 'fi fi-br-badge' },
        { label: 'total_utilizadores',    valor: kpis.total_utilizadores,    icone: 'fi fi-br-users' },
        { label: 'taxa_aprovacao',        valor: kpis.taxa_aprovacao,        icone: 'fi fi-br-ribbon' },
    ], [kpis]);

    /* Cores do donut atribuídas por índice */
    const dadosPieComCores = useMemo(() =>
        dadosPie.map((item, i) => ({
            ...item,
            cor: CORES_DONUT[i % CORES_DONUT.length]
        })),
    [dadosPie]);

    /* Carrega todos os dados da API */
    useEffect(() => {
        const carregar = async () => {
            try {
                const [resKpis, resNiveis, resPie, resLearningPaths, resRanking] = await Promise.all([
                    api.get('/estatisticastalent/kpis'),
                    api.get('/estatisticastalent/badges-por-nivel'),
                    api.get('/estatisticastalent/atribuidos-mes'),
                    api.get('/estatisticastalent/learning-paths'),
                    api.get('/estatisticastalent/ranking')
                ]);

                setKpis(resKpis.data || {});
                setDadosNiveis(resNiveis.data || []);
                setDadosPie(resPie.data || []);
                setLearningPaths(resLearningPaths.data || []);
                setClassificacao(resRanking.data || []);
            } catch (erro) {
                console.error('Erro ao carregar estatísticas do talent manager:', erro);
            } finally {
                setCarregando(false);
            }
        };
        carregar();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (exportRef.current && !exportRef.current.contains(e.target)) {
                setShowExport(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const totalAtribuidos = dadosPieComCores.reduce((s, x) => s + x.total_badges, 0);

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
                                                data={dadosPieComCores}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={48}
                                                outerRadius={72}
                                                dataKey="total_badges"
                                                strokeWidth={2}
                                                stroke="#fff"
                                                paddingAngle={2}
                                            >
                                                {dadosPieComCores.map((e, i) => (
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
                                        {dadosPieComCores.map((e, i) => (
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
                                        <div key={i} className="estat-talent-learning-card">
                                            <div className="estat-talent-learning-info">
                                                <span className="estat-talent-learning-name">{lp.nome}</span>
                                                <span className="estat-talent-learning-meta">
                                                    {lp.total_badges} {t('badges').toLowerCase()}
                                                </span>
                                            </div>
                                            <div className="estat-talent-learning-count">
                                                <span>{lp.total_badges}</span>
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
                        classificacao={classificacao}
                        fullHeight={true}
                        maxItems={10}
                    />
                </div>
            </div>
        </div>
    );
};

export default EstatisticasTalent;
