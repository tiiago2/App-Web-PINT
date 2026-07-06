import "./BadgeDetalheAcoes.css";
import { ESTADOS_BADGE_CONSULTOR } from "../../utils/badgeDetalheNormalizadores";

function SecaoPaginaPublica({
    detalhe,
    isConquistado = false,
    onVerPaginaPublica,
    onCopiarLinkPublico,
    onPartilharLinkedIn,
}) {
    return (
        <section className="badge-detalhe-acoes badge-detalhe-acoes--partilha">
            <div className="badge-detalhe-partilha-info">
                <strong>
                    {isConquistado
                        ? "Partilhar a tua conquista"
                        : "Pagina publica do badge"}
                </strong>

                <span>
                    {isConquistado
                        ? "Partilha a pagina publica deste badge, sem dados pessoais."
                        : "Consulta ou copia o link publico deste badge. Esta pagina mostra apenas informacao geral, sem dados pessoais."}
                </span>
            </div>

            <div className="badge-detalhe-partilha-botoes">
                <button
                    type="button"
                    className="badge-detalhe-botao badge-detalhe-botao--secundario"
                    onClick={() => onVerPaginaPublica?.(detalhe)}
                >
                    <i className="fi fi-br-link-alt"></i>
                    Ver pagina publica
                </button>

                <button
                    type="button"
                    className="badge-detalhe-botao badge-detalhe-botao--primario"
                    onClick={() => onCopiarLinkPublico?.(detalhe)}
                >
                    <i className="fi fi-br-copy"></i>
                    Copiar link publico
                </button>

                {isConquistado && (
                    <button
                        type="button"
                        className="badge-detalhe-botao badge-detalhe-botao--linkedin"
                        onClick={() => onPartilharLinkedIn?.(detalhe)}
                    >
                        <i className="fi fi-br-link-alt"></i>
                        Partilhar no LinkedIn
                    </button>
                )}
            </div>
        </section>
    );
}

function AcaoEstadoConsultor({
    detalhe,
    onCriarOuObterRascunho,
    onSubmeterCandidatura,
    isProcessandoRascunho = false,
    isSubmetendoCandidatura = false,
}) {
    const estado = detalhe.estado;

    if (estado === ESTADOS_BADGE_CONSULTOR.EM_PROGRESSO) {
        const podeSubmeter = Number(detalhe.progresso) === 100;
        const textoBotao = isSubmetendoCandidatura
            ? "A submeter..."
            : podeSubmeter
              ? "Submeter candidatura"
              : "Completa todos os requisitos";

        return (
            <section className="badge-detalhe-acoes">
                <button
                    type="button"
                    className="badge-detalhe-botao badge-detalhe-botao--primario"
                    disabled={!podeSubmeter || isSubmetendoCandidatura}
                    onClick={() => onSubmeterCandidatura?.(detalhe)}
                >
                    <i
                        className={`fi ${
                            podeSubmeter ? "fi-br-paper-plane" : "fi-br-lock"
                        }`}
                    ></i>
                    {textoBotao}
                </button>
            </section>
        );
    }

    if (
        estado === ESTADOS_BADGE_CONSULTOR.BLOQUEADO ||
        estado === ESTADOS_BADGE_CONSULTOR.RECUSADO ||
        estado === ESTADOS_BADGE_CONSULTOR.EXPIRADO
    ) {
        const texto =
            estado === ESTADOS_BADGE_CONSULTOR.BLOQUEADO
                ? "Iniciar candidatura"
                : "Criar rascunho";

        return (
            <section className="badge-detalhe-acoes">
                <button
                    type="button"
                    className="badge-detalhe-botao badge-detalhe-botao--primario"
                    disabled={isProcessandoRascunho}
                    onClick={() => onCriarOuObterRascunho?.(detalhe)}
                >
                    <i className="fi fi-br-refresh"></i>
                    {isProcessandoRascunho ? "A preparar..." : texto}
                </button>
            </section>
        );
    }

    return null;
}

function BadgeDetalheAcoes({
    modo = "catalogo",
    detalhe,
    onCriarOuObterRascunho,
    onSubmeterCandidatura,
    isProcessandoRascunho = false,
    isSubmetendoCandidatura = false,
    onVerPaginaPublica,
    onCopiarLinkPublico,
    onPartilharLinkedIn,
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
                    onCriarOuObterRascunho={onCriarOuObterRascunho}
                    onSubmeterCandidatura={onSubmeterCandidatura}
                    isProcessandoRascunho={isProcessandoRascunho}
                    isSubmetendoCandidatura={isSubmetendoCandidatura}
                />
            )}

            <SecaoPaginaPublica
                detalhe={detalhe}
                isConquistado={isConquistado}
                onVerPaginaPublica={onVerPaginaPublica}
                onCopiarLinkPublico={onCopiarLinkPublico}
                onPartilharLinkedIn={onPartilharLinkedIn}
            />
        </div>
    );
}

export default BadgeDetalheAcoes;
