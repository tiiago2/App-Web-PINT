import VistaTabela_Base from "../../ui/VistaTabela_Base/VistaTabela_Base";
import "./VistaTabelaAreas.css";

function obterIdArea(area, index) {
    return area.id_area ?? area.idArea ?? area.id ?? index;
}

function obterNomeArea(area) {
    return area.nome_area ?? area.nomeArea ?? area.nome ?? area.area ?? "Área";
}

function VistaTabelaAreas({
    areas = [],
    onEdit,
    onDelete,
    isLoading = false,
    emptyMessage = "Não existem áreas para apresentar.",
}) {
    const colunas = [
        {
            key: "area",
            titulo: "Área",
            className: "vt-area-col-nome",
            headerClassName: "vt-area-col-nome",
            render: (area) => (
                <span className="texto-nome-badge-destaque vt-area-nome">
                    {obterNomeArea(area)}
                </span>
            ),
        },
        {
            key: "serviceLine",
            titulo: "Service Line",
            render: (area) =>
                area.nome_service_line ?? area.serviceLine ?? "—",
        },
        {
            key: "learningPath",
            titulo: "Learning Path",
            render: (area) =>
                area.nome_learning_path ?? area.learningPath ?? "—",
        },
        {
            key: "badges",
            titulo: "Badges",
            align: "center",
            render: (area) =>
                area.total_badges ?? area.totalBadges ?? 0,
        },
    ];

    return (
        <VistaTabela_Base
            dados={areas}
            colunas={colunas}
            onEdit={onEdit}
            onDelete={onDelete}
            getRowKey={obterIdArea}
            getItemLabel={obterNomeArea}
            isLoading={isLoading}
            emptyMessage={emptyMessage}
            loadingMessage="A carregar áreas..."
            larguraMinima="760px"
            className="vista-tabela-areas"
        />
    );
}

export default VistaTabelaAreas;