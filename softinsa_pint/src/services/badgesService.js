import api from "./api";
import {
    normalizarBadgesCatalogo,
    juntarCatalogoComEstadoConsultor,
} from "../utils/badgesNormalizadores";

function obterImagemFile(dados = {}, imagemFile) {
    return imagemFile ?? dados.imagemFile ?? null;
}

function isUrlHttpValida(valor) {
    if (typeof valor !== "string") {
        return false;
    }

    try {
        const url = new URL(valor);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

function isDataUrl(valor) {
    return typeof valor === "string" && valor.trim().toLowerCase().startsWith("data:");
}

function normalizarDadosJsonBadge(dados = {}) {
    const dadosJson = { ...dados };
    delete dadosJson.imagemFile;

    if (isDataUrl(dadosJson.imagem) || !isUrlHttpValida(dadosJson.imagem)) {
        delete dadosJson.imagem;
    }

    return dadosJson;
}

function acrescentarCampoFormData(formData, chave, valor) {
    if (valor === undefined) {
        return;
    }

    if (valor === null) {
        formData.append(chave, "");
        return;
    }

    if (Array.isArray(valor) || typeof valor === "object") {
        formData.append(chave, JSON.stringify(valor));
        return;
    }

    formData.append(chave, String(valor));
}

function criarFormDataBadge(dados = {}, imagemFile) {
    const formData = new FormData();

    Object.entries(dados).forEach(([chave, valor]) => {
        if (chave === "imagem" || chave === "imagemFile") {
            return;
        }

        acrescentarCampoFormData(formData, chave, valor);
    });

    formData.append("imagem", imagemFile);
    return formData;
}

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

export async function criarBadge(dados, imagemFile = null) {
    const ficheiroImagem = obterImagemFile(dados, imagemFile);
    const payload = ficheiroImagem
        ? criarFormDataBadge(dados, ficheiroImagem)
        : normalizarDadosJsonBadge(dados);

    const res = await api.post("/badges", payload);
    return res.data;
}

export async function atualizarBadge(id, dados, imagemFile = null) {
    const ficheiroImagem = obterImagemFile(dados, imagemFile);
    const payload = ficheiroImagem
        ? criarFormDataBadge(dados, ficheiroImagem)
        : normalizarDadosJsonBadge(dados);

    const res = await api.put(`/badges/${id}`, payload);
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

export async function obterSugestoesBadgesConsultor() {
    const res = await api.get("/me/badges/sugeridos");
    const dados = res.data;

    if (!dados || !Array.isArray(dados.sugestoes)) {
        throw new Error("Resposta invalida ao obter sugestoes de badges.");
    }

    return {
        idUtilizador: dados.id_utilizador,
        total: Number(dados.total ?? dados.sugestoes.length),
        sugestoes: dados.sugestoes.map((sugestao) => ({
            id_badge: Number(sugestao.id_badge),
            nome_badge: String(sugestao.nome_badge ?? ""),
            justificacao: String(sugestao.justificacao ?? ""),
        })),
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

export async function obterTodosRequisitos() {
    const res = await api.get("/badges/requisitos/todos");
    return res.data;
}
