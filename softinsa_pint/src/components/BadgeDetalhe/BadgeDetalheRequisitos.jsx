import "./BadgeDetalheRequisitos.css";
import {
    ESTADOS_BADGE_CONSULTOR,
    ESTADOS_REQUISITO_DETALHE,
} from "../../utils/badgeDetalheNormalizadores";

function obterIconeRequisito(requisito, detalhe) {
    if (
        detalhe?.estado === ESTADOS_BADGE_CONSULTOR.PENDENTE ||
        requisito.estadoRequisito === ESTADOS_REQUISITO_DETALHE.SUBMETIDO
    ) {
        return "fi-br-clock";
    }

    if (requisito.temAnexo) {
        return "fi-br-file-check";
    }

    return "fi-br-upload";
}

function obterTextoAcaoRequisito(requisito) {
    if (requisito.temAnexo) {
        return "Substituir anexo";
    }

    return "Anexar requisito";
}

function obterTituloRequisitos(modo, detalhe) {
    if (modo !== "consultor") {
        return "Requisitos associados";
    }

    if (detalhe?.estado === ESTADOS_BADGE_CONSULTOR.PENDENTE) {
        return "Requisitos submetidos";
    }

    if (detalhe?.estado === ESTADOS_BADGE_CONSULTOR.CONQUISTADO) {
        return "Requisitos submetidos";
    }

    if (detalhe?.estado === ESTADOS_BADGE_CONSULTOR.RECUSADO) {
        return "Requisitos da candidatura";
    }

    if (detalhe?.estado === ESTADOS_BADGE_CONSULTOR.EXPIRADO) {
        return "Requisitos para renovação";
    }

    return "Requisitos associados";
}

function obterDescricaoRequisitos(modo, detalhe) {
    if (modo !== "consultor") {
        return "Lista de requisitos associados a este badge.";
    }

    if (detalhe?.podeAnexarRequisitos) {
        return "Anexa os ficheiros necessários aos requisitos antes de submeteres a candidatura.";
    }

    if (detalhe?.estado === ESTADOS_BADGE_CONSULTOR.PENDENTE) {
        return "Estes requisitos foram submetidos e estão à espera de análise.";
    }

    if (detalhe?.estado === ESTADOS_BADGE_CONSULTOR.CONQUISTADO) {
        return "Estes foram os requisitos submetidos na candidatura aprovada.";
    }

    if (detalhe?.estado === ESTADOS_BADGE_CONSULTOR.RECUSADO) {
        return "Consulta os requisitos submetidos e o feedback da candidatura.";
    }

    return "Lista de requisitos associados a este badge.";
}

function BadgeDetalheRequisitos({
    modo = "catalogo",
    detalhe,
    requisitos = [],
    onSelecionarFicheiroRequisito,
}) {
    const podeAnexar =
        modo === "consultor" && detalhe?.podeAnexarRequisitos === true;

    return (
        <section className="badge-detalhe-card badge-detalhe-requisitos">
            <div className="badge-detalhe-seccao-cabecalho">
                <div>
                    <h4>{obterTituloRequisitos(modo, detalhe)}</h4>
                    <p>{obterDescricaoRequisitos(modo, detalhe)}</p>
                </div>

                <span>
                    {requisitos.length}{" "}
                    {requisitos.length === 1 ? "requisito" : "requisitos"}
                </span>
            </div>

            <div className="badge-detalhe-requisitos-lista">
                {requisitos.map((requisito) => {
                    const idRequisito =
                        requisito.id_requisito ??
                        requisito.idRequisito ??
                        requisito.id;

                    const inputId = `input-requisito-${detalhe?.id_badge}-${idRequisito}`;

                    const handleSelecionarFicheiro = (ficheiro) => {
                        if (!ficheiro) {
                            return;
                        }

                        onSelecionarFicheiroRequisito?.({
                            requisito,
                            ficheiro,
                        });
                    };

                    return (
                        <article
                            key={idRequisito}
                            className={`badge-detalhe-requisito ${
                                requisito.temAnexo
                                    ? "badge-detalhe-requisito--anexado"
                                    : ""
                            } ${
                                podeAnexar
                                    ? "badge-detalhe-requisito--dropzone"
                                    : ""
                            }`}
                            onDragOver={
                                podeAnexar
                                    ? (event) => {
                                          event.preventDefault();
                                          event.dataTransfer.dropEffect =
                                              "copy";
                                      }
                                    : undefined
                            }
                            onDrop={
                                podeAnexar
                                    ? (event) => {
                                          event.preventDefault();

                                          const ficheiro =
                                              event.dataTransfer.files?.[0];

                                          handleSelecionarFicheiro(ficheiro);
                                      }
                                    : undefined
                            }
                        >
                            <div className="badge-detalhe-requisito-icon">
                                <i
                                    className={`fi ${obterIconeRequisito(
                                        requisito,
                                        detalhe
                                    )}`}
                                ></i>
                            </div>

                            <div className="badge-detalhe-requisito-info">
                                <h5>{requisito.nome}</h5>
                                <p>{requisito.descricao}</p>

                                {requisito.temAnexo && (
                                    <span className="badge-detalhe-requisito-ficheiro">
                                        <i className="fi fi-br-clip"></i>
                                        {requisito.documento?.nomeFicheiro ??
                                            requisito.documento?.ficheiro}
                                    </span>
                                )}
                            </div>

                            {podeAnexar && (
                                <div className="badge-detalhe-requisito-acoes">
                                    <input
                                        id={inputId}
                                        type="file"
                                        className="badge-detalhe-requisito-input"
                                        onChange={(event) => {
                                            const ficheiro =
                                                event.target.files?.[0];

                                            handleSelecionarFicheiro(ficheiro);

                                            event.target.value = "";
                                        }}
                                    />

                                    <label
                                        htmlFor={inputId}
                                        className="badge-detalhe-requisito-botao"
                                    >
                                        {obterTextoAcaoRequisito(requisito)}
                                    </label>
                                </div>
                            )}
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

export default BadgeDetalheRequisitos;