import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './home_consultor.css';
import {BotaoVerMais} from '../../components/components.jsx'
import user_logo from '../../assets/utilizador.png';
import ClassificacaoModal from '../../components/ClassificacaoModal';
import AtividadeModal from '../../components/AtividadeModal';

const badgesEmProgresso = [
    { id: 1, titulo: "Low Code", icone: "fi-br-bolt", progresso: 80, cor: "#749BDB" },
    { id: 2, titulo: "Low Code", icone: "fi-br-microchip", progresso: 40, cor: "#A3C87A" },
    { id: 3, titulo: "Low Code", icone: "fi-br-bullseye", progresso: 60, cor: "#E6CD73" }
];

const classificacao = [
    { pos: 1, nome: "João Silva", area: "Hybrid Systems", pontos: "374 957", cor: "#FFD700", classe: "ouro" },
    { pos: 2, nome: "João Silva", area: "Hybrid Systems", pontos: "374 957", cor: "#C0C0C0", classe: "prata" },
    { pos: 3, nome: "João Silva", area: "Hybrid Systems", pontos: "374 957", cor: "#CD7F32", classe: "bronze" },
    { pos: 4, nome: "Afonso Moreira", area: "Hybrid System", pontos: "37 455" },
    { pos: 5, nome: "Afonso Moreira", area: "Hybrid System", pontos: "37 455" },
    { pos: 6, nome: "Afonso Moreira", area: "Hybrid System", pontos: "37 455" },
    { pos: 7, nome: "Afonso Moreira", area: "Hybrid System", pontos: "37 455" },
    { pos: 8, nome: "Afonso Moreira", area: "Hybrid System", pontos: "37 455" },
    { pos: 9, nome: "Afonso Moreira", area: "Hybrid System", pontos: "37 455" }
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

const objetivos = [
    { titulo: "Low Code", data: "4/12/2025", progresso: 81, expira: "Expira em: 2 dias, 3 horas" },
    { titulo: "Low Code", data: "4/12/2025", progresso: 81, expira: "Expira em: 2 dias, 3 horas" },
    { titulo: "Low Code", data: "4/12/2025", progresso: 81, expira: "Expira em: 2 dias, 3 horas" }
];

const progressoItems = [
    { titulo: "Especialista técnico", concluidos: 26, total: 102, pct: 25 },
    { titulo: "Low code", concluidos: 5, total: 25, pct: 20 },
    { titulo: "Cloud", concluidos: 2, total: 7, pct: 28 }
];

const HomeConsultor = ({ user, saudacao }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [showClassificacao, setShowClassificacao] = useState(false);
    const [showAtividade, setShowAtividade] = useState(false);

    return (
        <div className="m-4" style={{ color: 'var(--fontes)', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
            <h1>{saudacao}</h1>

            {/* ── Linha 1: Badges + Classificação ───────────────────── */}
            <div className="row g-3 mb-3">

                {/* Badges em Progresso */}
                <div className="col-12 col-xl-8">
                    <div className="badges-container p-4 h-100">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="m-0 fw-bold">{t('badges_progresso')}</h5>
                            <BotaoVerMais onClick={() => navigate('/candidaturas')} tamanho={0.7}/>
                        </div>

                        <div className="badges-grid">
                            {badgesEmProgresso.map((badge, idx) => (
                                <div
                                    className={`badge-col text-center${idx < badgesEmProgresso.length - 1 ? ' badge-col-separator' : ''}`}
                                    key={badge.id}
                                >
                                    {/* Círculo colorido */}
                                    <div
                                        className="circulo-badge mx-auto mb-3"
                                        style={{ backgroundColor: badge.cor }}
                                    >
                                        <i className={`fi ${badge.icone}`}></i>
                                    </div>

                                    <h6 className="fw-bold mb-2">{badge.titulo}</h6>

                                    {/* Progress bar: verde + rosa */}
                                    <div className="badge-progress-wrap">
                                        <div
                                            className="badge-progress-fill"
                                            style={{ width: `${badge.progresso}%` }}
                                        />
                                    </div>

                                    {/* Botão "Mais detalhes" */}
                                    <button className="btn-detalhes-figma mt-2"
                                        onClick={() => navigate('/candidaturas')}>
                                        <i className="fi fi-br-eye"></i>
                                        {t('mais_detalhes')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Classificação Geral */}
                <div className="col-12 col-xl-4">
                    <div className="caixa-branca p-4 h-100">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="m-0 fw-bold">Classificação Geral</h5>
                            <i
                                className="fi fi-br-expand text-muted"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setShowClassificacao(true)}
                            ></i>
                        </div>

                        <div className="d-flex flex-column gap-2">
                            {classificacao.slice(0, 5).map((item, index) => (
                                <div
                                    key={index}
                                    className={`ranking-row ${item.classe || ''}`}
                                >
                                    {/* Posição / Medalha */}
                                    <div className="d-flex align-items-center gap-2">
                                        {item.pos <= 3 ? (
                                            <i
                                                className="fi fi-br-medal"
                                                style={{ color: item.cor, fontSize: '1.2rem', minWidth: '22px' }}
                                            ></i>
                                        ) : (
                                            <span
                                                className="fw-bold"
                                                style={{ minWidth: '22px', fontSize: '0.85rem' }}
                                            >
                                                {item.pos}.
                                            </span>
                                        )}

                                        {/* Avatar */}
                                        <img
                                            src={user_logo}
                                            className="rounded-circle bg-light"
                                            width="28"
                                            height="28"
                                            alt="user"
                                            style={{ objectFit: 'cover' }}
                                        />

                                        {/* Nome + Área */}
                                        <div>
                                            <div className="fw-bold" style={{ fontSize: '0.78rem', lineHeight: 1.2 }}>
                                                {item.nome}
                                            </div>
                                            <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                                                {item.area}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pontos */}
                                    <div className="fw-bold" style={{ fontSize: '0.82rem' }}>
                                        {item.pontos}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Linha 2: Atividade, Objetivos, Progresso ──────────── */}
            <div className="row g-3">

                {/* Atividade Recente */}
                <div className="col-12 col-lg-4">
                    <div className="caixa-branca p-4 h-100 d-flex flex-column" style={{ overflow: 'hidden' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="m-0 fw-bold">{t('atividade_recente')}</h5>
                            <i
                                className="fi fi-br-expand text-muted"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setShowAtividade(true)}
                            ></i>
                        </div>

                        <div className="d-flex flex-column gap-4" style={{ overflow: 'hidden', flex: 1 }}>
                            {atividadeRecente.slice(0, 6).map((item, i) => (
                                <div key={i} className={`atividade-item${item.expirado ? ' expirado' : ''}`}>
                                    <span className="d-flex align-items-center gap-2">
                                        <i className={`fi ${item.icone} ${item.cor}`}></i>
                                        <span className="texto">
                                            {item.textoNegrito && <strong>{item.textoNegrito} </strong>}
                                            {item.texto}
                                        </span>
                                    </span>
                                    <span className="text-muted" style={{ fontSize: '0.7rem', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                                        {item.tempo}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Objetivos Propostos */}
                <div className="col-12 col-lg-4">
                    <div className="caixa-branca p-4 h-100">
                        <h5 className="fw-bold mb-4">{t('objetivos_propostos')}</h5>

                        <div className="d-flex flex-column gap-3">
                            {objetivos.map((obj, i) => (
                                <div key={i} className="objetivo-figma">
                                    {/* Ícone raio */}
                                    <div className="mini-raio">
                                        <i className="fi fi-br-bolt"></i>
                                    </div>

                                    {/* Conteúdo */}
                                    <div className="flex-grow-1">
                                        <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '0.82rem' }}>
                                            <span className="fw-bold">{obj.titulo}</span>
                                            <span className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                                                <i className="fi fi-br-calendar"></i>
                                                {obj.data}
                                            </span>
                                        </div>

                                        {/* Barra de progresso com % dentro */}
                                        <div className="objetivo-progress-wrap">
                                            <div
                                                className="objetivo-progress-fill"
                                                style={{ width: `${obj.progresso}%` }}
                                            >
                                                {obj.progresso}%
                                            </div>
                                        </div>

                                        <div className="text-muted text-end" style={{ fontSize: '0.65rem' }}>
                                            {obj.expira}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Progresso */}
                <div className="col-12 col-lg-4">
                    <div className="caixa-branca p-4 h-100">
                        <h5 className="fw-bold mb-4 text-center">{t('progresso')}</h5>

                        <div className="d-flex flex-column gap-4">
                            {progressoItems.map((prog, i) => (
                                <div key={i}>
                                    <div className="fw-bold" style={{ fontSize: '0.85rem' }}>{prog.titulo}</div>
                                    <div className="progresso-barra-wrap">
                                        <div
                                            className="progresso-barra-fill"
                                            style={{ width: `${prog.pct}%` }}
                                        />
                                    </div>
                                    <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                                        {prog.concluidos} de {prog.total} concluídos
                                    </small>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
            {/* ══ Modal Classificação (Portal) ══ */}
            {showClassificacao && (
                <ClassificacaoModal
                    classificacao={classificacao}
                    onClose={() => setShowClassificacao(false)}
                />
            )}

            {/* ══ Modal Atividade Recente (Portal) ══ */}
            {showAtividade && (
                <AtividadeModal
                    atividades={atividadeRecente}
                    onClose={() => setShowAtividade(false)}
                />
            )}

        </div>
    );
};

export default HomeConsultor;