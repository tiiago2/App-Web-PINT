const { Utilizador, Role, Permissoes } = require("../models");

const MAPA_PERMISSOES = {
    "upload-evidencias": {
        "Consultor": ["Upload de Evidências"],
        "Administrador": ["Upload de Evidências"]
    },
    "partilha-linkedin": {
        "Talent Manager": ["Partilha Externa (LinkedIn)"],
        "Service Line Leader": ["Partilha Externa (LinkedIn)"],
        "Consultor": ["Partilha Externa (LinkedIn)"],
        "Administrador": ["Partilha Externa (LinkedIn)"]
    },
    "exportar": {
        "Talent Manager": ["Exportação de Dados"],
        "Service Line Leader": ["Gerar Relatórios de Área"],
        "Consultor": ["Download de PDFs"],
        "Administrador": ["Exportação de Dados", "Gerar Relatórios de Área", "Download de PDFs"]
    },
    "download-pdf": {
        "Talent Manager": ["Download de PDFs", "Exportação de Dados"],
        "Service Line Leader": ["Download de PDFs", "Gerar Relatórios de Área"],
        "Consultor": ["Download de PDFs"],
        "Administrador": ["Download de PDFs", "Exportação de Dados", "Gerar Relatórios de Área"]
    }
};

module.exports = {
    async verificarPermissao(req, res) {
        try {
            const { chave } = req.params;
            const idUtilizador = req.utilizadorLogado.id_utilizador;
            const perfil = req.headers['x-user-role']; // Obtido do intercetor de pedidos do frontend

            const mapaChave = MAPA_PERMISSOES[chave];

            if (!mapaChave) {
                return res.status(400).json({
                    autorizado: false,
                    error: "Permissão inválida.",
                });
            }

            // Descobrir a permissão correspondente para o perfil ativo
            let descricaoPermissao = perfil ? mapaChave[perfil] : null;
            if (!descricaoPermissao) {
                // Fallback para todas as descrições da chave caso não venha o perfil
                descricaoPermissao = Object.values(mapaChave).flat();
            }

            const descricoes = Array.isArray(descricaoPermissao)
                ? descricaoPermissao
                : [descricaoPermissao];

            const utilizador = await Utilizador.findOne({
                where: {
                    id_utilizador: idUtilizador,
                },
                include: [
                    {
                        model: Role,
                        attributes: ["id_role", "nome_role"],
                        where: perfil ? { nome_role: perfil } : {}, // Garante que o utilizador tem esse Role atribuído na BD
                        through: {
                            attributes: [],
                        },
                        required: true,
                        include: [
                            {
                                model: Permissoes,
                                attributes: [
                                    "id_permissao",
                                    "descricao_permissao",
                                    "toggle",
                                ],
                                through: {
                                    attributes: [],
                                },
                                where: {
                                    descricao_permissao: descricoes,
                                },
                                required: true,
                            },
                        ],
                    },
                ],
            });

            if (!utilizador) {
                return res.status(200).json({
                    chave,
                    descricao_permissao: descricoes,
                    autorizado: false,
                    toggle: false,
                    mensagem:
                        "O utilizador não tem esta permissão associada ao seu role.",
                });
            }

            const permissaoEncontrada = utilizador.Roles
                .flatMap((role) => role.Permissoes || [])
                .find(
                    (permissao) =>
                        descricoes.includes(permissao.descricao_permissao)
                );

            const autorizado = permissaoEncontrada?.toggle === true;

            return res.status(200).json({
                chave,
                descricao_permissao: permissaoEncontrada ? permissaoEncontrada.descricao_permissao : null,
                autorizado,
                toggle: autorizado,
                permissao: permissaoEncontrada || null,
            });
        } catch (error) {
            console.error("Erro ao verificar permissão:", error);

            return res.status(500).json({
                autorizado: false,
                error: "Erro ao verificar permissão.",
            });
        }
    },
};