import api from './api';

/**
 * Normaliza os atributos de um badge incluindo toda a hierarquia organizacional e metadados
 */
function normalizarBadge(b = {}) {
    const area = b.Area ?? b.area;
    const serviceLine = area?.ServiceLine ?? b.ServiceLine ?? b.serviceLine;
    const learningPath = serviceLine?.LearningPath ?? b.LearningPath ?? b.learningPath;
    const nivel = b.Nivel ?? b.nivel;

    return {
        ID_Badge: b.id_badge ?? b.ID_Badge,
        id_badge: b.id_badge ?? b.ID_Badge,
        Nome_Badge: b.nome_badge ?? b.Nome_Badge ?? b.titulo ?? 'Badge',
        nome_badge: b.nome_badge ?? b.Nome_Badge ?? b.titulo ?? 'Badge',

        ID_Area: b.id_area ?? b.ID_Area ?? area?.id_area,
        id_area: b.id_area ?? b.ID_Area ?? area?.id_area,
        Nome_Area: b.nome_area ?? b.Nome_Area ?? area?.nome_area ?? 'Geral',
        nome_area: b.nome_area ?? b.Nome_Area ?? area?.nome_area ?? 'Geral',

        ID_Service_Line: b.id_service_line ?? b.ID_Service_Line ?? serviceLine?.id_service_line ?? null,
        id_service_line: b.id_service_line ?? b.ID_Service_Line ?? serviceLine?.id_service_line ?? null,
        Nome_Service_Line: b.nome_service_line ?? b.Nome_Service_Line ?? serviceLine?.nome_service_line ?? null,
        nome_service_line: b.nome_service_line ?? b.Nome_Service_Line ?? serviceLine?.nome_service_line ?? null,

        ID_Learning_Path: b.id_learning_path ?? b.ID_Learning_Path ?? learningPath?.id_learning_path ?? null,
        id_learning_path: b.id_learning_path ?? b.ID_Learning_Path ?? learningPath?.id_learning_path ?? null,
        Nome_Learning_Path: b.nome_learning_path ?? b.Nome_Learning_Path ?? learningPath?.nome_learning_path ?? null,
        nome_learning_path: b.nome_learning_path ?? b.Nome_Learning_Path ?? learningPath?.nome_learning_path ?? null,

        ID_Nivel: b.id_nivel ?? b.ID_Nivel ?? nivel?.id_nivel ?? null,
        id_nivel: b.id_nivel ?? b.ID_Nivel ?? nivel?.id_nivel ?? null,
        Nome_Nivel: b.nome_nivel ?? b.Nome_Nivel ?? nivel?.nome_nivel ?? null,
        nome_nivel: b.nome_nivel ?? b.Nome_Nivel ?? nivel?.nome_nivel ?? null,

        Pontos_Badge: b.pontos_badge ?? b.Pontos_Badge ?? 100,
        pontos_badge: b.pontos_badge ?? b.Pontos_Badge ?? 100,
        validade: b.validade ?? b.Validade ?? 365,
        Especial: b.especial ?? b.Especial ?? false,
        especial: b.especial ?? b.Especial ?? false,
        imagemBadge: b.imagem ?? b.imagemBadge ?? null,
        imagem: b.imagem ?? b.imagemBadge ?? null,
        descricao: b.descricao_badge ?? b.descricao ?? '',
        descricao_badge: b.descricao_badge ?? b.descricao ?? ''
    };
}

/**
 * Obtém a lista de objetivos do consultor autenticado através do endpoint GET /api/homeconsultor/objetivos
 */
export async function obterObjetivosConsultor() {
    const response = await api.get('/homeconsultor/objetivos');
    const dados = Array.isArray(response.data) ? response.data : [];

    return dados.map(item => ({
        ID_Objetivo: item.id_objetivo ?? item.id,
        ID_Badge: item.id_badge ?? item.badge?.id_badge,
        ID_Utilizador: item.id_utilizador,
        Data_inicial: item.data_inicial,
        Data_Objetivo: item.data_final ?? item.data,
        Data_Conclusao: item.data_conclusao,
        Deleted_Objetivo: item.deleted_objetivo ? 1 : 0,
        progresso: item.progresso ?? 0,
        badge: normalizarBadge(item.badge || item)
    }));
}

/**
 * Cria um novo objetivo para o consultor através do endpoint POST /api/homeconsultor/objetivos
 */
export async function criarObjetivoConsultor({ idBadge, dataFinal }) {
    const response = await api.post('/homeconsultor/objetivos', {
        id_badge: idBadge,
        data_final: dataFinal
    });

    const item = response.data;
    return {
        ID_Objetivo: item.id_objetivo ?? item.id,
        ID_Badge: item.id_badge ?? item.badge?.id_badge,
        ID_Utilizador: item.id_utilizador,
        Data_inicial: item.data_inicial,
        Data_Objetivo: item.data_final ?? item.data,
        Data_Conclusao: item.data_conclusao,
        Deleted_Objetivo: item.deleted_objetivo ? 1 : 0,
        progresso: item.progresso ?? 0,
        badge: normalizarBadge(item.badge || item)
    };
}

/**
 * Obtém os badges disponíveis na BD para propor novos objetivos via GET /api/objetivos/badges
 */
export async function obterBadgesParaPropor() {
    const response = await api.get('/objetivos/badges');
    const dados = Array.isArray(response.data) ? response.data : [];

    return dados.map(normalizarBadge);
}

/**
 * Elimina (soft delete) um objetivo do consultor via DELETE /api/objetivos/:id
 */
export async function removerObjetivoConsultor(idObjetivo) {
    const response = await api.delete(`/objetivos/${idObjetivo}`);
    return response.data;
}
