export function normalizarArea(area = {}) {
    const id = area.id_area ?? area.idArea ?? area.id;

    const nome =
        area.nome_area ??
        area.nomeArea ??
        area.nome ??
        area.area ??
        "Área sem nome";

    const serviceLine =
        area.nome_service_line ??
        area.serviceLine ??
        area.nomeServiceLine ??
        "Sem Service Line";

    const learningPath =
        area.nome_learning_path ??
        area.learningPath ??
        area.nomeLearningPath ??
        "Sem Learning Path";

    const totalBadges =
        area.total_badges ??
        area.totalBadges ??
        area.badges ??
        0;

    return {
        ...area,

        id,
        id_area: id,
        idArea: id,

        nome,
        nome_area: nome,
        nomeArea: nome,
        area: nome,

        serviceLine,
        nome_service_line: serviceLine,

        learningPath,
        nome_learning_path: learningPath,

        total_badges: totalBadges,
        totalBadges,
    };
}

export function normalizarServiceLine(serviceLineObj = {}) {
    const id =
        serviceLineObj.id_service_line ??
        serviceLineObj.idServiceLine ??
        serviceLineObj.id;

    const nome =
        serviceLineObj.nome_service_line ??
        serviceLineObj.nomeServiceLine ??
        serviceLineObj.nome ??
        serviceLineObj.serviceLine ??
        "Service Line sem nome";

    const learningPath =
        serviceLineObj.nome_learning_path ??
        serviceLineObj.learningPath ??
        serviceLineObj.nomeLearningPath ??
        "Sem Learning Path";

    const totalAreas =
        serviceLineObj.total_areas ??
        serviceLineObj.totalAreas ??
        serviceLineObj.areas ??
        0;

    const totalBadges =
        serviceLineObj.total_badges ??
        serviceLineObj.totalBadges ??
        serviceLineObj.badges ??
        0;

    return {
        ...serviceLineObj,

        id,
        id_service_line: id,
        idServiceLine: id,

        nome,
        nome_service_line: nome,
        nomeServiceLine: nome,
        serviceLine: nome,

        learningPath,
        nome_learning_path: learningPath,

        total_areas: totalAreas,
        totalAreas,

        total_badges: totalBadges,
        totalBadges,
    };
}

export function normalizarLearningPath(learningPathObj = {}) {
    const id =
        learningPathObj.id_learning_path ??
        learningPathObj.idLearningPath ??
        learningPathObj.id;

    const nome =
        learningPathObj.nome_learning_path ??
        learningPathObj.nomeLearningPath ??
        learningPathObj.nome ??
        learningPathObj.learningPath ??
        "Learning Path sem nome";

    const totalServiceLines =
        learningPathObj.total_service_lines ??
        learningPathObj.totalServiceLines ??
        learningPathObj.serviceLines ??
        0;

    const totalAreas =
        learningPathObj.total_areas ??
        learningPathObj.totalAreas ??
        learningPathObj.areas ??
        0;

    const totalBadges =
        learningPathObj.total_badges ??
        learningPathObj.totalBadges ??
        learningPathObj.badges ??
        0;

    return {
        ...learningPathObj,

        id,
        id_learning_path: id,
        idLearningPath: id,

        nome,
        nome_learning_path: nome,
        nomeLearningPath: nome,
        learningPath: nome,

        total_service_lines: totalServiceLines,
        totalServiceLines,

        total_areas: totalAreas,
        totalAreas,

        total_badges: totalBadges,
        totalBadges,
    };
}

export function normalizarAreas(areas = []) {
    return areas.map(normalizarArea);
}

export function normalizarServiceLines(serviceLines = []) {
    return serviceLines.map(normalizarServiceLine);
}

export function normalizarLearningPaths(learningPaths = []) {
    return learningPaths.map(normalizarLearningPath);
}