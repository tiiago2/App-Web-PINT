import React, { useState } from 'react';
import {
    BarChart, Bar,
    PieChart, Pie, Cell,
    ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, LabelList
} from 'recharts';
import ClassificacaoGeral from '../../components/ClassificacaoModal.jsx';
import EvolucaoModal from '../../components/EvolucaoModal.jsx';
import { mockClassificacao } from '../../defs/classificacao_mock.js';
import './estatisticas_consultor.css';

/* ── DADOS MOCKUP ─────────────────────────── */
const kpiCards = [
    { label: 'Lugar atual',       valor: '4',    icone: 'fi fi-br-trophy'  },
    { label: 'Total de badges',   valor: '1000', icone: 'fi fi-br-badge'   },
    { label: 'Objetivos Ativos',  valor: '36',   icone: 'fi fi-br-target'  },
    { label: 'Taxa de aprovação', valor: '85%',  icone: 'fi fi-br-ribbon'  },
];

const dadosBarPorSemestre = {
    '1º Semestre 2026': [
        { mes: 'Jan', pontos: 300  }, { mes: 'Fev', pontos: 600  },
        { mes: 'Mar', pontos: 800  }, { mes: 'Abr', pontos: 1300 },
        { mes: 'Mai', pontos: 1050 }, { mes: 'Jun', pontos: 650  },
    ],
    '2º Semestre 2025': [
        { mes: 'Jul', pontos: 700  }, { mes: 'Ago', pontos: 500  },
        { mes: 'Set', pontos: 900  }, { mes: 'Out', pontos: 1100 },
        { mes: 'Nov', pontos: 800  }, { mes: 'Dez', pontos: 1200 },
    ],
    '1º Semestre 2025': [
        { mes: 'Jan', pontos: 200  }, { mes: 'Fev', pontos: 400  },
        { mes: 'Mar', pontos: 600  }, { mes: 'Abr', pontos: 900  },
        { mes: 'Mai', pontos: 750  }, { mes: 'Jun', pontos: 500  },
    ],
};

const dadosPie = [
    { ID_Area: 1, Nome_Area: 'Low Code',       total_badges: 5,  cor: '#4CAF50' },
    { ID_Area: 2, Nome_Area: 'Hybrid Systems', total_badges: 35, cor: '#39639C' },
    { ID_Area: 3, Nome_Area: 'Cloud',          total_badges: 20, cor: '#F44336' },
    { ID_Area: 4, Nome_Area: 'Cibersegúrança', total_badges: 20, cor: '#FF9800' },
    { ID_Area: 5, Nome_Area: 'Data & AI',      total_badges: 5,  cor: '#9C27B0' },
];

/* Badges por nível — gradiente de azuis claros a escuros (Júnior → Líder) */
const dadosNiveis = [
    { ID_Nivel: 1, Nome_Nivel: 'Júnior',       total_badges: 18, cor: '#b3cde8' },
    { ID_Nivel: 2, Nome_Nivel: 'Intermédio',   total_badges: 12, cor: '#7fafd4' },
    { ID_Nivel: 3, Nome_Nivel: 'Sénior',       total_badges: 8,  cor: '#4d90bf' },
    { ID_Nivel: 4, Nome_Nivel: 'Especialista', total_badges: 5,  cor: '#2d6da3' },
    { ID_Nivel: 5, Nome_Nivel: 'Líder',        total_badges: 2,  cor: '#1a4d7a' },
];


const COR = '#39639C';
const TIP = { borderRadius: 'var(--border-radius-pequeno)', border: 'var(--borda-principal) solid var(--contorno)', fontSize: '11px' };
const GAP = 'var(--gap-default-seccoes)';

const EstatisticasConsultor = () => {
    const [sem, setSem] = useState('1º Semestre 2026');
    const [showEvolucao, setShowEvolucao] = useState(false);

    return (
        <div className="estat-page">

            {/* ── CABEÇALHO ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <h1 className="texto-titulo-principal m-0">Estatísticas</h1>
                <button className="estat-btn-exportar">Exportar</button>
            </div>

            <div style={{ display: 'flex', gap: GAP, flex: 1, alignItems: 'stretch' }}>

                {/* COLUNA ESQUERDA — flex:1, cresce para ocupar espaço disponível */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: GAP }}>

                    {/*
                      ROW 1 — KPI + Evolução de Pontos
                      Usamos flex: 1 para que esta fila divida exatamente o espaço com a fila 2
                      e se alinhe de forma milimétrica com o fundo da Classificação Geral!
                    */}
                    <div style={{ display: 'flex', gap: GAP, flex: 1, minHeight: 0 }}>

                        {/* KPI 2×2 — ocupa o espaço restante à esquerda */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="estat-kpi-grid h-100">
                                {kpiCards.map((kpi, i) => (
                                    <div key={i} className="estat-kpi-card">
                                        <span className="estat-kpi-label">{kpi.label}</span>
                                        <div className="estat-kpi-row">
                                            <i className={`${kpi.icone} estat-kpi-icon`} />
                                            <span className="estat-kpi-valor">{kpi.valor}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Evolução de Pontos — bar chart com dropdown de semestre
                            Largura fixa: 390px = 1.3 × 300px (largura da classificação) */}
                        <div style={{ width: '390px', flexShrink: 0 }}>
                            <div className="estat-card h-100">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <p className="estat-chart-title m-0">Evolução de Pontos</p>
                                        <i className="fi fi-br-expand text-muted" style={{ cursor: 'pointer', fontSize: '12px' }} onClick={() => setShowEvolucao(true)}></i>
                                    </div>
                                    <select className="estat-select" value={sem} onChange={e => setSem(e.target.value)}>
                                        {Object.keys(dadosBarPorSemestre).map(s =>
                                            <option key={s} value={s}>{s}</option>
                                        )}
                                    </select>
                                </div>
                                <div style={{ flex: 1, minHeight: 0 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={dadosBarPorSemestre[sem]}
                                            margin={{ top: 18, right: 8, left: 8, bottom: 0 }}
                                            barSize={34}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                            <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#8fa3b8' }} axisLine={false} tickLine={false} />
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

                    {/*
                      ROW 2 — Pie chart + retângulo vazio
                      O retângulo vazio fica reservado até haver ideia para o conteúdo.
                      Usamos flex: 1 para garantir o alinhamento perfeito na base com a Classificação Geral.
                    */}
                    <div style={{ display: 'flex', gap: GAP, flex: 1, minHeight: 0 }}>

                        {/* Donut — Atribuídos este mês */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="estat-card h-100">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexShrink: 0 }}>
                                    <p className="estat-chart-title m-0">Atribuídos este mês</p>
                                    <span className="estat-chart-total">{dadosPie.reduce((s, x) => s + x.total_badges, 0)}</span>
                                </div>
                                <div className="estat-pie-inner">
                                    {/* Donut com total no centro */}
                                    <div style={{ position: 'relative', flexShrink: 0, width: 160, height: 160 }}>
                                        <PieChart width={160} height={160}>
                                            <Pie data={dadosPie} cx="50%" cy="50%"
                                                innerRadius={48} outerRadius={72}
                                                dataKey="total_badges" strokeWidth={2} stroke="#fff" paddingAngle={2}>
                                                {dadosPie.map((e, i) => <Cell key={i} fill={e.cor} />)}
                                            </Pie>
                                            <Tooltip contentStyle={TIP} formatter={(v, n) => [`${v}`, n]} />
                                        </PieChart>
                                        {/* Número total no buraco do donut */}
                                        <div style={{
                                            position: 'absolute', top: '50%', left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            textAlign: 'center', pointerEvents: 'none'
                                        }}>
                                            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--fontes)', lineHeight: 1 }}>{dadosPie.reduce((s, x) => s + x.total_badges, 0)}</div>
                                            <div style={{ fontSize: '9px', color: '#8fa3b8', marginTop: '2px', fontWeight: 500 }}>total</div>
                                        </div>
                                    </div>
                                    {/* Legenda com nº de badges */}
                                    <div className="estat-legenda" style={{ flex: 1, minWidth: 0 }}>
                                        {dadosPie.map((e, i) => (
                                            <div key={i} className="estat-legenda-item" style={{ justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                                    <span className="estat-legenda-dot" style={{ backgroundColor: e.cor, flexShrink: 0 }} />
                                                    <span style={{ fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.Nome_Area}</span>
                                                </div>
                                                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--fontes)', marginLeft: '8px', flexShrink: 0 }}>{e.total_badges}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Badges por Nível — barra horizontal com gradiente de azuis */}
                        <div style={{ width: '390px', flexShrink: 0 }}>
                            <div className="estat-card h-100">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexShrink: 0 }}>
                                    <p className="estat-chart-title m-0">Badges por Nível</p>
                                    <span className="estat-chart-total">{dadosNiveis.reduce((s, x) => s + x.total_badges, 0)}</span>
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

                {/*
                  COLUNA DIREITA — Classificação Geral
                  width: 300px fixo → base para o cálculo 1.3×
                  fullHeight={true} → o componente usa height:100% em vez de 35vh
                  maxItems={9}     → mostra 9 lugares (homepage usa o default=5)
                */}
                <div className="h-100" style={{ width: '300px', flexShrink: 0 }}>
                    <ClassificacaoGeral classificacao={mockClassificacao} fullHeight={true} maxItems={9} />
                </div>
            </div>

            {/* Modals Extras */}
            {showEvolucao && <EvolucaoModal onClose={() => setShowEvolucao(false)} />}
        </div>
    );
};

export default EstatisticasConsultor;
