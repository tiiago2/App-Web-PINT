import VistaTabela_Base from "../../ui/VistaTabela_Base/VistaTabela_Base";
import "./VistaTabelaBadges.css";

function obterIdBadge(badge, index) {
    return badge.id_badge ?? badge.id ?? index;
}

function obterNomeBadge(badge) {
    return badge.nome_badge || badge.nome || "—";
}

function ThumbBadge({ badge, nome }) {
    const imagem = badge.imagem;

    return (
        <div className="vt-badge-celula">
            <div className="vt-thumb">
                {imagem ? (
                    <img
                        className="vt-thumb-imagem"
                        src={imagem}
                        alt={nome}
                    />
                ) : (
                    <div className="vt-thumb-placeholder">
                        <i className="fi fi-br-award"></i>
                    </div>
                )}
            </div>

            <span className="texto-nome-badge-destaque vt-badge-nome">
                {nome}
            </span>
        </div>
    );
}

function TipoBadge({ especial }) {
    return (
        <span
            className={
                especial
                    ? "vt-pill vt-pill-especial"
                    : "vt-pill vt-pill-normal"
            }
        >
            {especial ? "Especial" : "Normal"}
        </span>
    );
}

function VistaTabelaBadges({
    badges = [],
    onEdit,
    onDelete,
    onBadgeClick,
    isLoading = false,
    emptyMessage = "Não existem badges para apresentar.",
}) {
    const colunas = [
        {
            key: "badge",
            titulo: "Badge",
            className: "vt-col-badge",
            headerClassName: "vt-col-badge",
            render: (badge) => {
                const nome = obterNomeBadge(badge);

                return (
                    <ThumbBadge
                        badge={badge}
                        nome={nome}
                    />
                );
            },
        },
        {
            key: "area",
            titulo: "Área",
            render: (badge) => badge.nome_area || badge.area || "—",
        },
        {
            key: "serviceLine",
            titulo: "Service Line",
            render: (badge) =>
                badge.nome_service_line || badge.serviceLine || "—",
        },
        {
            key: "learningPath",
            titulo: "Learning Path",
            render: (badge) =>
                badge.nome_learning_path || badge.learningPath || "—",
        },
        {
            key: "nivel",
            titulo: "Nível",
            render: (badge) => badge.nome_nivel || badge.nivel || "—",
        },
        {
            key: "pontos",
            titulo: "Pontos",
            align: "center",
            render: (badge) => badge.pontos_badge ?? badge.pontos ?? "—",
        },
        {
            key: "validade",
            titulo: "Validade",
            align: "center",
            render: (badge) =>
                badge.validade !== null && badge.validade !== undefined
                    ? `${badge.validade} dias`
                    : "—",
        },
        {
            key: "tipo",
            titulo: "Tipo",
            align: "center",
            render: (badge) => (
                <TipoBadge especial={badge.especial === true} />
            ),
        },
    ];

    return (
        <VistaTabela_Base
            dados={badges}
            colunas={colunas}
            onEdit={onEdit}
            onDelete={onDelete}
            onRowClick={onBadgeClick}
            getRowKey={obterIdBadge}
            getItemLabel={obterNomeBadge}
            isLoading={isLoading}
            emptyMessage={emptyMessage}
            loadingMessage="A carregar badges..."
            larguraMinima="980px"
            className="vista-tabela-badges"
        />
    );
}

export default VistaTabelaBadges;