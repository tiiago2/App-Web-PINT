export function normalizarBadgeCatalogo(badge) {
    const id = badge.id_badge ?? badge.idBadge ?? badge.id;

    const nome =
        badge.nome_badge ??
        badge.nomeBadge ??
        badge.nome ??
        "Badge sem nome";

    const descricao =
        badge.descricao_badge ??
        badge.descricaoBadge ??
        badge.descricao ??
        "";

    const imagem = badge.imagem ?? badge.imagemBadge ?? null;

    const idArea = badge.id_area ?? badge.idArea ?? null;
    const nomeArea =
        badge.nome_area ??
        badge.nomeArea ??
        badge.area ??
        "Sem Área";

    const idServiceLine = badge.id_service_line ?? badge.idServiceLine ?? null;
    const nomeServiceLine =
        badge.nome_service_line ??
        badge.nomeServiceLine ??
        badge.serviceLine ??
        "Sem Service Line";

    const idLearningPath = badge.id_learning_path ?? badge.idLearningPath ?? null;
    const nomeLearningPath =
        badge.nome_learning_path ??
        badge.nomeLearningPath ??
        badge.learningPath ??
        "Sem Learning Path";

    const idNivel = badge.id_nivel ?? badge.idNivel ?? null;
    const nomeNivel =
        badge.nome_nivel ??
        badge.nomeNivel ??
        badge.nivel ??
        "Sem Nível";

    const pontos =
        badge.pontos_badge ??
        badge.pontosBadge ??
        badge.pontos ??
        0;

    const especial = badge.especial === true;

    return {
        ...badge,

        id,
        id_badge: id,
        idBadge: id,

        nome,
        nome_badge: nome,
        nomeBadge: nome,

        descricao,
        descricao_badge: descricao,

        imagem,
        imagemBadge: imagem,

        id_area: idArea,
        idArea,
        nome_area: nomeArea,
        nomeArea,
        area: nomeArea,

        id_service_line: idServiceLine,
        idServiceLine,
        nome_service_line: nomeServiceLine,
        serviceLine: nomeServiceLine,

        id_learning_path: idLearningPath,
        idLearningPath,
        nome_learning_path: nomeLearningPath,
        learningPath: nomeLearningPath,

        id_nivel: idNivel,
        idNivel,
        nome_nivel: nomeNivel,
        nivel: nomeNivel,

        pontos_badge: pontos,
        pontosBadge: pontos,
        pontos,

        validade: badge.validade ?? null,

        especial,
        tipoEspecial: especial ? "gold" : null,

        icone: badge.icone ?? badge.icon ?? "fi-br-badge",
        icon: badge.icon ?? badge.icone ?? "fi-br-badge",

        grupo: badge.grupo ?? (especial ? "badgesEspeciais" : "outrasAreas"),
        temaVisual: badge.temaVisual ?? (especial ? "gold" : "azul"),

        dataCriacao:
            badge.dataCriacao ??
            badge.data_criacao ??
            badge.updated_badge ??
            null,
    };
}

export function normalizarBadgesCatalogo(badges = []) {
    return badges.map(normalizarBadgeCatalogo);
}

export function juntarCatalogoComEstadoConsultor(
    badgesCatalogo = [],
    estadosConsultor = [],
    opcoes = {}
) {
    const { idAreaConsultor = 2 } = opcoes;

    const mapaEstados = new Map();

    estadosConsultor.forEach((estado) => {
        mapaEstados.set(estado.id_badge, estado);
    });

    return badgesCatalogo.map((badgeOriginal) => {
        const badge = normalizarBadgeCatalogo(badgeOriginal);
        const estadoConsultor = mapaEstados.get(badge.id_badge);

        const estado = estadoConsultor?.estado ?? "bloqueados";
        const progresso = estadoConsultor?.progresso ?? 0;

        let grupo = "outrasAreas";

        if (badge.especial) {
            grupo = "badgesEspeciais";
        } else if (badge.id_area === idAreaConsultor) {
            grupo = "minhaArea";
        }

        return {
            ...badge,
            ...estadoConsultor,

            estado,
            progresso,
            grupo,
        };
    });
}