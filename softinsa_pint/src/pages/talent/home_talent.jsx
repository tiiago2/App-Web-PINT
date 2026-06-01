import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './home_talent.css';
import ClassificacaoGeral from '../../components/ClassificacaoModal.jsx';
import AtividadeRecente from '../../components/AtividadeModal.jsx';
import badge_logo from '../../assets/teste_badge.png';
import {BotaoVerMais, BotaoAceitar, BotaoRejeitar, GraficoCandidaturas} from '../../components/components.jsx'
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



const atividadeRecente = [
    { icone: "fi-br-check", cor: "text-success", texto: "Low code concluído", tempo: "Há 2 horas", expirado: false },
    { icone: "fi-br-badge", cor: "text-warning", textoNegrito: "Administrador1", texto: "atualizou Low Code", tempo: "Há 2 horas", expirado: false },
    { icone: "fi-br-document", cor: "text-primary", textoNegrito: "Candidataste-te ao Low Code", tempo: "Há 2 horas", expirado: false },
    { icone: "fi-br-cross", cor: "text-danger", texto: "Low Code expirado", tempo: "Há 2 horas", expirado: true },
    { icone: "fi-br-check", cor: "text-success", texto: "Low Code concluído", tempo: "Há 2 horas", expirado: false },
    { icone: "fi-br-cross", cor: "text-danger", texto: "Low Code expirado", tempo: "Há 2 horas", expirado: true },
    { icone: "fi-br-document", cor: "text-primary", textoNegrito: "Candidataste-te ao Low Code", tempo: "Há 2 horas", expirado: false },
    { icone: "fi-br-check", cor: "text-success", texto: "Low Code concluído", tempo: "Há 2 horas", expirado: false },
    { icone: "fi-br-badge", cor: "text-warning", textoNegrito: "Administrador1", texto: "atualizou Low Code", tempo: "Há 2 horas", expirado: false }
];
//---------------------------------------------------------------------------------------------------------------------------------



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
                    
                    <Tooltip isAnimationActive={false}/>
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

    const { t } = useTranslation();
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
                <div className="col-12 col-sm-6 col-xl-4">
                    <div className="card text-center border-0 p-1" style={{ height: '100%' }}>
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="p-3 p-md-4 flex-shrink-0">
            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0' }}>{saudacao}</h1>
        </div>
        
        <div style={{ flex: '1 1 auto', overflow: 'auto', paddingLeft: '1rem', paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Primeira linha: Candidaturas e Gráfico Estatísticas */}
            <div className="row g-2 g-md-3" style={{ flex: '0 0 auto' }}>
                <div className="col-12 col-xl-8">
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h5 className="m-0" style={{ fontSize: 'clamp(0.9rem, 2vw, 1.1rem)' }}>{t('candidaturas_recentes')}</h5>
                            <BotaoVerMais onClick={() => navigate('/candidaturas')} tamanho={0.6} />
                        </div>
                        <div className="row g-2 g-md-3">
                            {RenderCandidaturas()}       
                        </div>
                    </div>
                </div>
                <div className="col-12 col-xl-4" style={{ minHeight: 0 }}>
                    <div style={{ height: '250px', overflow: 'hidden' }}>
                        <GraficoEstatistica/>
                    </div>
                </div>
            </div>

            {/* Segunda linha: Atividade, Classificação e Gráfico Candidaturas */}
            <div className="row g-2 g-md-3" style={{ flex: '1 1 auto', minHeight: 0 }}>
                <div className="col-12 col-sm-6 col-xl-4" style={{ minHeight: 0 }}>
                    <div style={{ height: '100%', overflow: 'hidden' }}>
                        <AtividadeRecente atividades={atividadeRecente} />
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-xl-4" style={{ minHeight: 0 }}>
                    <div style={{ height: '100%', overflow: 'hidden' }}>
                        <ClassificacaoGeral user={user}/>
                    </div>
                </div>
                <div className="col-12 col-xl-4" style={{ minHeight: 0 }}>
                    <div style={{ height: '100%', overflow: 'hidden' }}>
                        <GraficoCandidaturas dados_grafico_candidaturas={dados_grafico_candidaturas}/>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default HomeTalent;