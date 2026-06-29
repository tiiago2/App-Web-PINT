import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';


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

// Funções para gerar dados dinâmicos baseados no dia de hoje
const gerarSemana = () => {
    const dados = [];
    const hoje = new Date();
    // Anda 7 dias para trás
    for (let i = 6; i >= 0; i--) {
        const data = new Date();
        data.setDate(hoje.getDate() - i);
        // Cria a string "Dia/Mês"
        const label = `${data.getDate()}/${data.getMonth() + 1}`;
        dados.push({ label, pontos: Math.floor(Math.random() * 300) + 50 });
    }
    return dados;
};

const gerarMes = () => {
    const dados = [];
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);

    let diaAtual = new Date(primeiroDia);
    
    while (diaAtual <= ultimoDia) {
        const inicioSemana = new Date(diaAtual);
        
        // O getDay() devolve 0 para Domingo, 1 para Seg, etc.
        // Queremos saber quantos dias faltam para Domingo para fechar a semana.
        let diasAteDomingo = diaAtual.getDay() === 0 ? 0 : 7 - diaAtual.getDay();
        
        let fimSemana = new Date(diaAtual);
        fimSemana.setDate(diaAtual.getDate() + diasAteDomingo);
        
        // A semana não pode passar do último dia do mês
        if (fimSemana > ultimoDia) fimSemana = new Date(ultimoDia);

        const label = `${inicioSemana.getDate()} a ${fimSemana.getDate()}/${mes + 1}`;
        dados.push({ label, pontos: Math.floor(Math.random() * 1000) + 200 });

        // Avança o cursor para o dia a seguir ao fim desta semana
        diaAtual = new Date(fimSemana);
        diaAtual.setDate(diaAtual.getDate() + 1);
    }
    return dados;
};

const gerarSempre = () => {
    // Vamos simular que a pessoa entrou há 5 anos (Janeiro de 2021) para testar os trimestres
    const dataEntrada = new Date(2021, 0, 1); 
    const hoje = new Date();
    
    // Calcula a diferença em meses entre hoje e a data de entrada
    const totalMeses = (hoje.getFullYear() - dataEntrada.getFullYear()) * 12 + (hoje.getMonth() - dataEntrada.getMonth());
    
    const dados = [];
    
    // Se a pessoa estiver na empresa há 2 anos (24 meses) ou menos, mostramos os meses.
    if (totalMeses <= 24) {
        const mesAtual = new Date(dataEntrada);
        while (mesAtual <= hoje) {
            const nomeMes = mesAtual.toLocaleString('pt-PT', { month: 'short' });
            const anoCurto = mesAtual.getFullYear().toString().slice(2);
            dados.push({ 
                label: `${nomeMes}/${anoCurto}`, 
                pontos: Math.floor(Math.random() * 2000) + 500 
            });
            mesAtual.setMonth(mesAtual.getMonth() + 1);
        }
    } 
    // Se a pessoa estiver há MAIS de 2 anos, agrupamos por TRIMESTRE (T1, T2, T3, T4)
    else {
        let anoLoop = dataEntrada.getFullYear();
        let triLoop = Math.floor(dataEntrada.getMonth() / 3) + 1; // 1, 2, 3 ou 4
        
        const anoFim = hoje.getFullYear();
        const triFim = Math.floor(hoje.getMonth() / 3) + 1;
        
        while (anoLoop < anoFim || (anoLoop === anoFim && triLoop <= triFim)) {
            const anoCurto = anoLoop.toString().slice(2);
            dados.push({
                label: `T${triLoop} ${anoCurto}`, // Ex: "T1 21", "T2 21"
                pontos: Math.floor(Math.random() * 8000) + 2000 // Pontos trimestrais
            });
            
            triLoop++;
            if (triLoop > 4) {
                triLoop = 1;
                anoLoop++;
            }
        }
    }
    
    return dados;
};

const gerarSemestre = () => {
    const dados = [];
    const hoje = new Date();
    const mesAtual = hoje.getMonth(); 
    const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const inicioSemestre = mesAtual < 6 ? 0 : 6;
    for (let i = inicioSemestre; i <= mesAtual; i++) {
        dados.push({
            label: nomesMeses[i],
            pontos: Math.floor(Math.random() * 1000) + 500
        });
    }
    return dados;
};

const gerarAno = () => {
    const dados = [];
    const hoje = new Date();
    const mesAtual = hoje.getMonth(); 
    const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    for (let i = 0; i <= mesAtual; i++) {
        dados.push({
            label: nomesMeses[i],
            pontos: Math.floor(Math.random() * 1000) + 500
        });
    }
    return dados;
};

const dadosMock = {
    'Semana': gerarSemana(),
    'Mês': gerarMes(),
    'Semestre': gerarSemestre(),
    'Ano': gerarAno(),
    'Sempre': gerarSempre()
};

const EvolucaoModal = ({ onClose }) => {

    const [filtro, setFiltro] = useState('Semestre');

    // Bloquear scroll do body quando modal está aberto
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const dadosAtuais = dadosMock[filtro];

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
                    {Object.keys(dadosMock).map((opcao) => {
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
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dadosAtuais} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                            <XAxis dataKey="label" axisLine={false} tickLine={false} interval={0} tick={{ fontSize: 11, fill: '#8fa3b8' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8fa3b8' }} />
                            <Tooltip 
                                contentStyle={TIP} 
                                cursor={{ fill: '#f1f5f9' }} 
                                formatter={(value) => [`${value} pontos`, 'Total']} 
                            />
                            <Bar dataKey="pontos" radius={[4, 4, 0, 0]} maxBarSize={60}>
                                {dadosAtuais.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill="#39639C" />
                                ))}
                                <LabelList dataKey="pontos" position="top" style={{ fontSize: '12px', fill: '#8fa3b8', fontWeight: 600 }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default EvolucaoModal;
