import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './home_talent.css';
import ClassificacaoGeral from '../../components/ClassificacaoModal.jsx';
import AtividadeRecente from '../../components/AtividadeModal.jsx';
import badge_logo from '../../assets/teste_badge.png';
import {BotaoVerMais, BotaoAceitar, BotaoRejeitar, GraficoCandidaturas} from '../../components/components.jsx'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Label, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';


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

    const idGuardado = localStorage.getItem("utilizador_id");
    const roleGuardada = localStorage.getItem("role_softinsa");

    const { t } = useTranslation();
    const navigate = useNavigate();

    const [infoCandidaturas, setInfoCandidaturas] = useState();

    useEffect(() => {
        const buscarCandidaturas = async () => {
            if (!localStorage.getItem('token_softinsa')) {
                setInfoCandidaturas([]);
                return;
            }

            try {
                const res = await api.get('/hometalent/candidaturas');

                setInfoCandidaturas(Array.isArray(res.data) ? res.data : []);
                console.log('Dados recebidos com sucesso:', res.data);
            } catch (erro) {
                console.error('Erro ao buscar candidaturas:', erro);
                setInfoCandidaturas([]);
            }
        };

        buscarCandidaturas();
    }, []);

    const RenderCandidaturas = () => {
        if (!Array.isArray(infoCandidaturas) || infoCandidaturas.length === 0) {
            return <div className="col-12 text-muted">Sem candidaturas</div>;
        }

        return infoCandidaturas.map((candidatura, index) => {
            const badge = candidatura?.Badges || candidatura?.Badge || null;
            const utilizador = candidatura?.Utilizador || null;
            const area = badge?.Area?.nome_area || badge?.nome_area || '—';
            const nomeBadge = badge?.nome_badge || 'Badge';
            const nomeUser = utilizador?.nome_user || 'Utilizador';
            const imagemUser = utilizador?.imagem_perfil || '';
            const imagemBadge = badge?.imagem || badge_logo;

            return (
                <div key={candidatura?.id_submissao || index} className="col-12 col-sm-6 col-xl-4">
                    <div className="card text-center border-0 p-1" style={{ height: '100%' }}>
                        <div className="mx-auto mt-2 rounded-circle d-flex align-items-center justify-content-center">
                            <img className="rounded-circle badge_logo_candidaturas" src={imagemBadge} alt={nomeBadge} />
                        </div>

                        <h6 className="mt-2 mb-0">{nomeBadge}</h6>

                        <div className="d-flex align-items-center justify-content-center my-1">
                            <div>
                                <img className="mx-3 rounded-1 user_image_candidaturas" src={imagemUser} alt={nomeUser} />
                            </div>
                            <div className="text-start">
                                <div className="fw-medium nome_candidatura" style={{ fontSize: '0.8rem', lineHeight: '0.8' }}>{nomeUser}</div>
                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>{area}</div>
                            </div>
                        </div>

                        <div className="text-muted mb-2" style={{ fontSize: '0.7rem' }}>{candidatura?.data_submissao || '—'}</div>

                        <div className="d-flex justify-content-center gap-1">
                            <BotaoVerMais onClick={() => navigate('/candidaturas')} tamanho={0.7}/>
                            <BotaoAceitar onClick={() => navigate('/candidaturas')} tamanho={0.7}/>
                            <BotaoRejeitar onClick={() => navigate('/candidaturas')} tamanho={0.7}/>
                        </div>
                    </div>
                </div>
            );
        });
    };

  return(
    <div className="home-talent-container gap-3">
        <div className="flex-shrink-0">
            <h1 className="texto-titulo-principal m-0">{saudacao}</h1>
        </div>
        
        <div className="d-flex flex-column gap-3" style={{ flex: '1 1 auto' }}>
            {/* Primeira linha: Candidaturas e Gráfico Estatísticas */}
            <div className="row g-2 g-md-3 primeira-linha-home">
                <div className="col-12 col-xl-8 candidaturas-column">
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h5 className="m-0" style={{ fontSize: 'clamp(0.9rem, 2vw, 1.1rem)' }}>{t('candidaturas_recentes')}</h5>
                            {infoCandidaturas !== null && infoCandidaturas !== undefined && (
                                <BotaoVerMais onClick={() => navigate('/candidaturas')} tamanho={0.6} />
                            )}
                        </div>
                        <div className="row g-2 g-md-3">
                            {RenderCandidaturas()}       
                        </div>
                    </div>
                </div>
                <div className="col-12 col-xl-4" style={{ minHeight: 0 }}>
                    <div className="grafico-estatistica-container" style={{ overflow: 'hidden' }}>
                        <GraficoEstatistica/>
                    </div>
                </div>
            </div>

            {/* Segunda linha: Atividade, Classificação e Gráfico Candidaturas */}
            <div className="row g-2 g-md-3 segunda-linha-home">
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
                    <div className="grafico-wrapper" style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <GraficoCandidaturas dados_grafico_candidaturas={dados_grafico_candidaturas}/>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default HomeTalent;