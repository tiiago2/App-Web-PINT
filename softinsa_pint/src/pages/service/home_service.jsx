import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './home_service.css';
import ClassificacaoGeral from '../../components/ClassificacaoModal.jsx';
import AtividadeRecente from '../../components/AtividadeModal.jsx';
import CandidaturaModal from '../../components/CandidaturaModal.jsx';
import badge_logo from '../../assets/teste_badge.png';
import {BotaoVerMais, BotaoAceitar, BotaoRejeitar, GraficoCandidaturas} from '../../components/components.jsx'

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

const HomeService = ({ user, saudacao }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [selectedCandidature, setSelectedCandidature] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const idGuardado = localStorage.getItem("utilizador_id");
    const roleGuardada = localStorage.getItem("role_softinsa");
    
    const [infoCandidaturas, setInfoCandidaturas] = useState([]);
    const [dados_grafico_candidaturas, setDados_grafico_candidaturas] = useState([
        { nome: 'aceites', quantidade: null, cor: '#3bb413' },    
        { nome: 'rejeitadas', quantidade: null, cor: '#de2121' }
    ]);
    
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
    
            const getGrafCandidaturas = async() => {
                if (!localStorage.getItem('token_softinsa')) {
                    setDados_grafico_candidaturas(prev => prev.map(item => ({ ...item, quantidade: 0 })));
                    return;
                }
                
                try {
                    const res = await api.get(`/commun/candidaturasweek/${idGuardado}`);
                    
                    setDados_grafico_candidaturas(prevDados => 
                        prevDados.map(item => {
                            if (item.nome === 'aceites') {
                                return { ...item, quantidade: res.data.aceites };
                            }
                            if (item.nome === 'rejeitadas') {
                                return { ...item, quantidade: res.data.rejeitadas };
                            }
                            return item;
                        })
                    );
                    
                } catch(erro) {
                    console.error('Erro ao buscar dados do gráfico:', erro);
                    setDados_grafico_candidaturas(prev => prev.map(item => ({ ...item, quantidade: null })));
                }
            }
    
            buscarCandidaturas();
            getGrafCandidaturas();
        }, []);

    const RenderCandidaturas = () => {
        if (!Array.isArray(infoCandidaturas) || infoCandidaturas.length === 0) {
            return <div className="col-12 text-muted">Sem candidaturas</div>;
        }

        return infoCandidaturas.slice(0, 3).map((candidatura, index) => {
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

    return (
        <div className="home-service-container gap-3">
            <div className="flex-shrink-0">
                <h1 className="texto-titulo-principal m-0">{saudacao}</h1>
            </div>
            
            <div className="d-flex flex-column gap-3" style={{ flex: '1 1 auto' }}>
                
                {/* Primeira linha: Candidaturas Recentes e Gráfico de Candidaturas */}
                <div className="row g-2 g-md-3 primeira-linha-home">
                    <div className="col-12 col-xl-8 candidaturas-column">
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
                        <div className="grafico-estatistica-container" style={{ overflow: 'hidden' }}>
                            <GraficoCandidaturas dados_grafico_candidaturas={dados_grafico_candidaturas}/>
                        </div>
                    </div>
                </div>

                {/* Segunda linha: Atividade Recente, Classificação Geral e Classificação da Service Line */}
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
                        <div style={{ height: '100%', overflow: 'hidden' }}>
                            <ClassificacaoGeral 
                                user={user}
                                filtroInicial="service_line"
                                filtroValorInicial="Hybrid Systems"
                                titulo={t('service_line')}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Detalhes da Candidatura */}
            {isModalOpen && selectedCandidature && (
                <CandidaturaModal 
                    candidature={selectedCandidature}
                    user={users.find(u => u.id === selectedCandidature.user_id)}
                    badge={badges.find(b => b.id === selectedCandidature.badge_id)}
                    onClose={() => setIsModalOpen(false)}
                    onAccept={(id) => {
                        console.log("Aceitou candidatura:", id);
                    }}
                    onReject={(id) => {
                        console.log("Rejeitou candidatura:", id);
                    }}
                />
            )}
        </div>
    );
};

export default HomeService;
