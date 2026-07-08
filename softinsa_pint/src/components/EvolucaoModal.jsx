import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import api from '../services/api.js';

// Estilos de tooltip partilhados
const TIP = {
    backgroundColor: '#fff',
    border: 'none',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    fontSize: '12px',
    fontWeight: 500,
    color: '#1e293b',
    padding: '8px 12px'
};

const PERIODOS = ['Semana', 'Mês', 'Semestre', 'Ano', 'Sempre'];
const PERIODOS_KEY = { 'Semana': 'semana', 'Mês': 'mes', 'Semestre': 'semestre', 'Ano': 'ano', 'Sempre': 'sempre' };

const EvolucaoModal = ({ onClose }) => {

    const [filtro, setFiltro] = useState('Semestre');
    const [dados, setDados] = useState([]);
    const [carregando, setCarregando] = useState(true);

    // Bloquear scroll do body quando modal está aberto
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    // Carregar dados sempre que o filtro muda
    useEffect(() => {
        const carregar = async () => {
            setCarregando(true);
            try {
                const periodoKey = PERIODOS_KEY[filtro];
                const res = await api.get(`/estatisticasconsultor/evolucao/${periodoKey}`);
                setDados(res.data || []);
            } catch (erro) {
                console.error('Erro ao carregar evolução de pontos:', erro);
                setDados([]);
            } finally {
                setCarregando(false);
            }
        };
        carregar();
    }, [filtro]);

    return ReactDOM.createPortal(
        <div className="classif-overlay" onClick={onClose} style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)'
        }}>
            <div className="bg-white rounded-4 p-4 d-flex flex-column" onClick={e => e.stopPropagation()} style={{
                width: '90%', maxWidth: '900px', height: '80vh', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
                {/* Header do Modal */}
                <div className="d-flex justify-content-between align-items-start mb-4">
                    <div>
                        <h4 className="fw-bold m-0 mb-1" style={{ color: 'var(--fontes)' }}>Evolução de Pontos</h4>
                        <p className="text-muted m-0" style={{ fontSize: '14px' }}>Histórico detalhado do teu progresso</p>
                    </div>
                    <button className="evolucao-modal-close-btn" onClick={onClose}>
                        <i className="fi fi-br-cross"></i>
                    </button>
                </div>

                {/* Filtros estilo Google Finance */}
                <div className="d-flex mb-4" style={{ gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                    {PERIODOS.map((opcao) => {
                        const isSelected = filtro === opcao;
                        return (
                            <button 
                                key={opcao}
                                onClick={() => setFiltro(opcao)}
                                style={{
                                    background: isSelected ? '#eff6ff' : 'transparent',
                                    color: isSelected ? '#2563eb' : '#64748b',
                                    border: 'none',
                                    padding: '6px 16px',
                                    borderRadius: '20px',
                                    fontWeight: isSelected ? 600 : 500,
                                    fontSize: '13px',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer'
                                }}
                            >
                                {opcao}
                            </button>
                        );
                    })}
                </div>

                {/* Gráfico principal */}
                <div style={{ flex: 1, minHeight: 0, marginTop: '10px' }}>
                    {carregando ? (
                        <div className="d-flex align-items-center justify-content-center h-100">
                            <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }}>
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : dados.length === 0 ? (
                        <div className="d-flex align-items-center justify-content-center h-100 text-muted" style={{ fontSize: '14px' }}>
                            Sem dados de evolução para este período.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dados} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                <XAxis dataKey="label" axisLine={false} tickLine={false} interval={0} tick={{ fontSize: 11, fill: '#8fa3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8fa3b8' }} />
                                <Tooltip 
                                    contentStyle={TIP} 
                                    cursor={{ fill: '#f1f5f9' }} 
                                    formatter={(value) => [`${value} pontos`, 'Total']} 
                                />
                                <Bar dataKey="pontos" radius={[4, 4, 0, 0]} maxBarSize={60}>
                                    {dados.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill="#39639C" />
                                    ))}
                                    <LabelList dataKey="pontos" position="top" style={{ fontSize: '12px', fill: '#8fa3b8', fontWeight: 600 }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default EvolucaoModal;