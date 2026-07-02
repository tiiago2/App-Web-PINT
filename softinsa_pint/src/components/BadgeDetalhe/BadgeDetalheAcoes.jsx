import "./BadgeDetalheAcoes.css";
import { ESTADOS_BADGE_CONSULTOR } from "../../utils/badgeDetalheNormalizadores";

function SecaoPaginaPublica({
    detalhe,
    isConquistado = false,
    onVerPaginaPublica,
    onCopiarLinkPublico,
}) {
    return (
        <section className="badge-detalhe-acoes badge-detalhe-acoes--partilha">
            <div className="badge-detalhe-partilha-info">
                <strong>
                    {isConquistado
                        ? "Partilhar a tua conquista"
                        : "Página pública do badge"}
                </strong>

                <span>
                    {isConquistado
                        ? "Partilha a página pública deste badge, sem dados pessoais."
                        : "Consulta ou copia o link público deste badge. Esta página mostra apenas informação geral, sem dados pessoais."}
                </span>
            </div>

            <div className="badge-detalhe-partilha-botoes">
                <button
                    type="button"
                    className="badge-detalhe-botao badge-detalhe-botao--secundario"
                    onClick={() => onVerPaginaPublica?.(detalhe)}
                >
                    <i className="fi fi-br-link-alt"></i>
                    Ver página pública
                </button>

                <button
                    type="button"
                    className="badge-detalhe-botao badge-detalhe-botao--primario"
                    onClick={() => onCopiarLinkPublico?.(detalhe)}
                >
                    <i className="fi fi-br-copy"></i>
                    Copiar link público
                </button>
            </div>
        </section>
    );
}

function AcaoEstadoConsultor({
    detalhe,
    onSubmeterCandidatura,
}) {
    const estado = detalhe.estado;

    if (estado === ESTADOS_BADGE_CONSULTOR.EM_PROGRESSO) {
        return (
            <section className="badge-detalhe-acoes">
                <button
                    type="button"
                    className="badge-detalhe-botao badge-detalhe-botao--primario"
                    disabled={!detalhe.podeSubmeterCandidatura}
                    onClick={() => onSubmeterCandidatura?.(detalhe)}
                >
                    <i className="fi fi-br-paper-plane"></i>
                    Submeter candidatura
                </button>
            </section>
        );
    }

    if (estado === ESTADOS_BADGE_CONSULTOR.RECUSADO) {
        return (
            <section className="badge-detalhe-acoes">
                <button
                    type="button"
                    className="badge-detalhe-botao badge-detalhe-botao--primario"
                    onClick={() => onSubmeterCandidatura?.(detalhe)}
                >
                    <i className="fi fi-br-refresh"></i>
                    Submeter novamente
                </button>
            </section>
        );
    }

    if (estado === ESTADOS_BADGE_CONSULTOR.EXPIRADO) {
        return (
            <section className="badge-detalhe-acoes">
                <button
                    type="button"
                    className="badge-detalhe-botao badge-detalhe-botao--primario"
                >
                    <i className="fi fi-br-refresh"></i>
                    Renovar este Badge
                </button>
            </section>
        );
    }

    return null;
}

function BadgeDetalheAcoes({
    modo = "catalogo",
    detalhe,
    onSubmeterCandidatura,
    onVerPaginaPublica,
    onCopiarLinkPublico,
}) {
    if (!detalhe) {
        return null;
    }

    const isConsultor = modo === "consultor";
    const isConquistado =
        isConsultor &&
        detalhe.estado === ESTADOS_BADGE_CONSULTOR.CONQUISTADO;

    return (
        <div className="badge-detalhe-acoes-wrapper">
            {isConsultor && !isConquistado && (
                <AcaoEstadoConsultor
                    detalhe={detalhe}
                    onSubmeterCandidatura={onSubmeterCandidatura}
                />
            )}

            <SecaoPaginaPublica
                detalhe={detalhe}
                isConquistado={isConquistado}
                onVerPaginaPublica={onVerPaginaPublica}
                onCopiarLinkPublico={onCopiarLinkPublico}
            />
        </div>
    );
}

export default BadgeDetalheAcoes;