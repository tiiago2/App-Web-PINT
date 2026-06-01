import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './home_service.css';
import ClassificacaoGeral from '../../components/ClassificacaoModal.jsx';
import AtividadeRecente from '../../components/AtividadeModal.jsx';
import CandidaturaModal from '../../components/CandidaturaModal.jsx';
import badge_logo from '../../assets/teste_badge.png';
import {BotaoVerMais, BotaoAceitar, BotaoRejeitar, GraficoCandidaturas} from '../../components/components.jsx'

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

    const RenderCandidaturas = () => {
        return candidaturas.map((candidatura) => {
            const badge_escolhido = badges.find((search_badge) => search_badge.id === candidatura.badge_id);
            const user_escolhido = users.find((search_user) => search_user.id === candidatura.user_id);

            if (!badge_escolhido || !user_escolhido) {
                console.warn(`Erro na BD: Dados em falta na candidatura ID ${candidatura.id}`);
                return null; 
            }

            return(
                <div key={candidatura.id} className="col-12 col-sm-6 col-xl-4">
                    <div className="card text-center border-0 p-1" style={{ height: '100%' }}>
                        <div className="mx-auto mt-2 rounded-circle d-flex align-items-center justify-content-center">
                            <img className="rounded-circle badge_logo_candidaturas" src={badge_escolhido.imagem} alt={badge_escolhido.titulo}/>
                        </div>
                                        
                        <h6 className="mt-2 mb-0">{badge_escolhido.titulo}</h6>
                                        
                        <div className="d-flex align-items-center justify-content-center my-1">
                            <div>
                                <img className="mx-3 rounded-1 user_image_candidaturas" src={user.foto} alt={user.nome}/>
                            </div>
                            <div className="text-start">
                                <div className="fw-medium nome_candidatura" style={{ fontSize: '0.8rem', lineHeight: '0.8' }}>{user_escolhido.nome}</div>
                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>{user_escolhido.area}</div>
                            </div>
                        </div>
                                        
                        <div className="text-muted mb-2" style={{ fontSize: '0.7rem' }}>{candidatura.data}</div>
                                        
                        <div className="d-flex justify-content-center gap-1">
                            <BotaoVerMais 
                                onClick={() => {
                                    setSelectedCandidature(candidatura);
                                    setIsModalOpen(true);
                                }} 
                                tamanho={0.7}
                            />
                            <BotaoAceitar onClick={() => navigate('/candidaturas')} tamanho={0.7}/>
                            <BotaoRejeitar onClick={() => navigate('/candidaturas')} tamanho={0.7}/>
                        </div>
                    </div>
                </div>
            )
        });
    };

    return (
        <div className="p-3 p-md-4 d-flex flex-column gap-3" style={{ height: '100%', overflow: 'hidden' }}>
            <div className="flex-shrink-0">
                <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0' }}>{saudacao}</h1>
            </div>
            
            <div className="flex-grow-1" style={{ overflowY: 'auto', paddingLeft: '0.5rem', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`.flex-grow-1::-webkit-scrollbar { display: none; }`}</style>
                
                {/* Primeira linha: Candidaturas Recentes (col-xl-8) e Gráfico de Candidaturas (col-xl-4) */}
                <div className="row gy-3">
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
                    <div className="col-12 col-xl-4">
                        <div style={{ height: '100%', minHeight: '250px' }}>
                            <GraficoCandidaturas dados_grafico_candidaturas={dados_grafico_candidaturas}/>
                        </div>
                    </div>
                </div>

                {/* Segunda linha: Atividade Recente, Classificação Geral e Classificação da Service Line */}
                <div className="row gy-3 align-items-start">
                    <div className="col-12 col-md-4">
                        <div style={{ height: '100%', minHeight: '250px' }}>
                            <AtividadeRecente atividades={atividadeRecente} />
                        </div>
                    </div>
                    <div className="col-12 col-md-4">
                        <div style={{ height: '100%', minHeight: '250px' }}>
                            <ClassificacaoGeral user={user}/>
                        </div>
                    </div>
                    <div className="col-12 col-md-4">
                        <div style={{ height: '100%', minHeight: '250px' }}>
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
