import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './home_consultor.css';
import { BotaoVerMais, calcularTempoRestante } from '../../components/components.jsx';
import AtividadeRecente from '../../components/AtividadeModal.jsx';
import ClassificacaoGeral from '../../components/ClassificacaoModal.jsx';
import badge_logo from '../../assets/teste_badge.png';

const badgesEmProgresso = [
    { id: 1, titulo: "Low Code", imagem: badge_logo, progresso: 80 },
    { id: 2, titulo: "Low Code", imagem: badge_logo, progresso: 40 },
    { id: 3, titulo: "Low Code", imagem: badge_logo, progresso: 60 }
];



const atividadeRecente = [
    // defs pra meter as cores das notifações bem :verde, amarelo, azul, vermelho e a parte do negrito pra dar url 
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

const objetivos = [
    { titulo: "Low Code", data: "2026-05-23", progresso: 81 },
    { titulo: "Certificação Cloud", data: "2026-05-30", progresso: 40 },
    { titulo: "Formação Agile", data: "2026-06-05", progresso: 15 }
];

const progressoItems = [
    { titulo: "Especialista técnico", concluidos: 26, total: 102, pct: 25 },
    { titulo: "Low code", concluidos: 5, total: 25, pct: 20 },
    { titulo: "Cloud", concluidos: 2, total: 7, pct: 28 }
];

const HomeConsultor = ({ user, saudacao }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="p-3 p-md-4 d-flex flex-column gap-3">
            <div className="flex-shrink-0">
                <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>{saudacao}</h1>
            </div>
            <div className="row gy-3">
                <div className="col-12 col-xl-8 mb-xl-0">
                    <div className="badges-container p-3 d-flex flex-column" style={{ height: '35vh' }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h5 className="m-0" style={{ fontSize: 'clamp(0.9rem, 2vw, 1.1rem)' }}>{t('badges_progresso')}</h5>
                            <BotaoVerMais onClick={() => navigate('/candidaturas')} tamanho={0.7}/>
                        </div>
                        <div className="badges-grid flex-grow-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <style>{`.badges-grid::-webkit-scrollbar { display: none; }`}</style>
                            {badgesEmProgresso.map((badge, idx) => (
                                <div className={`badge-col text-center${idx < badgesEmProgresso.length - 1 ? ' badge-col-separator' : ''}`} key={badge.id}>
                                    <img className="rounded-circle badge_logo_candidaturas mb-2" src={badge.imagem} style={{ width: '100px', height: '100px', minWidth: '100px', minHeight: '100px', objectFit: 'cover' }} />
                                    <h6 className="fw-medium mb-2">{badge.titulo}</h6>
                                    <div className="badge-progress-wrap">
                                        <div className="badge-progress-fill" style={{ width: `${badge.progresso}%` }} />
                                    </div>
                                    <button className="btn-detalhes-figma mt-2" onClick={() => navigate('/candidaturas')}>
                                        <i className="fi fi-br-eye"></i> {t('mais_detalhes')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="col-12 col-xl-4">
                    <ClassificacaoGeral user={user} />
                </div>
            </div>
            <div className="row gy-3 align-items-start">
                {/* Atividade Recente */}
                <div className="col-12 col-lg-4 mb-4 mb-lg-0">
                    <AtividadeRecente atividades={atividadeRecente} />
                </div>
                {/* Objetivos Propostos */}
                <div className="col-12 col-lg-4">
                    <div className="border border-2 rounded-4 bg-white p-3 d-flex flex-column" style={{ height: '35vh' }}>
                        <h5 className="mb-1">{t('objetivos_propostos')}</h5>
                        <div className="d-flex flex-column gap-2 justify-content-between flex-grow-1 overflow-y-auto pe-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {objetivos.map((obj, i) => (
                                <div key={i} className="objetivo-figma">
                                    <div className="mini-raio"><i className="fi fi-br-bolt"></i></div>
                                    <div className="flex-grow-1">
                                        <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '0.82rem' }}>
                                            <span className="fw-bold">{obj.titulo}</span>
                                            <span className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                                                <i className="fi fi-br-calendar"></i>{obj.data}
                                            </span>
                                        </div>
                                        <div className="objetivo-progress-wrap">
                                            <div className="objetivo-progress-fill" style={{ width: `${obj.progresso}%` }}>{obj.progresso}%</div>
                                        </div>
                                        <div className="text-muted text-end" style={{ fontSize: '0.65rem' }}>{calcularTempoRestante(obj.data)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                {/* Progresso */}
                <div className="col-12 col-lg-4">
                    <div className="border border-2 rounded-4 bg-white p-3 d-flex flex-column" style={{ height: '35vh' }}>
                        <h5 className="mb-1">{t('progresso')}</h5>
                        <div className="d-flex flex-column gap-2 justify-content-between flex-grow-1 overflow-y-auto pe-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {progressoItems.map((prog, i) => (
                                <div key={i} className="progresso-figma">
                                    <div className="d-flex justify-content-between align-items-end mb-1">
                                        <div className="fw-bold" style={{ fontSize: '0.85rem' }}>{prog.titulo}</div>
                                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                                            <strong style={{ color: 'var(--barra_lateral)' }}>{prog.concluidos}</strong> / {prog.total}
                                        </div>
                                    </div>
                                    <div className="progresso-barra-wrap m-0" style={{ height: '10px' }}>
                                        <div className="progresso-barra-fill" style={{ width: `${prog.pct}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeConsultor;