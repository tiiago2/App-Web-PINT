import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
    BarChart, Bar,
    PieChart, Pie, Cell,
    ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, LabelList
} from 'recharts';
import ClassificacaoGeral from '../../components/ClassificacaoModal.jsx';
import EvolucaoModal from '../../components/EvolucaoModal.jsx';
import api from '../../services/api.js';
import BotaoAcao from '../../components/ui/BotaoAcao/BotaoAcao';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './estatisticas_consultor.css';

/* ── CORES ─────────────────────────────────────────────────── */

/* Badges por nível — gradiente de azuis claros a escuros (Júnior → Líder) */
const NIVEIS_CORES = ['#b3cde8', '#7fafd4', '#4d90bf', '#2d6da3', '#1a4d7a', '#4d90bf'];
function corNivel(id_nivel) {
    return NIVEIS_CORES[(id_nivel - 1) % NIVEIS_CORES.length];
}

const TIP = { borderRadius: 'var(--border-radius-pequeno)', border: 'var(--borda-principal) solid var(--contorno)', fontSize: '11px' };
const COR = '#39639C';

const PERIODOS = [
    { key: 'semana',    label: 'Semana' },
    { key: 'mes',       label: 'Mês' },
    { key: 'semestre',  label: 'Semestre' },
    { key: 'ano',       label: 'Ano' },
    { key: 'sempre',    label: 'Sempre' },
];

const EstatisticasConsultor = ({ user }) => {
    const [periodo, setPeriodo] = useState('semestre');
    const [dadosBar, setDadosBar] = useState([]);
    const [kpi, setKpi] = useState({
        lugar_atual: '-',
        total_badges: '-',
        objetivos_ativos: '-',
        taxa_aprovacao: '-'
    });
    const [dadosPie, setDadosPie] = useState([]);

    const dadosPieComCores = useMemo(() => {
        return dadosPie.map((item, i) => {
            const hue = (i * (360 / (dadosPie.length || 1))) % 360;
            return {
                ...item,
                cor: `hsl(${hue}, 70%, 55%)`
            };
        });
    }, [dadosPie]);
    const [dadosNiveis, setDadosNiveis] = useState([]);
    const [classificacao, setClassificacao] = useState([]);
    const [showEvolucao, setShowEvolucao] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [mostrarExportar, setMostrarExportar] = useState(false);
    const exportRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (exportRef.current && !exportRef.current.contains(e.target)) {
                setMostrarExportar(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAbrirMenuExportacao = async () => {
        try {
            // Verifica permissão de exportação
            const response = await api.get('/estatisticasconsultor/permissons'); 
            
            if (response.data.toggle) {
                setMostrarExportar(estadoAtual => !estadoAtual);
            } else {
                setMostrarExportar(false);
                alert("Não tens permissões para exportar estes dados.");
            }
        } catch (erro) {
            console.error("Erro ao verificar permissão:", erro);
            // Fallback
            setMostrarExportar(estadoAtual => !estadoAtual);
        }
    };

    const handleExportarExcel = () => {
        const livro = XLSX.utils.book_new();

        const folhaKPIs = XLSX.utils.json_to_sheet([{
            "Lugar Atual": kpi.lugar_atual,
            "Total Badges": kpi.total_badges,
            "Objetivos Ativos": kpi.objetivos_ativos,
            "Taxa de Aprovação": kpi.taxa_aprovacao
        }]);

        const folhaEvolucao = XLSX.utils.json_to_sheet(dadosBar);
        const folhaPie = XLSX.utils.json_to_sheet(dadosPie);
        const folhaNiveis = XLSX.utils.json_to_sheet(dadosNiveis);
        const folhaRanking = XLSX.utils.json_to_sheet(classificacao);

        XLSX.utils.book_append_sheet(livro, folhaKPIs, "KPIs");
        XLSX.utils.book_append_sheet(livro, folhaEvolucao, "Evolução");
        XLSX.utils.book_append_sheet(livro, folhaPie, "Conquistados Mês");
        XLSX.utils.book_append_sheet(livro, folhaNiveis, "Badges por Nível");
        XLSX.utils.book_append_sheet(livro, folhaRanking, "Ranking");

        XLSX.writeFile(livro, "Estatisticas_Consultor_Export.xlsx");
        setMostrarExportar(false);
    };

    const handleExportarPDF = () => {
        try {
            const doc = new jsPDF('p', 'pt', 'a4');

            doc.setFontSize(18);
            doc.setTextColor(0, 86, 179);
            doc.text("Estatísticas Individuais - Consultor", 40, 40);

            doc.setFontSize(11);
            doc.setTextColor(80);
            doc.text(`Lugar Atual: ${kpi?.lugar_atual || '-'}`, 40, 70);
            doc.text(`Total de Badges: ${kpi?.total_badges || '-'}`, 40, 90);
            doc.text(`Objetivos Ativos: ${kpi?.objetivos_ativos || '-'}`, 240, 70);
            doc.text(`Taxa de Aprovação: ${kpi?.taxa_aprovacao || '-'}`, 240, 90);

            let posiçãoY_Atual = 140;

            doc.setFontSize(14);
            doc.setTextColor(40);
            doc.text("Evolução de Pontos", 40, posiçãoY_Atual);
            
            autoTable(doc, {
                startY: posiçãoY_Atual + 10,
                head: [["Período", "Pontos"]],
                body: dadosBar.length > 0 
                    ? dadosBar.map(d => [d.label || d.mes || d.semana || "N/A", d.pontos !== undefined ? d.pontos : (d.valor || 0)])
                    : [["Sem dados", "-"]],
                theme: 'striped',
                headStyles: { fillColor: [0, 86, 179] },
                styles: { fontSize: 10 }
            });

            posiçãoY_Atual = doc.lastAutoTable.finalY + 40;

            doc.setFontSize(14);
            doc.text("Badges Conquistados (Por Área)", 40, posiçãoY_Atual);
            
            autoTable(doc, {
                startY: posiçãoY_Atual + 10,
                head: [["Área", "Total Badges"]],
                body: dadosPie.length > 0 
                    ? dadosPie.map(d => [d.Nome_Area || d.nome_area || "N/A", d.total_badges !== undefined ? d.total_badges : (d.valor || 0)])
                    : [["Sem dados neste mês", "-"]],
                theme: 'striped',
                headStyles: { fillColor: [0, 86, 179] },
                styles: { fontSize: 10 }
            });

            posiçãoY_Atual = doc.lastAutoTable.finalY + 40;

            if (posiçãoY_Atual > 700) { doc.addPage(); posiçãoY_Atual = 40; }

            doc.setFontSize(14);
            doc.text("Distribuição por Níveis", 40, posiçãoY_Atual);
            
            autoTable(doc, {
                startY: posiçãoY_Atual + 10,
                head: [["Nível", "Quantidade"]],
                body: dadosNiveis.length > 0
                    ? dadosNiveis.map(d => [d.Nome_Nivel || "N/A", d.total_badges !== undefined ? d.total_badges : (d.valor || 0)])
                    : [["Sem dados", "-"]],
                theme: 'striped',
                headStyles: { fillColor: [0, 86, 179] },
                styles: { fontSize: 10 }
            });

            posiçãoY_Atual = doc.lastAutoTable.finalY + 40;

            if (posiçãoY_Atual > 700) { doc.addPage(); posiçãoY_Atual = 40; }

            doc.setFontSize(14);
            doc.text("Ranking (Top 10)", 40, posiçãoY_Atual);
            
            autoTable(doc, {
                startY: posiçãoY_Atual + 10,
                head: [["#", "Nome", "Pontos"]],
                body: classificacao.length > 0
                    ? classificacao.map((c, index) => [index + 1, c.nome || c.nome_user || "N/A", c.pontos_sempre || c.pontos || 0])
                    : [["Sem dados", "-", "-"]],
                theme: 'striped',
                headStyles: { fillColor: [0, 86, 179] },
                styles: { fontSize: 10 }
            });

            doc.save("Estatisticas_Consultor_Export.pdf");
            setMostrarExportar(false);

        } catch (erro) {
            console.error("Erro CRÍTICO ao gerar o PDF:", erro);
            alert("Erro ao gerar o PDF.");
        }
    };

    // ── Carregar KPIs, conquistados-mês, badges-nível e ranking (uma vez) ──
    useEffect(() => {
        const carregar = async () => {
            try {
                const [resKpi, resPie, resNiveis, resRanking] = await Promise.all([
                    api.get('/estatisticasconsultor/kpi'),
                    api.get('/estatisticasconsultor/conquistados-mes'),
                    api.get('/estatisticasconsultor/badges-nivel'),
                    api.get('/homeconsultor/ranking')
                ]);

                setKpi(resKpi.data || {});
                setDadosPie(resPie.data || []);
                setDadosNiveis((resNiveis.data || []).map(n => ({ ...n, cor: corNivel(n.ID_Nivel) })));
                setClassificacao(resRanking.data || []);
            } catch (erro) {
                console.error('Erro ao carregar estatísticas:', erro);
            } finally {
                setCarregando(false);
            }
        };
        carregar();
    }, []);

    // ── Carregar evolução sempre que o período muda ──
    useEffect(() => {
        const carregar = async () => {
            try {
                const res = await api.get(`/estatisticasconsultor/evolucao/${periodo}`);
                setDadosBar(res.data || []);
            } catch (erro) {
                console.error('Erro ao carregar evolução de pontos:', erro);
                setDadosBar([]);
            }
        };
        carregar();
    }, [periodo]);

    const kpiCards = [
        { label: 'Lugar atual',       valor: kpi.lugar_atual ?? '-',       icone: 'fi fi-br-trophy'  },
        { label: 'Total de badges',   valor: kpi.total_badges ?? '-',     icone: 'fi fi-br-badge'   },
        { label: 'Objetivos Ativos',  valor: kpi.objetivos_ativos ?? '-', icone: 'fi fi-br-target'  },
        { label: 'Taxa de aprovação', valor: kpi.taxa_aprovacao ?? '-',   icone: 'fi fi-br-ribbon'  },
    ];

    const totalPie = dadosPie.reduce((s, x) => s + x.total_badges, 0);
    const totalNiveis = dadosNiveis.reduce((s, x) => s + x.total_badges, 0);

    return (
        <div className="estat-page">

            {/* ── CABEÇALHO ── */}
            <div className="estat-header">
                <h1 className="texto-titulo-principal m-0">Estatísticas</h1>
                <div className="estat-talent-export-wrap" ref={exportRef}>
                    <BotaoAcao
                        variante="primario"
                        icone="fi-br-download"
                        onClick={handleAbrirMenuExportacao}
                    >
                        Exportar
                    </BotaoAcao>
                    {mostrarExportar && (
                        <div className="estat-talent-export-menu">
                            <div className="estat-talent-export-item" onClick={handleExportarExcel}>Excel</div>
                            <div className="estat-talent-export-item" onClick={handleExportarPDF}>PDF</div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── CORPO PRINCIPAL ── */}
            <div className="estat-body">

                {/* COLUNA ESQUERDA — cresce para ocupar espaço disponível */}
                <div className="estat-col-esq">

                    {/* ROW 1 — KPI + Evolução de Pontos */}
                    <div className="estat-row">

                        {/* KPI 2×2 */}
                        <div className="estat-kpi-wrap">
                            <div className="estat-kpi-grid h-100">
                                {kpiCards.map((kpiCard, i) => (
                                    <div key={i} className="estat-kpi-card">
                                        <span className="estat-kpi-label">{kpiCard.label}</span>
                                        <div className="estat-kpi-row">
                                            <i className={`${kpiCard.icone} estat-kpi-icon`} />
                                            <span className="estat-kpi-valor">{carregando && kpiCard.valor === '-' ? '…' : kpiCard.valor}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Evolução de Pontos */}
                        <div className="estat-evolucao-wrap">
                            <div className="estat-card h-100">
                                <div className="estat-card-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <p className="estat-chart-title m-0">Evolução de Pontos</p>
                                        <i className="fi fi-br-expand text-muted" style={{ cursor: 'pointer', fontSize: '12px' }} onClick={() => setShowEvolucao(true)}></i>
                                    </div>
                                    <select className="estat-select" value={periodo} onChange={e => setPeriodo(e.target.value)}>
                                        {PERIODOS.map(p =>
                                            <option key={p.key} value={p.key}>{p.label}</option>
                                        )}
                                    </select>
                                </div>
                                <div style={{ flex: 1, minHeight: 0 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={dadosBar}
                                            margin={{ top: 18, right: 8, left: 8, bottom: 0 }}
                                            barSize={34}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#8fa3b8' }} axisLine={false} tickLine={false} />
                                            <YAxis hide />
                                            <Tooltip contentStyle={TIP} formatter={v => [`${v} pts`, 'Pontos']} />
                                            <Bar dataKey="pontos" fill={COR} radius={[6, 6, 0, 0]}>
                                                <LabelList dataKey="pontos" position="top" style={{ fontSize: '9px', fill: '#8fa3b8' }} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ROW 2 — Pie chart + Badges por Nível */}
                    <div className="estat-row">

                        {/* Donut — Conquistados este mês */}
                        <div className="estat-pie-wrap">
                            <div className="estat-card h-100">
                                <div className="estat-card-header">
                                    <p className="estat-chart-title m-0">Conquistados este mês</p>
                                    <span className="estat-chart-total">{totalPie}</span>
                                </div>
                                <div className="estat-pie-inner">
                                    {/* Donut com total no centro */}
                                    <div className="estat-donut-container">
                                        <PieChart width={160} height={160}>
                                            <Pie data={dadosPieComCores} cx="50%" cy="50%"
                                                innerRadius={48} outerRadius={72}
                                                dataKey="total_badges" strokeWidth={2} stroke="#fff" paddingAngle={2}>
                                                {dadosPieComCores.map((e, i) => <Cell key={i} fill={e.cor} />)}
                                            </Pie>
                                            <Tooltip contentStyle={TIP} formatter={(v, n) => [`${v}`, n]} />
                                        </PieChart>
                                        {/* Número total no buraco do donut */}
                                        <div className="estat-donut-center">
                                            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--fontes)', lineHeight: 1 }}>{totalPie}</div>
                                            <div style={{ fontSize: '9px', color: '#8fa3b8', marginTop: '2px', fontWeight: 500 }}>total</div>
                                        </div>
                                    </div>
                                    {/* Legenda com nº de badges */}
                                    <div className="estat-legenda" style={{ flex: 1, minWidth: 0 }}>
                                        {dadosPieComCores.map((e, i) => (
                                            <div key={i} className="estat-legenda-item" style={{ justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                                    <span className="estat-legenda-dot" style={{ backgroundColor: e.cor, flexShrink: 0 }} />
                                                    <span style={{ fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.Nome_Area}</span>
                                                </div>
                                                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--fontes)', marginLeft: '8px', flexShrink: 0 }}>{e.total_badges}</span>
                                            </div>
                                        ))}
                                        {dadosPieComCores.length === 0 && (
                                            <span style={{ fontSize: '11px', color: '#8fa3b8' }}>Sem conquistas neste mês.</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Badges por Nível */}
                        <div className="estat-niveis-wrap">
                            <div className="estat-card h-100">
                                <div className="estat-card-header">
                                    <p className="estat-chart-title m-0">Badges por Nível</p>
                                    <span className="estat-chart-total">{totalNiveis}</span>
                                </div>
                                <div style={{ flex: 1, minHeight: 0 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={dadosNiveis} layout="vertical"
                                            margin={{ top: 4, right: 36, left: 4, bottom: 4 }}
                                            barSize={20}>
                                            <XAxis type="number" hide />
                                            <YAxis type="category" dataKey="Nome_Nivel"
                                                tick={{ fontSize: 11, fill: '#8fa3b8' }}
                                                axisLine={false} tickLine={false} width={82} />
                                            <Tooltip contentStyle={TIP} formatter={(v) => [`${v} badges`, 'Total']} />
                                            <Bar dataKey="total_badges" radius={[0, 6, 6, 0]}>
                                                {dadosNiveis.map((e, i) => <Cell key={i} fill={e.cor} />)}
                                                <LabelList dataKey="total_badges" position="right"
                                                    style={{ fontSize: '11px', fill: '#8fa3b8', fontWeight: 600 }} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUNA DIREITA — Classificação Geral */}
                <div className="estat-col-dir">
                    <ClassificacaoGeral user={user} classificacao={classificacao} fullHeight={true} maxItems={9} />
                </div>
            </div>

            {/* Modals Extras */}
            {showEvolucao && <EvolucaoModal onClose={() => setShowEvolucao(false)} />}
        </div>
    );
};

export default EstatisticasConsultor;