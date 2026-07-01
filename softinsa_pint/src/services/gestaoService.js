import {
    areasMock,
    serviceLinesMock,
    learningPathsMock,
} from "../data/mocks";

import {
    normalizarAreas,
    normalizarServiceLines,
    normalizarLearningPaths,
} from "../utils/gestaoNormalizadores";

export async function obterAreas() {
    return areasMock;
}

export async function obterAreasNormalizadas() {
    const areas = await obterAreas();

    return normalizarAreas(areas);
}

export async function obterServiceLines() {
    return serviceLinesMock;
}

export async function obterServiceLinesNormalizadas() {
    const serviceLines = await obterServiceLines();

    return normalizarServiceLines(serviceLines);
}

export async function obterLearningPaths() {
    return learningPathsMock;
}

export async function obterLearningPathsNormalizados() {
    const learningPaths = await obterLearningPaths();

    return normalizarLearningPaths(learningPaths);
}