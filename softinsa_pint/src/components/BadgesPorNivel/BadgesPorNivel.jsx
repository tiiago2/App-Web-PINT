import React from 'react';
import { useTranslation } from 'react-i18next';
import './BadgesPorNivel.css';

const CORES_NIVEL = [
    { principal: '#5EA500', fundo: '#eaf5d6' },
    { principal: '#1c8cae', fundo: '#d8eef5' },
    { principal: '#E17100', fundo: '#fbe9cf' },
    { principal: '#AE012F', fundo: '#f6d6dc' },
    { principal: '#45556C', fundo: '#dde3eb' },
];

const BadgesPorNivel = ({ dados = [] }) => {
    const { t } = useTranslation();

    return (
        <div className="bpn-lista">
            {dados.map((item, idx) => {
                const valor = Math.max(0, Math.min(100, item.valor || 0));
                const cor = CORES_NIVEL[idx % CORES_NIVEL.length];

                return (
                    <div key={idx} className="bpn-item">
                        <span className="bpn-label">{t(item.Nome_Nivel)}</span>
                        <div className="bpn-barra-wrap">
                            <div
                                className="bpn-barra"
                                style={{
                                    width: `${valor}%`,
                                    background: `linear-gradient(90deg, ${cor.principal} 0%, ${cor.principal}cc 100%)`
                                }}
                            ></div>
                        </div>
                        <span className="bpn-valor" style={{ color: cor.principal }}>{item.total_badges ?? 0}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default BadgesPorNivel;
