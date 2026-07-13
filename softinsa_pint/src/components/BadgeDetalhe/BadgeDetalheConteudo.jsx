import "./BadgeDetalheConteudo.css";
import LoadingSpinner from "../ui/Loading/LoadingSpinner";
import BadgeDetalheRequisitos from "./BadgeDetalheRequisitos";
import BadgeDetalheEstadoConsultor from "./BadgeDetalheEstadoConsultor";
import BadgeDetalheAcoes from "./BadgeDetalheAcoes";

function obterImagemBadge(detalhe = {}) {
    return detalhe.imagem ?? detalhe.imagem_badge ?? detalhe.badge?.imagem ?? null;
}

function obterNomeBadge(detalhe = {}) {
    return (
        detalhe.nome_badge ??
        detalhe.nomeBadge ??
        detalhe.nome ??
        detalhe.badge?.nome_badge ??
        "Badge"
    );
}

function obterDescricaoBadge(detalhe = {}) {
    return (
        detalhe.descricao_badge ??
        detalhe.descricaoBadge ??
        detalhe.descricao ??
        detalhe.badge?.descricao_badge ??
        "Sem descrição disponível."
    );
}

function BadgeDetalheConteudo({
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
    acaoCertificado,
    uploadDesativado,
}) {
    if (isLoading) {
        return (
            <div className="badge-detalhe-loading">
                <LoadingSpinner tamanho="md" texto="A carregar detalhe do badge..." centralizado />
            </div>
        );
    }

    if (!detalhe) {
        return (
            <div className="badge-detalhe-vazio">
                Não foi possível carregar o detalhe deste badge.
            </div>
        );
    }

    const isConsultor = modo === "consultor";

    const imagemBadge = obterImagemBadge(detalhe);
    const nomeBadge = obterNomeBadge(detalhe);
    const descricaoBadge = obterDescricaoBadge(detalhe);

    return (
        <div className="badge-detalhe-conteudo">
            <section className="badge-detalhe-card badge-detalhe-hero">
                <div className="badge-detalhe-imagem-wrapper">
                    {imagemBadge ? (
                        <img
                            src={imagemBadge}
                            alt={nomeBadge}
                            className="badge-detalhe-imagem"
                        />
                    ) : (
                        <i className="fi fi-br-award badge-detalhe-imagem-icon"></i>
                    )}
                </div>

                <div className="badge-detalhe-hero-info">
                    <div className="badge-detalhe-hero-topo">
                        <div>
                            <h3 className="badge-detalhe-nome">
                                {nomeBadge}
                            </h3>
                            <p className="badge-detalhe-descricao">
                                {descricaoBadge}
                            </p>
                        </div>

                        <span className="badge-detalhe-pontos">
                            <i className="fi fi-br-graduation-cap"></i>
                            {detalhe.pontos_badge ?? detalhe.pontos ?? 0} pts
                        </span>
                    </div>

                    <div className="badge-detalhe-meta-grid">
                        <div className="badge-detalhe-meta-item">
                            <span>Nível</span>
                            <strong>{detalhe.nivel ?? detalhe.nome_nivel ?? "-"}</strong>
                        </div>

                        <div className="badge-detalhe-meta-item">
                            <span>Tipo</span>
                            <strong>{detalhe.tipo ?? "Normal"}</strong>
                        </div>

                        <div className="badge-detalhe-meta-item">
                            <span>Validade</span>
                            <strong>{detalhe.validadeFormatada ?? "-"}</strong>
                        </div>

                        <div className="badge-detalhe-meta-item">
                            <span>Área</span>
                            <strong>{detalhe.area ?? detalhe.nome_area ?? "-"}</strong>
                        </div>

                        <div className="badge-detalhe-meta-item">
                            <span>Service Line</span>
                            <strong>
                                {detalhe.serviceLine ??
                                    detalhe.nome_service_line ??
                                    "-"}
                            </strong>
                        </div>

                        <div className="badge-detalhe-meta-item">
                            <span>Learning Path</span>
                            <strong>
                                {detalhe.learningPath ??
                                    detalhe.nome_learning_path ??
                                    "-"}
                            </strong>
                        </div>
                    </div>
                </div>
            </section>

            {isConsultor && (
                <BadgeDetalheEstadoConsultor detalhe={detalhe} />
            )}

            <BadgeDetalheRequisitos
                modo={modo}
                detalhe={detalhe}
                requisitos={detalhe.requisitos ?? []}
                onSelecionarFicheiroRequisito={onSelecionarFicheiroRequisito}
                onRemoverFicheiroRequisito={onRemoverFicheiroRequisito}
                requisitosEmProcessamento={requisitosEmProcessamento}
                uploadDesativado={uploadDesativado}
            />

            <BadgeDetalheAcoes
                modo={modo}
                detalhe={detalhe}
                onCriarOuObterRascunho={onCriarOuObterRascunho}
                onSubmeterCandidatura={onSubmeterCandidatura}
                isProcessandoRascunho={isProcessandoRascunho}
                isSubmetendoCandidatura={isSubmetendoCandidatura}
                onVerPaginaPublica={onVerPaginaPublica}
                onCopiarLinkPublico={onCopiarLinkPublico}
                onPartilharLinkedIn={onPartilharLinkedIn}
                acaoCertificado={acaoCertificado}
            />
        </div>
    );
}

export default BadgeDetalheConteudo;
