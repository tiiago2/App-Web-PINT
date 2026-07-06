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
    const res = await api.get("/me/badges");
    const dados = res.data;

    if (!dados || !Array.isArray(dados.badges)) {
        throw new Error("Resposta invalida ao obter estado pessoal dos badges.");
    }

    if (dados.id_area_consultor === undefined || dados.id_area_consultor === null) {
        throw new Error("Resposta invalida ao obter area do consultor.");
    }

    return {
        idAreaConsultor: dados.id_area_consultor,
        badges: dados.badges,
    };
}

export async function obterBadgesConsultorNormalizados(opcoes = {}) {
    const [catalogo, estadoPessoal] = await Promise.all([
        obterBadgesCatalogo(),
        obterEstadoBadgesConsultor(),
    ]);

    return juntarCatalogoComEstadoConsultor(
        catalogo,
        estadoPessoal.badges,
        {
            ...opcoes,
            idAreaConsultor: estadoPessoal.idAreaConsultor,
        }
    );
}
