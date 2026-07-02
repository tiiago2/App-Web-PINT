import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import './AtividadeModal.css';

// Mapeia a classe Bootstrap para a variante do ícone no modal
const corParaVariante = {
    'text-success': 'success',
    'text-danger':  'danger',
    'text-primary': 'primary',
    'text-warning': 'warning',
    'text-info': 'info',
    'text-fontes': 'fontes'
};

const configuracaoNotificacao = {
    1: { icone: 'fi-br-check', cor: 'text-success' },      // Sucesso / Aceite / Concluído
    2: { icone: 'fi-br-badge', cor: 'text-fontes' },      // Atualização / Badge
    3: { icone: 'fi-br-document', cor: 'text-fontes' },    // Candidatura / Submissão
    4: { icone: 'fi-br-cross', cor: 'text-danger' },       // Rejeição / Expirado
    5: { icone: 'fi-br-info', cor: 'text-fontes' }         // Informação Genérica
};

const obterConfiguracaoNotificacao = (item) => {
    if (item.icone && item.cor) return { icone: item.icone, cor: item.cor };
    const tipo = item.tipo_notificacao || 5;
    return configuracaoNotificacao[tipo] || configuracaoNotificacao[5];
};

const formatarTempo = (dataString) => {
    if (!dataString) return '';
    // Se já vier como texto relativo ("Há 2 horas"), retornar tal como está
    if (typeof dataString === 'string' && dataString.toLowerCase().startsWith('há')) return dataString;

    const data = new Date(dataString);
    if (isNaN(data.getTime())) return dataString; // fallback se não for uma data válida

    const agora = new Date();
    const diffEmSegundos = Math.floor((agora - data) / 1000);

    if (diffEmSegundos < 60) return 'Agora mesmo';
    
    const diffEmMinutos = Math.floor(diffEmSegundos / 60);
    if (diffEmMinutos < 60) return `Há ${diffEmMinutos} ${diffEmMinutos === 1 ? 'minuto' : 'minutos'}`;
    
    const diffEmHoras = Math.floor(diffEmMinutos / 60);
    if (diffEmHoras < 24) return `Há ${diffEmHoras} ${diffEmHoras === 1 ? 'hora' : 'horas'}`;
    
    const diffEmDias = Math.floor(diffEmHoras / 24);
    if (diffEmDias < 30) return `Há ${diffEmDias} ${diffEmDias === 1 ? 'dia' : 'dias'}`;
    
    const diffEmMeses = Math.floor(diffEmDias / 30);
    if (diffEmMeses < 12) return `Há ${diffEmMeses} ${diffEmMeses === 1 ? 'mês' : 'meses'}`;
    
    const diffEmAnos = Math.floor(diffEmMeses / 12);
    return `Há ${diffEmAnos} ${diffEmAnos === 1 ? 'ano' : 'anos'}`;
};

/* ── 1. COMPONENTE INTERNO: O MODAL (PORTAL) ──────────────── */
const AtividadeModalContent = ({ atividades, onClose }) => {
    const { t } = useTranslation();

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return ReactDOM.createPortal(
        <div className="ativ-overlay" onClick={onClose}>
            <div className="ativ-modal" onClick={e => e.stopPropagation()}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5>{t('atividade_recente')}</h5>
                    <button className="ativ-btn-close" onClick={onClose}>
                        <i className="fi fi-br-cross"></i>
                    </button>
                </div>

                <div className="ativ-lista">
                    {atividades.map((item, i) => {
                        const config = obterConfiguracaoNotificacao(item);
                        return (
                            <div key={i} className="ativ-item">
                                <div className={`ativ-icon-wrap ${corParaVariante[config.cor] || 'primary'}`}>
                                    <i className={`fi ${config.icone}`}></i>
                                </div>
                                <div className="ativ-texto">
                                    {item.textoNegrito
                                        ? <><strong>{item.textoNegrito}</strong>{' '}{item.texto}</>
                                        : item.texto
                                    }
                                </div>
                                <div className="ativ-tempo">{formatarTempo(item.tempo)}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>,
        document.body
    );
};

/* ── 2. COMPONENTE EXPORTADO: O WIDGET PRINCIPAL ────────── */
const AtividadeRecente = ({ atividades, fullHeight }) => {
    const { t } = useTranslation();
    const [showModal, setShowModal] = useState(false);

    if (!atividades || atividades.length === 0) return null;

    return (
        <div className={`p-3 d-flex flex-column bg-white ${fullHeight ? 'h-100' : ''}`} style={{ border: 'var(--borda-principal) solid var(--contorno)', borderRadius: 'var(--border-radius-grande)', boxSizing: 'border-box', height: fullHeight ? '100%' : '35vh' }}>
            
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h5>{t('atividade_recente')}</h5>
                <i className="fi fi-br-expand text-muted me-1" style={{ cursor: 'pointer' }} onClick={() => setShowModal(true)}></i>
            </div>

            {/* Lista de atividades alinhada ao topo */}
            <div className="ativ-widget-lista flex-grow-1 overflow-y-auto pe-1">
                {atividades.slice(0, 6).map((item, i) => {
                    const config = obterConfiguracaoNotificacao(item);
                    return (
                        <div key={i} className="ativ-widget-item">
                            <span className="d-flex align-items-center gap-2 ativ-widget-texto">
                                <i className={`fi ${config.icone} ${config.cor}`}></i>
                                <span className="texto">
                                    {item.textoNegrito && <strong>{item.textoNegrito} </strong>}
                                    {item.texto}
                                </span>
                            </span>
                            <span className="ativ-widget-tempo">
                                {formatarTempo(item.tempo)}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* O modal pop-up continua a funcionar igual */}
            {showModal && (
                <AtividadeModalContent 
                    atividades={atividades} 
                    onClose={() => setShowModal(false)} 
                />
            )}
        </div>
    );
};

export default AtividadeRecente;