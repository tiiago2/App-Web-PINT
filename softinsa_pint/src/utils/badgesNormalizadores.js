function isObject(valor) {
    return valor !== null && typeof valor === "object" && !Array.isArray(valor);
}

function normalizarRequisitoBadge(requisito = {}) {
    if (!isObject(requisito)) {
        return null;
    }

    const id =
        requisito.id_requisito ??
        requisito.idRequisito ??
        requisito.id;

    const nome =
        requisito.nome_requisito ??
        requisito.nomeRequisito ??
        requisito.nome ??
        "";

    const descricao =
        requisito.descricao_requisito ??
        requisito.descricaoRequisito ??
        requisito.descricao ??
        "";

    return {
        ...requisito,
        id,
        id_requisito: id,
        idRequisito: id,
        nome,
        nome_requisito: nome,
        nomeRequisito: nome,
        descricao,
        descricao_requisito: descricao,
        descricaoRequisito: descricao,
    };
}

export function normalizarBadgeCatalogo(badgeOriginal = {}) {
    const badge = isObject(badgeOriginal) ? badgeOriginal : {};

    const nivelObj = isObject(badge.nivel)
        ? badge.nivel
        : isObject(badge.Nivel)
            ? badge.Nivel
            : null;

    const areaObj = isObject(badge.area)
        ? badge.area
        : isObject(badge.Area)
            ? badge.Area
            : null;

    const serviceLineObj = isObject(badge.service_line)
        ? badge.service_line
        : isObject(badge.ServiceLine)
            ? badge.ServiceLine
            : isObject(areaObj?.service_line)
                ? areaObj.service_line
                : isObject(areaObj?.ServiceLine)
                    ? areaObj.ServiceLine
                    : null;

    const learningPathObj = isObject(badge.learning_path)
        ? badge.learning_path
        : isObject(badge.LearningPath)
            ? badge.LearningPath
            : isObject(serviceLineObj?.learning_path)
                ? serviceLineObj.learning_path
                : isObject(serviceLineObj?.LearningPath)
                    ? serviceLineObj.LearningPath
                    : null;

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

    const idArea =
        badge.id_area ??
        badge.idArea ??
        areaObj?.id_area ??
        areaObj?.idArea ??
        areaObj?.id ??
        null;
    const nomeArea =
        badge.nome_area ??
        badge.nomeArea ??
        areaObj?.nome_area ??
        areaObj?.nomeArea ??
        areaObj?.nome ??
        (typeof badge.area === "string" ? badge.area : undefined) ??
        "Sem Área";

    const idServiceLine =
        badge.id_service_line ??
        badge.idServiceLine ??
        serviceLineObj?.id_service_line ??
        serviceLineObj?.idServiceLine ??
        serviceLineObj?.id ??
        null;
    const nomeServiceLine =
        badge.nome_service_line ??
        badge.nomeServiceLine ??
        serviceLineObj?.nome_service_line ??
        serviceLineObj?.nomeServiceLine ??
        serviceLineObj?.nome ??
        (typeof badge.serviceLine === "string" ? badge.serviceLine : undefined) ??
        "Sem Service Line";

    const idLearningPath =
        badge.id_learning_path ??
        badge.idLearningPath ??
        learningPathObj?.id_learning_path ??
        learningPathObj?.idLearningPath ??
        learningPathObj?.id ??
        null;
    const nomeLearningPath =
        badge.nome_learning_path ??
        badge.nomeLearningPath ??
        learningPathObj?.nome_learning_path ??
        learningPathObj?.nomeLearningPath ??
        learningPathObj?.nome ??
        (typeof badge.learningPath === "string" ? badge.learningPath : undefined) ??
        "Sem Learning Path";

    const idNivel =
        badge.id_nivel ??
        badge.idNivel ??
        nivelObj?.id_nivel ??
        nivelObj?.idNivel ??
        nivelObj?.id ??
        null;
    const nomeNivel =
        badge.nome_nivel ??
        badge.nomeNivel ??
        nivelObj?.nome_nivel ??
        nivelObj?.nomeNivel ??
        nivelObj?.nome ??
        (typeof badge.nivel === "string" ? badge.nivel : undefined) ??
        "Sem Nível";

    const pontos =
        badge.pontos_badge ??
        badge.pontosBadge ??
        badge.pontos ??
        0;

    const especial = badge.especial === true;
    const requisitosOriginais = Array.isArray(badge.requisitos)
        ? badge.requisitos
        : Array.isArray(badge.Requisitos)
            ? badge.Requisitos
            : [];
    const requisitos = requisitosOriginais
        .map(normalizarRequisitoBadge)
        .filter(Boolean);

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
        requisitos,
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
