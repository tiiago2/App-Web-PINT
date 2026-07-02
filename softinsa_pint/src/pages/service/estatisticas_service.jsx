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
import api from '../../services/api.js';
import BotaoAcao from '../../components/ui/BotaoAcao/BotaoAcao';
import * as XLSX from 'xlsx';
import './estatisticas_service.css';

const periodos = [
    { chave: 'semana',    label: 'esta_semana' },
    { chave: 'mes',       label: 'este_mes' },
    { chave: 'trimestre', label: 'este_trimestre' },
    { chave: 'ano',       label: 'este_ano' },
];

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
    const [showExport, setShowExport] = useState(false);

    /* Estados para os dados reais da API */
    const [kpis, setKpis] = useState({
        badges_por_utilizador: '0,0',
        total_badges: 0,
        total_utilizadores: 0,
        taxa_aprovacao: '0%'
    });
    const [dadosNiveis, setDadosNiveis] = useState([]);
    const [dadosSemana, setDadosSemana] = useState([]);
    const [statusCandidaturas, setStatusCandidaturas] = useState([]);
    const [classificacao, setClassificacao] = useState([]);
    const [carregando, setCarregando] = useState(true);

    /* KPIs formatados para os cards */
    const kpiCards = useMemo(() => [
        { label: 'badges_por_utilizador', valor: kpis.badges_por_utilizador, icone: 'fi fi-br-award' },
        { label: 'total_badges',          valor: kpis.total_badges,          icone: 'fi fi-br-badge' },
        { label: 'total_utilizadores',    valor: kpis.total_utilizadores,    icone: 'fi fi-br-users' },
        { label: 'taxa_aprovacao',        valor: kpis.taxa_aprovacao,        icone: 'fi fi-br-ribbon' },
    ], [kpis]);

    /* Carrega dados iniciais (KPIs, badges por nível, status e ranking) */
    useEffect(() => {
        const carregar = async () => {
            try {
                const [resKpis, resNiveis, resStatus, resRanking] = await Promise.all([
                    api.get('/estatisticasservice/kpis'),
                    api.get('/estatisticasservice/badges-por-nivel'),
                    api.get('/estatisticasservice/status-candidaturas'),
                    api.get('/estatisticasservice/ranking')
                ]);

                setKpis(resKpis.data || {});
                setDadosNiveis(resNiveis.data || []);
                setStatusCandidaturas(resStatus.data || []);
                setClassificacao(resRanking.data || []);
            } catch (erro) {
                console.error('Erro ao carregar estatísticas do service line:', erro);
            } finally {
                setCarregando(false);
            }
        };
        carregar();
    }, []);

    /* Carrega dados do gráfico sempre que o período muda */
    useEffect(() => {
        const carregar = async () => {
            try {
                const res = await api.get(`/estatisticasservice/badges-atribuidos/${periodo}`);
                setDadosSemana(res.data || []);
            } catch (erro) {
                console.error('Erro ao carregar badges atribuídos:', erro);
                setDadosSemana([]);
            }
        };
        carregar();
    }, [periodo]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (exportRef.current && !exportRef.current.contains(e.target)) {
                setShowExport(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleExportarExcel = () => {
        const livro = XLSX.utils.book_new();

        const folhaKPIs = XLSX.utils.json_to_sheet([{
            "Badges por Utilizador": kpis.badges_por_utilizador,
            "Total Badges": kpis.total_badges,
            "Total Utilizadores": kpis.total_utilizadores,
            "Taxa de Aprovação": kpis.taxa_aprovacao
        }]);

        const folhaNiveis = XLSX.utils.json_to_sheet(dadosNiveis);
        const folhaSemana = XLSX.utils.json_to_sheet(dadosSemana);
        const folhaStatus = XLSX.utils.json_to_sheet(statusCandidaturas);
        const folhaRanking = XLSX.utils.json_to_sheet(classificacao);

        XLSX.utils.book_append_sheet(livro, folhaKPIs, "KPIs");
        XLSX.utils.book_append_sheet(livro, folhaSemana, "Atribuídos por Período");
        XLSX.utils.book_append_sheet(livro, folhaNiveis, "Badges por Nível");
        XLSX.utils.book_append_sheet(livro, folhaStatus, "Status Candidaturas");
        XLSX.utils.book_append_sheet(livro, folhaRanking, "Ranking");

        XLSX.writeFile(livro, "Estatisticas_Service_Export.xlsx");
        setShowExport(false);
    };

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
                    <div className="estat-talent-export-wrap" ref={exportRef}>
                        <BotaoAcao
                            variante="primario"
                            icone="fi-br-download"
                            onClick={() => setShowExport(o => !o)}
                        >
                            {t('exportar')}
                        </BotaoAcao>
                        {showExport && (
                            <div className="estat-talent-export-menu">
                                <div className="estat-talent-export-item" onClick={handleExportarExcel}>Excel</div>
                                <div className="estat-talent-export-item">PDF</div>
                            </div>
                        )}
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
                                    <div className="estat-service-pills estat-service-pills--header">
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
                            <StatusCandidaturas dados={statusCandidaturas} />
                        </div>
                    </div>
                </div>

                {/* COLUNA DIREITA — Classificação da Service Line */}
                <div className="estat-service-col-dir">
                    <ClassificacaoGeral
                        classificacao={classificacao}
                        user={user}
                        titulo="Service Line"
                        fullHeight={true}
                        maxItems={10}
                    />
                </div>
            </div>
        </div>
    );
};

export default EstatisticasService;
