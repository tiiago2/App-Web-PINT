import api from "./api";
import {
    normalizarBadgesCatalogo,
    juntarCatalogoComEstadoConsultor,
} from "../utils/badgesNormalizadores";

export async function obterBadgesCatalogo() {
    try {
        const res = await api.get("/editar/badges");
        return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
        console.error("Erro ao obter catálogo de badges:", error);
        return [];
    }
}

export async function obterBadgesCatalogoNormalizados() {
    const badges = await obterBadgesCatalogo();
    return normalizarBadgesCatalogo(badges);
}

export async function atualizarBadge(id, dados) {
    const res = await api.put(`/editar/badges/${id}`, dados);
    return res.data;
}

export async function removerBadge(id) {
    const res = await api.delete(`/editar/badges/${id}`);
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