import api from "./api";
import {
    normalizarAreas,
    normalizarServiceLines,
    normalizarLearningPaths,
} from "../utils/gestaoNormalizadores";

// --- UTILIZADORES ELEGÍVEIS PARA LÍDER ---
export async function obterLideresElegiveis(idServiceLine) {
    try {
        const params = idServiceLine ? { idServiceLine } : {};
        const res = await api.get("/editar/utilizadores-lideres", { params });
        return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
        console.error("Erro ao obter líderes elegíveis:", error);
        return [];
    }
}

// --- ÁREAS ---
export async function obterAreas() {
    try {
        const res = await api.get("/editar/areas");
        return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
        console.error("Erro ao obter áreas:", error);
        return [];
    }
}

export async function obterAreasNormalizadas() {
    const areas = await obterAreas();
    return normalizarAreas(areas);
}

export async function criarArea(dados) {
    const res = await api.post("/editar/areas", dados);
    return res.data;
}

export async function atualizarArea(id, dados) {
    const res = await api.put(`/editar/areas/${id}`, dados);
    return res.data;
}

export async function removerArea(id) {
    const res = await api.delete(`/editar/areas/${id}`);
    return res.data;
}

// --- SERVICE LINES ---
export async function obterServiceLines() {
    try {
        const res = await api.get("/editar/service-lines");
        return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
        console.error("Erro ao obter service lines:", error);
        return [];
    }
}

export async function obterServiceLinesNormalizadas() {
    const serviceLines = await obterServiceLines();
    return normalizarServiceLines(serviceLines);
}

export async function criarServiceLine(dados) {
    const res = await api.post("/editar/service-lines", dados);
    return res.data;
}

export async function atualizarServiceLine(id, dados) {
    const res = await api.put(`/editar/service-lines/${id}`, dados);
    return res.data;
}

export async function removerServiceLine(id) {
    const res = await api.delete(`/editar/service-lines/${id}`);
    return res.data;
}

// --- LEARNING PATHS ---
export async function obterLearningPaths() {
    try {
        const res = await api.get("/editar/learning-paths");
        return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
        console.error("Erro ao obter learning paths:", error);
        return [];
    }
}

export async function obterLearningPathsNormalizados() {
    const learningPaths = await obterLearningPaths();
    return normalizarLearningPaths(learningPaths);
}

export async function criarLearningPath(dados) {
    const res = await api.post("/editar/learning-paths", dados);
    return res.data;
}

export async function atualizarLearningPath(id, dados) {
    const res = await api.put(`/editar/learning-paths/${id}`, dados);
    return res.data;
}

export async function removerLearningPath(id) {
    const res = await api.delete(`/editar/learning-paths/${id}`);
    return res.data;
}