import React from "react";
import { useTranslation } from "react-i18next";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

import "./components.css";


export function BotaoVerMais({ onClick, tamanho }) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onClick}
      className={`btn btn-sm btn-outline-secondary rounded-3 d-flex align-items-center justify-content-center gap-1 
            ver_mais_btn`}
    >
      <i
        className="fi fi-br-eye d-flex align-items-center"
        style={{ fontSize: `${tamanho}rem` }}
      ></i>
      <span
        className="d-flex align-items-center"
        style={{ fontSize: `${tamanho}rem` }}
      >
        {t("ver_mais")}
      </span>
    </button>
  );
}

export function BotaoAceitar({ onClick, tamanho }) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onClick}
      className={`btn btn-sm btn-outline-secondary rounded-3 d-flex align-items-center justify-content-center gap-1
            aceitar_btn`}
    >
      <i
        className="fi fi-br-check d-flex align-items-center"
        style={{ fontSize: `${tamanho}rem` }}
      ></i>
      <span
        className="d-flex align-items-center"
        style={{ fontSize: `${tamanho}rem` }}
      >
        {t("aceitar")}
      </span>
    </button>
  );
}

export function BotaoRejeitar({ onClick, tamanho }) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onClick}
      className={`btn btn-sm btn-outline-secondary rounded-3 d-flex align-items-center justify-content-center gap-1
            rejeitar_btn`}
    >
      <i
        className="fi fi-br-cross d-flex align-items-center"
        style={{ fontSize: `${tamanho}rem` }}
      ></i>
      <span
        className="d-flex align-items-center"
        style={{ fontSize: `${tamanho}rem` }}
      >
        {t("rejeitar")}
      </span>
    </button>
  );
}



export const GraficoCandidaturas = ({dados_grafico_candidaturas}) => {

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
        <div className="p-3 d-flex flex-column bg-white h-100" style={{ border: 'var(--borda-principal) solid var(--contorno)', borderRadius: 'var(--border-radius-grande)', boxSizing: 'border-box' }}>
            <h5 className="mb-2">{t('titulo_candidaturas')}</h5>
            
            <div className="flex-grow-1" style={{ width: '100%', minHeight: '140px' }}>
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