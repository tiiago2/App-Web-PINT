import VistaTabela_Base from "../../ui/VistaTabela_Base/VistaTabela_Base";
import "./VistaTabelaServiceLines.css";

function obterIdServiceLine(serviceLine, index) {
    return (
        serviceLine.id_service_line ??
        serviceLine.idServiceLine ??
        serviceLine.id ??
        index
    );
}

function obterNomeServiceLine(serviceLine) {
    return (
        serviceLine.nome_service_line ??
        serviceLine.nomeServiceLine ??
        serviceLine.nome ??
        serviceLine.serviceLine ??
        "Service Line"
    );
}

function VistaTabelaServiceLines({
    serviceLines = [],
    onEdit,
    onDelete,
    isLoading = false,
    emptyMessage = "Não existem service lines para apresentar.",
}) {
    const colunas = [
        {
            key: "serviceLine",
            titulo: "Service Line",
            className: "vt-service-line-col-nome",
            headerClassName: "vt-service-line-col-nome",
            render: (serviceLine) => (
                <span className="texto-nome-badge-destaque vt-service-line-nome">
                    {obterNomeServiceLine(serviceLine)}
                </span>
            ),
        },
        {
            key: "learningPath",
            titulo: "Learning Path",
            render: (serviceLine) =>
                serviceLine.nome_learning_path ??
                serviceLine.learningPath ??
                "—",
        },
        {
            key: "areas",
            titulo: "Áreas",
            align: "center",
            render: (serviceLine) =>
                serviceLine.total_areas ?? serviceLine.totalAreas ?? 0,
        },
        {
            key: "badges",
            titulo: "Badges",
            align: "center",
            render: (serviceLine) =>
                serviceLine.total_badges ?? serviceLine.totalBadges ?? 0,
        },
    ];

    return (
        <VistaTabela_Base
            dados={serviceLines}
            colunas={colunas}
            onEdit={onEdit}
            onDelete={onDelete}
            getRowKey={obterIdServiceLine}
            getItemLabel={obterNomeServiceLine}
            isLoading={isLoading}
            emptyMessage={emptyMessage}
            loadingMessage="A carregar service lines..."
            larguraMinima="760px"
            className="vista-tabela-service-lines"
        />
    );
}

export default VistaTabelaServiceLines;