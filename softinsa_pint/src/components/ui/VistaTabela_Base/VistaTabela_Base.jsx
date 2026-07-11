import "./VistaTabela_Base.css";
import SkeletonTabela from "../Loading/SkeletonTabela";

function valorOuTraco(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return "—";
    }

    return valor;
}

function VistaTabela_Base({
    dados = [],
    colunas = [],
    onEdit,
    onDelete,
    onRowClick,
    getRowKey,
    getItemLabel,
    isLoading = false,
    emptyMessage = "Não existem dados para apresentar.",
    mostrarAcoes = true,
    tituloAcoes = "Ações",
    larguraMinima = "980px",
    className = "",
}) {
    const temAcoes = mostrarAcoes && (onEdit || onDelete);

    if (isLoading) {
        return (
            <div className={`vista-tabela-base ${className}`}>
                <SkeletonTabela linhas={5} colunas={colunas.length || 4} />
            </div>
        );
    }

    if (!dados || dados.length === 0) {
        return (
            <div className={`vista-tabela-base ${className}`}>
                <div className="vista-tabela-base-mensagem">
                    {emptyMessage}
                </div>
            </div>
        );
    }

    return (
        <div className={`vista-tabela-base ${className}`}>
            <div className="vista-tabela-base-scroll">
                <table
                    className="vista-tabela-base-tabela"
                    style={{ "--largura-minima-vista-tabela": larguraMinima }}
                >
                    <thead>
                        <tr>
                            {colunas.map((coluna) => (
                                <th
                                    key={coluna.key}
                                    className={[
                                        coluna.align === "center" ? "vtb-col-centro" : "",
                                        coluna.headerClassName || "",
                                    ]
                                        .filter(Boolean)
                                        .join(" ")}
                                >
                                    {coluna.titulo}
                                </th>
                            ))}

                            {temAcoes && (
                                <th className="vtb-col-acoes">
                                    {tituloAcoes}
                                </th>
                            )}
                        </tr>
                    </thead>

                    <tbody>
                        {dados.map((item, index) => {
                            const rowKey = getRowKey
                                ? getRowKey(item, index)
                                : item.id ?? item.id_badge ?? item.id_area ?? item.id_service_line ?? item.id_learning_path ?? index;

                            const itemLabel = getItemLabel
                                ? getItemLabel(item)
                                : item.nome ?? item.nome_badge ?? item.nome_area ?? item.nome_service_line ?? item.nome_learning_path ?? "item";

                            const linhaClicavel = typeof onRowClick === "function";

                            return (
                                <tr
                                    key={rowKey}
                                    className={linhaClicavel ? "vtb-linha-clicavel" : ""}
                                    onClick={linhaClicavel ? () => onRowClick(item) : undefined}
                                >
                                    {colunas.map((coluna) => (
                                        <td
                                            key={coluna.key}
                                            className={[
                                                coluna.align === "center" ? "vtb-col-centro" : "",
                                                coluna.className || "",
                                            ]
                                                .filter(Boolean)
                                                .join(" ")}
                                        >
                                            {coluna.render
                                                ? coluna.render(item, index)
                                                : valorOuTraco(item[coluna.key])}
                                        </td>
                                    ))}

                                    {temAcoes && (
                                        <td className="vtb-col-acoes">
                                            <div className="vtb-acoes">
                                                {onEdit && (
                                                    <button
                                                        type="button"
                                                        className="vtb-botao-acao"
                                                        aria-label={`Editar ${itemLabel}`}
                                                        onClick={(event) => {
                                                        event.stopPropagation();
                                                        onEdit(item);
                                                        }}
                                                    >
                                                        <i className="fi fi-br-pencil"></i>
                                                    </button>
                                                )}

                                                {onDelete && (
                                                    <button
                                                        type="button"
                                                        className="vtb-botao-acao vtb-botao-acao-eliminar"
                                                        aria-label={`Eliminar ${itemLabel}`}
                                                        onClick={(event) => {
                                                        event.stopPropagation();
                                                        onDelete(item);
                                                        }}
                                                    >
                                                        <i className="fi fi-br-trash"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default VistaTabela_Base;