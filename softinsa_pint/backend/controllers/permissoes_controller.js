const { Utilizador, Role, Permissoes } = require("../models");

const MAPA_PERMISSOES = {
    "partilha-linkedin": "Partilha Externa (LinkedIn)",
};

module.exports = {
    async verificarPermissao(req, res) {
        try {
            const { chave } = req.params;
            const idUtilizador = req.utilizadorLogado.id_utilizador;

            const descricaoPermissao = MAPA_PERMISSOES[chave];

            if (!descricaoPermissao) {
                return res.status(400).json({
                    autorizado: false,
                    error: "Permissão inválida.",
                });
            }

            const utilizador = await Utilizador.findOne({
                where: {
                    id_utilizador: idUtilizador,
                },
                include: [
                    {
                        model: Role,
                        attributes: ["id_role", "nome_role"],
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
                                    descricao_permissao: descricaoPermissao,
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
                    descricao_permissao: descricaoPermissao,
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
                        permissao.descricao_permissao === descricaoPermissao
                );

            const autorizado = permissaoEncontrada?.toggle === true;

            return res.status(200).json({
                chave,
                descricao_permissao: descricaoPermissao,
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