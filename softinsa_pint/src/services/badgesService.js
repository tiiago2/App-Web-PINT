import api from "./api";
import {
    normalizarBadgesCatalogo,
    juntarCatalogoComEstadoConsultor,
} from "../utils/badgesNormalizadores";

export async function obterBadgesCatalogo() {
    try {
        const res = await api.get("/badges");

        if (!Array.isArray(res.data)) {
            throw new Error("Resposta inválida ao obter catálogo de badges.");
        }

        return res.data;
    } catch (error) {
        console.error("Erro ao obter catálogo de badges:", error);
        throw error;
    }
}

export async function obterBadgesCatalogoNormalizados() {
    const badges = await obterBadgesCatalogo();
    return normalizarBadgesCatalogo(badges);
}

export async function obterBadge(id) {
    const res = await api.get(`/badges/${id}`);
    return res.data;
}

export async function criarBadge(dados) {
    const res = await api.post("/badges", dados);
    return res.data;
}

export async function atualizarBadge(id, dados) {
    const res = await api.put(`/badges/${id}`, dados);
    return res.data;
}

export async function removerBadge(id) {
    const res = await api.delete(`/badges/${id}`);
    return res.data;
}

export async function obterEstadoBadgesConsultor() {
    return [];
}

export async function obterBadgesConsultorNormalizados(opcoes = {}) {
    const badges = await obterBadgesCatalogo();
    const estados = await obterEstadoBadgesConsultor();

    return juntarCatalogoComEstadoConsultor(badges, estados, opcoes);
}
