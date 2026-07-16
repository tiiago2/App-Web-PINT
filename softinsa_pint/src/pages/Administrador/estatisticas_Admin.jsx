import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    PieChart, Pie, Cell, Tooltip
} from 'recharts';
import ClassificacaoGeral from '../../components/ClassificacaoModal.jsx';
import BadgesPorNivel from '../../components/BadgesPorNivel/BadgesPorNivel.jsx';
import BotaoAcao from "../../components/ui/BotaoAcao/BotaoAcao";
import LoadingSpinner from "../../components/ui/Loading/LoadingSpinner";
import useToast from "../../hooks/useToast.js";
import api from '../../services/api.js';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './estatisticas_Admin.css';

const TIP = {
    borderRadius: 'var(--border-radius-pequeno)',
    border: 'var(--borda-principal) solid var(--contorno)',
    fontSize: '11px'
};

const EstatisticasAdmin = () => {
    const { t } = useTranslation();
    const { mostrarToast } = useToast();
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
        { label: 'total_badges', valor: kpis.total_badges, icone: 'fi fi-br-badge' },
        { label: 'total_utilizadores', valor: kpis.total_utilizadores, icone: 'fi fi-br-users' },
        { label: 'taxa_aprovacao', valor: kpis.taxa_aprovacao, icone: 'fi fi-br-ribbon' },
    ], [kpis]);

    /* Cores do donut geradas dinamicamente com base na quantidade exata de fatias (dadosPie.length) */
    const dadosPieComCores = useMemo(() => {
        return dadosPie.map((item, i) => {
            // Calcula o ângulo da cor de forma proporcional à quantidade de dados
            const hue = (i * (360 / dadosPie.length)) % 360;
            return {
                ...item,
                cor: `hsl(${hue}, 70%, 55%)`
            };
        });
    }, [dadosPie]);

    /* Carrega todos os dados da API */
    useEffect(() => {
        const carregar = async () => {
            try {
                const [resKpis, resNiveis, resPie, resLearningPaths, resRanking] = await Promise.all([
                    api.get('/estatisticasadmin/kpis'),
                    api.get('/estatisticasadmin/badges-por-nivel'),
                    api.get('/estatisticasadmin/atribuidos-mes'),
                    api.get('/estatisticasadmin/learning-paths'),
                    api.get('/estatisticasadmin/ranking')
                ]);

                setKpis(resKpis.data || {});
                setDadosNiveis(resNiveis.data || []);
                setDadosPie(resPie.data || []);
                setLearningPaths(resLearningPaths.data || []);
                setClassificacao(resRanking.data || []);
            } catch (erro) {
                console.error('Erro ao carregar estatísticas do administrador:', erro);
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


    const handleExportarExcel = () => {
        // 1. Criar um novo livro de Excel vazio
        const livro = XLSX.utils.book_new();

        // 2. Transformar os nossos arrays do React em Folhas de Excel
        const folhaRanking = XLSX.utils.json_to_sheet(classificacao);
        const folhaLearningPaths = XLSX.utils.json_to_sheet(learningPaths);
        const folhaAtribuidos = XLSX.utils.json_to_sheet(dadosPie);
        const folhaDistribuicao = XLSX.utils.json_to_sheet(dadosNiveis);

        // Para os KPIs (como são um objeto e não um array, transformamos num array de 1 item)
        const folhaKPIs = XLSX.utils.json_to_sheet([{
            "Total de Badges": kpis.total_badges,
            "Total de Utilizadores": kpis.total_utilizadores,
            "Badges por Utilizador": kpis.badges_por_utilizador,
            "Taxa de Aprovação": kpis.taxa_aprovacao
        }]);

        // 3. Adicionar as folhas ao livro (dando o nome a cada aba)
        XLSX.utils.book_append_sheet(livro, folhaKPIs, "Resumo KPIs");
        XLSX.utils.book_append_sheet(livro, folhaRanking, "Ranking");
        XLSX.utils.book_append_sheet(livro, folhaLearningPaths, "Learnig Paths");
        XLSX.utils.book_append_sheet(livro, folhaAtribuidos, "Atribuídos este mês");
        XLSX.utils.book_append_sheet(livro, folhaDistribuicao, "Distribuição de níveis");

        // 4. Guardar e forçar download
        XLSX.writeFile(livro, "Estatisticas_Softinsa_Julho_2026.xlsx");

        // Fecha o menu de exportação
        setShowExport(false);
    };

    const handleExportarPDF = () => {
        try {
            const doc = new jsPDF('p', 'pt', 'a4');

            doc.setFontSize(18);
            doc.setTextColor(0, 86, 179);
            doc.text("Relatório Geral de Estatísticas", 40, 40);

            doc.setFontSize(11);
            doc.setTextColor(80);
            doc.text(`Total de Badges: ${kpis?.total_badges || 0}`, 40, 70);
            doc.text(`Total de Utilizadores: ${kpis?.total_utilizadores || 0}`, 40, 90);
            doc.text(`Média por Utilizador: ${kpis?.badges_por_utilizador || 0}`, 240, 70);
            doc.text(`Taxa de Aprovação: ${kpis?.taxa_aprovacao || '0%'}`, 240, 90);

            let posiçãoY_Atual = 140;

            doc.setFontSize(14);
            doc.setTextColor(40);
            doc.text("Atribuídos do Mês (Por Área)", 40, posiçãoY_Atual);
            
            autoTable(doc, {
                startY: posiçãoY_Atual + 10,
                head: [["Área", "Total Badges"]],
                body: dadosPie.length > 0 
                    ? dadosPie.map(d => [d.Nome_Area || "N/A", d.total_badges || 0])
                    : [["Sem dados neste mês", "-"]],
                theme: 'striped',
                headStyles: { fillColor: [0, 86, 179] },
                styles: { fontSize: 10 }
            });

            posiçãoY_Atual = doc.lastAutoTable.finalY + 40;

            doc.setFontSize(14);
            doc.text("Distribuição por Níveis", 40, posiçãoY_Atual);
            
            autoTable(doc, {
                startY: posiçãoY_Atual + 10,
                head: [["Nível", "Quantidade (%)"]],
                body: dadosNiveis.length > 0
                    ? dadosNiveis.map(d => [d.Nome_Nivel || "N/A", d.valor !== undefined ? `${d.valor}%` : "0%"])
                    : [["Sem dados", "-"]],
                theme: 'striped',
                headStyles: { fillColor: [0, 86, 179] },
                styles: { fontSize: 10 }
            });

            posiçãoY_Atual = doc.lastAutoTable.finalY + 40;

            if (posiçãoY_Atual > 700) { doc.addPage(); posiçãoY_Atual = 40; }

            doc.setFontSize(14);
            doc.text("Learning Paths Ativos", 40, posiçãoY_Atual);
            
            autoTable(doc, {
                startY: posiçãoY_Atual + 10,
                head: [["Nome da Learning Path", "Total Badges"]],
                body: learningPaths.length > 0
                    ? learningPaths.map(lp => [lp.nome || "N/A", lp.total_badges || 0])
                    : [["Sem dados", "-"]],
                theme: 'striped',
                headStyles: { fillColor: [0, 86, 179] },
                styles: { fontSize: 10 }
            });

            posiçãoY_Atual = doc.lastAutoTable.finalY + 40;

            if (posiçãoY_Atual > 700) { doc.addPage(); posiçãoY_Atual = 40; }

            doc.setFontSize(14);
            doc.text("Ranking Geral de Utilizadores", 40, posiçãoY_Atual);
            
            autoTable(doc, {
                startY: posiçãoY_Atual + 10,
                head: [["#", "Nome", "Total Pontos"]],
                body: classificacao.length > 0
                    ? classificacao.map((c, index) => [index + 1, c.nome || c.nome_user || "N/A", c.pontos_sempre || c.pontos || 0])
                    : [["Sem dados", "-", "-"]],
                theme: 'striped',
                headStyles: { fillColor: [0, 86, 179] },
                styles: { fontSize: 10 }
            });

            doc.save("Relatorio_Completo_Estatisticas.pdf");
            setShowExport(false);

        } catch (erro) {
            console.error("Erro CRÍTICO ao gerar o PDF:", erro);
            mostrarToast("Erro ao gerar o PDF. Vê a consola para detalhes.", "erro");
        }
    };

    const totalAtribuidos = dadosPieComCores.reduce((s, x) => s + x.total_badges, 0);

    return (
        <div className="estat-admin-page">

            {/* ── CABEÇALHO ── */}
            <div className="estat-admin-header">
                <h1 className="texto-titulo-principal m-0">{t('estatisticas')}</h1>
                <div className="estat-admin-actions">
                    <button
                        className="estat-admin-btn-outline"
                        onClick={() => navigate('/atividade')}
                    >
                        {t('historico_atribuidos')}
                    </button>
                    <div className="estat-admin-export-wrap" ref={exportRef}>
                        <BotaoAcao
                            variante="primario"
                            icone="fi-br-download"
                            onClick={() => setShowExport(o => !o)}
                        >
                            {t('exportar')}
                        </BotaoAcao>
                        {showExport && (
                            <div className="estat-admin-export-menu">
                                <div className="estat-admin-export-item" onClick={handleExportarExcel}>Excel</div>
                                <div className="estat-admin-export-item" onClick={handleExportarPDF}>PDF</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── CORPO PRINCIPAL ── */}
            {carregando ? (
                <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1" style={{ minHeight: '50vh' }}>
                    <LoadingSpinner tamanho="lg" texto={t("a_carregar") || "A carregar..."} centralizado />
                </div>
            ) : (
                <div className="estat-admin-body">
                    {/* COLUNA ESQUERDA — KPIs, gráficos e learning paths */}
                    <div className="estat-admin-col-esq">
                        {/* ROW 1 — KPI + Badges por Nível */}
                        <div className="estat-admin-row">
                            {/* KPI 2×2 */}
                            <div className="estat-admin-kpi-wrap">
                                <div className="estat-admin-kpi-grid">
                                    {kpiCards.map((kpi, i) => (
                                        <div key={i} className="estat-admin-kpi-card">
                                            <span className="estat-admin-kpi-label">{t(kpi.label)}</span>
                                            <div className="estat-admin-kpi-row">
                                                <i className={`${kpi.icone} estat-admin-kpi-icon`} />
                                                <span className="estat-admin-kpi-valor">{kpi.valor}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Badges Atribuídos por Nível */}
                            <div className="estat-admin-niveis-wrap">
                                <div className="estat-admin-card h-100">
                                    <div className="estat-admin-card-header">
                                        <p className="estat-admin-chart-title m-0">{t('badges_atribuidos_nivel')}</p>
                                    </div>
                                    <BadgesPorNivel dados={dadosNiveis} />
                                </div>
                            </div>
                        </div>

                        {/* ROW 2 — Pie (Atribuídos este mês) + Learning Paths */}
                        <div className="estat-admin-row">
                            {/* Donut — Atribuídos este mês */}
                            <div className="estat-admin-pie-wrap">
                                <div className="estat-admin-card h-100">
                                    <div className="estat-admin-card-header">
                                        <p className="estat-admin-chart-title m-0">{t('atribuidos_este_mes')}</p>
                                        <span className="estat-admin-total">{totalAtribuidos}</span>
                                    </div>
                                    <div className="estat-admin-pie-inner">
                                        <div className="estat-admin-donut-container">
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
                                            <div className="estat-admin-donut-center">
                                                <div className="estat-admin-donut-total">{totalAtribuidos}</div>
                                                <div className="estat-admin-donut-label">{t('total')}</div>
                                            </div>
                                        </div>
                                        <div className="estat-admin-legenda">
                                            {dadosPieComCores.map((e, i) => (
                                                <div key={i} className="estat-admin-legenda-item">
                                                    <div className="estat-admin-legenda-esq">
                                                        <span className="estat-admin-legenda-dot" style={{ backgroundColor: e.cor }} />
                                                        <span>{e.Nome_Area}</span>
                                                    </div>
                                                    <span className="estat-admin-legenda-valor">{e.total_badges}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Learning Paths */}
                            <div className="estat-admin-learning-wrap">
                                <div className="estat-admin-card h-100">
                                    <div className="estat-admin-card-header">
                                        <p className="estat-admin-chart-title m-0">{t('learning_paths')}</p>
                                        <span className="estat-admin-total">{learningPaths.length}</span>
                                    </div>
                                    <div className="estat-admin-learning-grid">
                                        {learningPaths.map((lp, i) => (
                                            <div key={i} className="estat-admin-learning-card">
                                                <div className="estat-admin-learning-info">
                                                    <span className="estat-admin-learning-name">{lp.nome}</span>
                                                    <span className="estat-admin-learning-meta">
                                                        {lp.total_badges} {t('badges').toLowerCase()}
                                                    </span>
                                                </div>
                                                <div className="estat-admin-learning-count">
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
                    <div className="estat-admin-col-dir">
                        <ClassificacaoGeral
                            classificacao={classificacao}
                            fullHeight={true}
                            maxItems={12}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default EstatisticasAdmin;