import VistaTabela_Base from "../../ui/VistaTabela_Base/VistaTabela_Base";
import "./VistaTabelaLearningPaths.css";

function obterIdLearningPath(learningPath, index) {
    return (
        learningPath.id_learning_path ??
        learningPath.idLearningPath ??
        learningPath.id ??
        index
    );
}

function obterNomeLearningPath(learningPath) {
    return (
        learningPath.nome_learning_path ??
        learningPath.nomeLearningPath ??
        learningPath.nome ??
        learningPath.learningPath ??
        "Learning Path"
    );
}

function VistaTabelaLearningPaths({
    learningPaths = [],
    onEdit,
    onDelete,
    isLoading = false,
    emptyMessage = "Não existem learning paths para apresentar.",
}) {
    const colunas = [
        {
            key: "learningPath",
            titulo: "Learning Path",
            className: "vt-learning-path-col-nome",
            headerClassName: "vt-learning-path-col-nome",
            render: (learningPath) => (
                <span className="texto-nome-badge-destaque vt-learning-path-nome">
                    {obterNomeLearningPath(learningPath)}
                </span>
            ),
        },
        {
            key: "serviceLines",
            titulo: "Service Lines",
            align: "center",
            render: (learningPath) =>
                learningPath.total_service_lines ??
                learningPath.totalServiceLines ??
                0,
        },
        {
            key: "areas",
            titulo: "Áreas",
            align: "center",
            render: (learningPath) =>
                learningPath.total_areas ?? learningPath.totalAreas ?? 0,
        },
        {
            key: "badges",
            titulo: "Badges",
            align: "center",
            render: (learningPath) =>
                learningPath.total_badges ?? learningPath.totalBadges ?? 0,
        },
    ];

    return (
        <VistaTabela_Base
            dados={learningPaths}
            colunas={colunas}
            onEdit={onEdit}
            onDelete={onDelete}
            getRowKey={obterIdLearningPath}
            getItemLabel={obterNomeLearningPath}
            isLoading={isLoading}
            emptyMessage={emptyMessage}
            loadingMessage="A carregar learning paths..."
            larguraMinima="720px"
            className="vista-tabela-learning-paths"
        />
    );
}

export default VistaTabelaLearningPaths;