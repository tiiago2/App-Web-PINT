/* ── Utilitários para a página de Estatísticas do Service Line ── */

const nomesMeses = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez'
];

const nomesMesesCompletos = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

/* Devolve o nome abreviado do mês para tradução (ex: 'jun') */
export const getMesAbrev = (data) => nomesMeses[data.getMonth()];

/* Devolve o nome completo do mês para tradução (ex: 'junho') */
export const getMesCompleto = (data) => nomesMesesCompletos[data.getMonth()];

/* Formata data como DD/MM */
export const formatarDataCurta = (data) => {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}`;
};

/* Gerador pseudo-aleatório determinístico para não "saltar" a cada render */
const pseudoRandom = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

const valorMock = (seed, min, max) =>
    Math.floor(pseudoRandom(seed) * (max - min + 1)) + min;

/* Gera dados mock para o gráfico "Badges atribuídos" consoante o período */
export const getDadosBadgesAtribuidos = (periodo, t) => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const dia = hoje.getDate();

    switch (periodo) {
        case 'semana': {
            /* Últimos 7 dias (inclusive hoje) */
            const dados = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(hoje);
                d.setDate(dia - i);
                dados.push({
                    chave: `dia_${i}`,
                    label: formatarDataCurta(d),
                    atribuidos: valorMock(d.getTime(), 2, 9)
                });
            }
            return dados;
        }

        case 'mes': {
            /* Semanas do mês atual, começando no dia 1 */
            const dados = [];
            const ultimoDia = new Date(ano, mes + 1, 0);
            const totalDias = ultimoDia.getDate();

            for (let inicio = 1; inicio <= totalDias; inicio += 7) {
                const dataInicio = new Date(ano, mes, inicio);
                const label = `${dataInicio.getDate()}/${dataInicio.getMonth() + 1} ${t(getMesCompleto(dataInicio))}`;
                dados.push({
                    chave: `semana_${inicio}`,
                    label,
                    atribuidos: valorMock(dataInicio.getTime(), 5, 30)
                });
            }
            return dados;
        }

        case 'trimestre': {
            /* 3 meses: mês atual + 2 anteriores */
            const dados = [];
            for (let i = 2; i >= 0; i--) {
                const m = mes - i;
                const data = new Date(ano, m, 1);
                dados.push({
                    chave: getMesAbrev(data),
                    label: t(getMesCompleto(data)),
                    atribuidos: valorMock(data.getTime(), 20, 100)
                });
            }
            return dados;
        }

        case 'ano': {
            /* Janeiro até ao mês atual */
            const dados = [];
            for (let m = 0; m <= mes; m++) {
                const data = new Date(ano, m, 1);
                dados.push({
                    chave: getMesAbrev(data),
                    label: t(getMesCompleto(data)),
                    atribuidos: valorMock(data.getTime(), 30, 150)
                });
            }
            return dados;
        }

        default:
            return [];
    }
};

/* Calcula métricas resumidas a partir dos dados do gráfico */
export const getTotalAtribuidos = (dados) =>
    dados.reduce((soma, item) => soma + item.atribuidos, 0);
