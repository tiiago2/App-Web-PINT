import "./BadgeDetalheModal.css";
import BadgeDetalheConteudo from "./BadgeDetalheConteudo";

function BadgeDetalheModal({
    isOpen,
    onClose,
    modo = "catalogo",
    detalhe,
    isLoading = false,
    onSelecionarFicheiroRequisito,
    onRemoverFicheiroRequisito,
    requisitosEmProcessamento,
    onCriarOuObterRascunho,
    onSubmeterCandidatura,
    isProcessandoRascunho,
    isSubmetendoCandidatura,
    onVerPaginaPublica,
    onCopiarLinkPublico,
    onPartilharLinkedIn,
}) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="badge-detalhe-modal-overlay" onMouseDown={onClose}>
            <section
                className="badge-detalhe-modal"
                onMouseDown={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Detalhe do badge"
            >
                <header className="badge-detalhe-modal-cabecalho">
                    <div>
                        <p className="badge-detalhe-modal-eyebrow">
                            {modo === "consultor"
                                ? "Detalhe do Badge"
                                : "Catálogo de Badge"}
                        </p>
                        <h2 className="badge-detalhe-modal-titulo">
                            {detalhe?.nome_badge ??
                                detalhe?.nome ??
                                "Badge"}
                        </h2>
                    </div>

                    <button
                        type="button"
                        className="badge-detalhe-modal-fechar"
                        onClick={onClose}
                        aria-label="Fechar detalhe do badge"
                    >
                        <i className="fi fi-br-cross-small"></i>
                    </button>
                </header>

                <div className="badge-detalhe-modal-corpo">
                    <BadgeDetalheConteudo
                        modo={modo}
                        detalhe={detalhe}
                        isLoading={isLoading}
                        onSelecionarFicheiroRequisito={
                            onSelecionarFicheiroRequisito
                        }
                        onRemoverFicheiroRequisito={onRemoverFicheiroRequisito}
                        requisitosEmProcessamento={requisitosEmProcessamento}
                        onCriarOuObterRascunho={onCriarOuObterRascunho}
                        onSubmeterCandidatura={onSubmeterCandidatura}
                        isProcessandoRascunho={isProcessandoRascunho}
                        isSubmetendoCandidatura={isSubmetendoCandidatura}
                        onVerPaginaPublica={onVerPaginaPublica}
                        onCopiarLinkPublico={onCopiarLinkPublico}
                        onPartilharLinkedIn={onPartilharLinkedIn}
                    />
                </div>
            </section>
        </div>
    );
}

export default BadgeDetalheModal;
