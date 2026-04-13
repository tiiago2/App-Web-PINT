import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './home_talent.css';

import badge_logo from '../../assets/teste_badge.png';
import {BotaoVerMais, BotaoAceitar, BotaoRejeitar} from '../../components/components.jsx'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Label, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const users = [
    { id: 1, nome: "João Silva", area: "Hybrid Systems" },
    { id: 2, nome: "Maria Ana", area: "Mobile Solutions" }
];

const badges = [
    { id: 1, titulo: "Low Code", imagem: badge_logo, pontos: 100, descricao:"blablablablablablablabla"},
    { id: 2, titulo: "React Native", imagem: badge_logo, pontos: 85, descricao:"blablablablablablablabla"}
];

const candidaturas = [
    { id: 1, user_id: 1, badge_id: 1, data: "2026-04-10T09:15:00" },
    { id: 2, user_id: 2, badge_id: 2, data: "2026-04-09T14:30:00" },
    { id: 3, user_id: 1, badge_id: 2, data: "2026-04-08T10:00:00" }
];

const dados_grafico_candidaturas = [
    { nome: 'aceites', quantidade: 405, cor: '#3bb413' },    
    { nome: 'rejeitadas', quantidade: 15, cor: '#de2121' }, 
    { nome: 'em_analise', quantidade: 25, cor: '#1c8cae' }  
];

const dados_linhas = [
    { periodo: 'jan', media_badges: 1.5, pontos: 120, atribuicoes: 15 },
    { periodo: 'fev', media_badges: 2.1, pontos: 180, atribuicoes: 20 },
    { periodo: 'mar', media_badges: 2.8, pontos: 250, atribuicoes: 28 },
    { periodo: 'abr', media_badges: 3.5, pontos: 310, atribuicoes: 35 },
];

const GraficoCandidaturas = () => {

    const {t} = useTranslation();

    const total = dados_grafico_candidaturas.reduce((acumulador, dado) => {
        return acumulador + dado.quantidade;
    }, 0);

    const dados_traduzidos = dados_grafico_candidaturas.map((dado) => {
        return {
            ...dado,
            nome: t(dado.nome) // Traduz "Aceites", "Rejeitadas", etc., logo aqui!
        };
    });

    return (
        <div className="border border-2 rounded-4 p-2 d-flex flex-column h-100">
            <h5 className="ms-1 mb-2">{t('titulo_candidaturas')}</h5>
            
            <div className="flex-grow-1" style={{ width: '100%', minHeight: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            cx="50%"
                            cy="50%"
                            data={dados_traduzidos}
                            innerRadius="60%"
                            outerRadius="85%" 
                            dataKey="quantidade"
                            nameKey="nome"
                            stroke="none"
                            isAnimationActive={false}
                            labelLine={false}
                            label={({ cx, cy, index }) => {
                                if (index !== 0) return null; 
                                return (
                                    <g>
                                        <text 
                                            x={cx} 
                                            y={cy - 5} 
                                            textAnchor="middle" 
                                            dominantBaseline="central" 
                                            className="fw-bold" 
                                            style={{ fontSize: '28px', fill: 'var(--fontes)'}}
                                        >
                                            {total}
                                        </text>
                                        <text 
                                            x={cx} 
                                            y={cy + 15} 
                                            textAnchor="middle" 
                                            dominantBaseline="central" 
                                            style={{ fontSize: '12px', fill: 'var(--fontes)' }}
                                        >
                                            {t('total')}
                                        </text>
                                    </g>
                                );
                            }}
                        >
                            {dados_traduzidos.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.cor} />
                            ))}
                        </Pie>
                        
                        <Tooltip />
                        
                        <Legend 
                            layout="vertical" 
                            verticalAlign="middle" 
                            align="right" 
                            iconType="circle" 
                            wrapperStyle={{ right: 0 }}
                        /> 
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

const GraficoEstatistica = () => {

    const {t} = useTranslation();

    const dados_traduzidos = dados_linhas.map((dado) => {
        return {
            ...dado,
            nome: t(dado.periodo)
        };
    });

    return (
        <div className="border border-2 rounded-4 p-2 d-flex flex-column h-100">
            <h5 className="ms-1 mb-2">{t('evo_users')}</h5>
            
            <div className="flex-grow-1" style={{ width: '100%', minHeight: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dados_traduzidos} margin={{ top: 12, right: 25, left: -20, bottom: 0 }}>
    
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
                    
                    <XAxis dataKey="nome" tick={{ fontSize: 11 }} tickMargin={10} />
                    
                    <YAxis tick={{ fontSize: 11 }} />
                    
                    <Tooltip />
                    <Legend 
                        verticalAlign="bottom"
                        iconType="circle"
                        formatter={(value) => <span style={{ fontSize: '12px'}}>{value}</span>}
                        wrapperStyle={{
                            paddingLeft: '7vh',
                            paddingBottom: '1vh',
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center'}}/>

                    <Line 
                        type="monotone" 
                        dataKey="media_badges"
                        name={t('media_badges')}
                        stroke="#009966" 
                        strokeWidth={3} 
                        dot={false} 
                        activeDot={false}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="pontos" 
                        name={t('pontos')} 
                        stroke="#39639C" 
                        strokeWidth={3} 
                        dot={false} 
                        activeDot={false}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="atribuicoes" 
                        name={t('atribuicoes')} 
                        stroke="#C40003" 
                        strokeWidth={3} 
                        dot={false} 
                        activeDot={false}
                    />
                </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

const HomeTalent = ({ user, saudacao }) => {

    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const RenderCandidaturas = () => {
        return candidaturas.map((candidatura) => {
            
            const badge_escolhido = badges.find((search_badge) => search_badge.id === candidatura.badge_id);
            
            const user_escolhido = users.find((search_user) => search_user.id === candidatura.user_id);

            if (!badge_escolhido || !user_escolhido) {
                console.warn(`Erro na BD: Dados em falta na candidatura ID ${candidatura.id}`);
                return null; 
            }

            return(
                <div className="col-4">
                    <div className="card text-center border-0 p-1">
                        <div className="mx-auto mt-2 rounded-circle d-flex align-items-center justify-content-center">
                            <img className="rounded-circle badge_logo_candidaturas" src={badge_escolhido.imagem}/>
                        </div>
                                        
                        <h6 className="mt-2 mb-0">{badge_escolhido.titulo}</h6>
                                        
                        <div className="d-flex align-items-center justify-content-center my-1">
                            <div>
                                <img className="mx-3 rounded-1 user_image_candidaturas" src={user.foto}/>
                            </div>
                            <div className="text-start">
                                <div className="fw-medium nome_candidatura" style={{ fontSize: '0.8rem', lineHeight: '0.8' }}>{user_escolhido.nome}</div>
                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>{user_escolhido.area}</div>
                            </div>
                        </div>
                                        
                        <div className="text-muted mb-2" style={{ fontSize: '0.7rem' }}>{candidatura.data}</div>
                                        
                                        
                        <div className="d-flex justify-content-center gap-1">
                            <BotaoVerMais onClick={() => navigate('/candidaturas')} tamanho={0.7}/>
                            <BotaoAceitar onClick={() => navigate('/candidaturas')} tamanho={0.7}/>
                            <BotaoRejeitar onClick={() => navigate('/candidaturas')} tamanho={0.7}/>
                        </div>
                    </div>
                </div>
            )
        });
    };

  return(
    <div className="m-4">
        <div className="row">
            <h1>{saudacao}</h1>
        </div>
        <div className="row mt-3">
            <div className="col-8" style={{ maxHeight: '35vh', overflowY: 'auto', overflowX: 'hidden' }} id="candidaturas_container">
                <div className="d-flex justify-content-between align-items-center">
                    <div className="ps-2">
                        <h4 className="m-0">{t('candidaturas_recentes')}</h4>
                    </div>
                    <div>
                        <BotaoVerMais onClick={() => navigate('/candidaturas')}  tamanho={0.7} />
                    </div>
                </div>
                <div className="row">
                    {RenderCandidaturas()}       
                </div>
            </div>
            <div className="col-4" id="grafico1_container">
                <GraficoEstatistica/>
            </div>
        </div>
        <div className="row mt-3">
            <div className="col-4" id="atividade_container">

            </div>
            <div className="col-4" id="classificacao_container">

            </div>
            <div className="col-4" id="grafico2_container">
                <GraficoCandidaturas/>
            </div>
        </div>
    </div>
  );
};

export default HomeTalent;