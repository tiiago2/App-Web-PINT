import {
    badgesCatalogoMock,
    badgesConsultorEstadoMock,
} from "../data/mocks";

import {
    normalizarBadgesCatalogo,
    juntarCatalogoComEstadoConsultor,
} from "../utils/badgesNormalizadores";

export async function obterBadgesCatalogo() {
    return badgesCatalogoMock;
}

export async function obterBadgesCatalogoNormalizados() {
    const badges = await obterBadgesCatalogo();

    return normalizarBadgesCatalogo(badges);
}

export async function obterEstadoBadgesConsultor() {
    return badgesConsultorEstadoMock;
}

export async function obterBadgesConsultorNormalizados(opcoes = {}) {
    const badges = await obterBadgesCatalogo();
    const estados = await obterEstadoBadgesConsultor();

    return juntarCatalogoComEstadoConsultor(badges, estados, opcoes);
}