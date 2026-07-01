import {
    badgesCatalogoMock,
    badgesConsultorEstadoMock,
} from "./mocks";

import { juntarCatalogoComEstadoConsultor } from "../utils/badgesNormalizadores";

const badgesConsultorMock = juntarCatalogoComEstadoConsultor(
    badgesCatalogoMock,
    badgesConsultorEstadoMock,
    {
        idAreaConsultor: 2,
    }
);

export default badgesConsultorMock;