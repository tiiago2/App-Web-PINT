import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './StatusCandidaturas.css';

const StatusCandidaturas = ({ dados = [] }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const estados = [
        { chave: 'Aceite',     label: 'aceites',     icone: 'fi-br-check',  cor: '#2ebd24', fundo: '#e6f7e5', filtro: 'Aceite' },
        { chave: 'Rejeitada',  label: 'rejeitadas',  icone: 'fi-br-cross',  cor: '#dc2626', fundo: '#fde8e8', filtro: 'Recusada' },
        { chave: 'Em análise', label: 'em_analise',  icone: 'fi-br-clock',  cor: '#0891b2', fundo: '#e0f7fa', filtro: 'Pendente' },
    ];

    const totais = {};
    let totalGeral = 0;

    estados.forEach((e) => {
        const count = dados.filter((s) => s.Status === e.chave).length;
        totais[e.chave] = count;
        totalGeral += count;
    });

    const navegarPara = (filtro) => {
        navigate('/candidaturas', { state: { filtroStatus: filtro } });
    };

    return (
        <div className="sc-card">
            <div className="sc-header">
                <div className="sc-header-texto">
                    <h5 className="sc-titulo">{t('candidaturas')}</h5>
                    <span className="sc-subtitulo">Total de submissões</span>
                </div>
                <span className="sc-total">{totalGeral}</span>
            </div>

            <div className="sc-lista">
                {estados.map((e) => {
                    const count = totais[e.chave];
                    const percentagem = totalGeral > 0 ? Math.round((count / totalGeral) * 100) : 0;

                    return (
                        <button
                            key={e.chave}
                            className="sc-item"
                            onClick={() => navegarPara(e.filtro)}
                            title={`Ver ${t(e.label).toLowerCase()}`}
                        >
                            <div className="sc-linha">
                                <div className="sc-esq">
                                    <div
                                        className="sc-icone-circulo"
                                        style={{ backgroundColor: e.fundo, color: e.cor }}
                                    >
                                        <i className={`fi ${e.icone}`}></i>
                                    </div>
                                    <span className="sc-label">{t(e.label)}</span>
                                </div>
                                <span className="sc-valor" style={{ color: e.cor }}>{count}</span>
                            </div>
                            <div className="sc-barra-wrap">
                                <div
                                    className="sc-barra"
                                    style={{ width: `${percentagem}%`, backgroundColor: e.cor }}
                                ></div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <button
                className="sc-ver-todas"
                onClick={() => navigate('/candidaturas')}
            >
                <span>Ver candidaturas</span>
                <i className="fi fi-br-arrow-right"></i>
            </button>
        </div>
    );
};

export default StatusCandidaturas;
