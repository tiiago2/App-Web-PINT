import React from "react";
import "./BadgeDetalheRequisitos.css";
import api from "../../services/api";
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

function isUrlDocumento(valor = "") {
    try {
        const url = new URL(valor);
        return ["http:", "https:"].includes(url.protocol);
    } catch {
        return false;
    }
}

function obterTextoDocumento(documento) {
    const documentoSeguro = documento ?? {};

    return (
        documentoSeguro.nomeFicheiro ??
        documentoSeguro.ficheiro ??
        "Documento"
    );
}

function BadgeDetalheRequisitos({
    modo = "catalogo",
    detalhe,
    requisitos = [],
    onSelecionarFicheiroRequisito,
    onRemoverFicheiroRequisito,
    requisitosEmProcessamento = {},
    uploadDesativado = false,
}) {
    const podeAnexar =
        modo === "consultor" && detalhe?.podeAnexarRequisitos === true && !uploadDesativado;

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

            {uploadDesativado && modo === "consultor" && detalhe?.podeAnexarRequisitos === true && (
                <div className="badge-detalhe-upload-desativado">
                    <i className="fi fi-br-lock"></i>
                    <span>O upload de evidências está temporariamente desativado pelo administrador.</span>
                </div>
            )}

            <div className="badge-detalhe-requisitos-lista">
                {requisitos.map((requisito) => {
                    const idRequisito =
                        requisito.id_requisito ??
                        requisito.idRequisito ??
                        requisito.id;

                    const inputId = `input-requisito-${detalhe?.id_badge}-${idRequisito}`;
                    const isProcessando = requisitosEmProcessamento[idRequisito] === true;
                    const ficheiroDocumento = requisito.documento?.ficheiro ?? "";
                    const documentoTemUrl = isUrlDocumento(ficheiroDocumento);
                    const textoDocumento = documentoTemUrl
                        ? "Ver documento"
                        : obterTextoDocumento(requisito.documento);

                    const handleSelecionarFicheiro = (ficheiro) => {
                        if (!ficheiro || isProcessando) {
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
                                && !isProcessando
                                    ? (event) => {
                                          event.preventDefault();
                                          event.dataTransfer.dropEffect =
                                              "copy";
                                      }
                                    : undefined
                            }
                            onDrop={
                                podeAnexar
                                && !isProcessando
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
                                    <span
                                        className="badge-detalhe-requisito-ficheiro"
                                        title="Download documento"
                                    >
                                        <i className="fi fi-br-clip"></i>
                                        <a
                                            href={`${api.defaults.baseURL}/documentos/${requisito.documento?.id_ficheiro}/download?token=${localStorage.getItem("token_softinsa") || ""}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="fw-medium text-decoration-none"
                                            style={{ fontSize: "0.85rem", color: "var(--barra_lateral)" }}
                                        >
                                            Download documento
                                        </a>
                                    </span>
                                )}
                            </div>

                            {podeAnexar && (
                                <div className="badge-detalhe-requisito-acoes">
                                    <input
                                        id={inputId}
                                        type="file"
                                        className="badge-detalhe-requisito-input"
                                        disabled={isProcessando}
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
                                        aria-disabled={isProcessando}
                                    >
                                        {isProcessando
                                            ? "A processar..."
                                            : obterTextoAcaoRequisito(requisito)}
                                    </label>

                                    {requisito.temAnexo && (
                                        <button
                                            type="button"
                                            className="badge-detalhe-requisito-botao"
                                            disabled={isProcessando}
                                            onClick={() =>
                                                onRemoverFicheiroRequisito?.({
                                                    requisito,
                                                })
                                            }
                                        >
                                            Remover anexo
                                        </button>
                                    )}
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
