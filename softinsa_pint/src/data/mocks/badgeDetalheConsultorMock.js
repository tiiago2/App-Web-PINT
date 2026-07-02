const badgeDetalheConsultorMock = {
    submissoes: [
        {
            id_submissao: 1001,
            id_badge: 10,
            id_utilizador: 1,
            status: "aceite",
            data_submissao: "2026-03-18T10:00:00+00:00",
        },
        {
            id_submissao: 1002,
            id_badge: 11,
            id_utilizador: 1,
            status: "em_progresso",
            data_submissao: "2026-04-05T10:00:00+00:00",
        },
        {
            id_submissao: 1003,
            id_badge: 12,
            id_utilizador: 1,
            status: "pendente",
            data_submissao: "2026-04-12T10:00:00+00:00",
        },
        {
            id_submissao: 1004,
            id_badge: 13,
            id_utilizador: 1,
            status: "recusada",
            data_submissao: "2026-04-25T10:00:00+00:00",
        },
        {
            id_submissao: 1005,
            id_badge: 21,
            id_utilizador: 1,
            status: "aceite",
            data_submissao: "2025-09-10T10:00:00+00:00",
        },
        {
            id_submissao: 1006,
            id_badge: 22,
            id_utilizador: 1,
            status: "em_progresso",
            data_submissao: "2026-02-20T10:00:00+00:00",
        },
    ],

    documentos: [
        {
            id_submissao: 1001,
            id_ficheiro: 1,
            id_requisito: 1,
            ficheiro: "formacao-low-code.pdf",
            updated_file: "2026-03-18T10:10:00+00:00",
            deleted_file: false,
        },
        {
            id_submissao: 1001,
            id_ficheiro: 2,
            id_requisito: 2,
            ficheiro: "projeto-low-code.pdf",
            updated_file: "2026-03-18T10:12:00+00:00",
            deleted_file: false,
        },
        {
            id_submissao: 1001,
            id_ficheiro: 3,
            id_requisito: 3,
            ficheiro: "validacao-tecnica.pdf",
            updated_file: "2026-03-18T10:14:00+00:00",
            deleted_file: false,
        },
        {
            id_submissao: 1001,
            id_ficheiro: 4,
            id_requisito: 4,
            ficheiro: "partilha-conhecimento.pdf",
            updated_file: "2026-03-18T10:16:00+00:00",
            deleted_file: false,
        },

        {
            id_submissao: 1002,
            id_ficheiro: 5,
            id_requisito: 1,
            ficheiro: "formacao-low-code-intermedio.pdf",
            updated_file: "2026-04-05T10:10:00+00:00",
            deleted_file: false,
        },
        {
            id_submissao: 1002,
            id_ficheiro: 6,
            id_requisito: 2,
            ficheiro: "projeto-low-code-intermedio.pdf",
            updated_file: "2026-04-06T11:30:00+00:00",
            deleted_file: false,
        },

        {
            id_submissao: 1003,
            id_ficheiro: 7,
            id_requisito: 1,
            ficheiro: "formacao-cloud.pdf",
            updated_file: "2026-04-12T09:20:00+00:00",
            deleted_file: false,
        },
        {
            id_submissao: 1003,
            id_ficheiro: 8,
            id_requisito: 2,
            ficheiro: "projeto-cloud.pdf",
            updated_file: "2026-04-12T09:30:00+00:00",
            deleted_file: false,
        },
        {
            id_submissao: 1003,
            id_ficheiro: 9,
            id_requisito: 3,
            ficheiro: "validacao-cloud.pdf",
            updated_file: "2026-04-12T09:40:00+00:00",
            deleted_file: false,
        },

        {
            id_submissao: 1004,
            id_ficheiro: 10,
            id_requisito: 1,
            ficheiro: "formacao-api.pdf",
            updated_file: "2026-04-25T12:00:00+00:00",
            deleted_file: false,
        },
        {
            id_submissao: 1004,
            id_ficheiro: 11,
            id_requisito: 2,
            ficheiro: "projeto-api.pdf",
            updated_file: "2026-04-25T12:15:00+00:00",
            deleted_file: false,
        },

        {
            id_submissao: 1005,
            id_ficheiro: 12,
            id_requisito: 1,
            ficheiro: "formacao-cyber.pdf",
            updated_file: "2025-09-10T10:20:00+00:00",
            deleted_file: false,
        },
        {
            id_submissao: 1005,
            id_ficheiro: 13,
            id_requisito: 3,
            ficheiro: "validacao-cyber.pdf",
            updated_file: "2025-09-10T10:30:00+00:00",
            deleted_file: false,
        },
        {
            id_submissao: 1005,
            id_ficheiro: 14,
            id_requisito: 5,
            ficheiro: "certificacao-cyber.pdf",
            updated_file: "2025-09-10T10:40:00+00:00",
            deleted_file: false,
        },

        {
            id_submissao: 1006,
            id_ficheiro: 15,
            id_requisito: 1,
            ficheiro: "formacao-agile.pdf",
            updated_file: "2026-02-20T10:20:00+00:00",
            deleted_file: false,
        },
    ],

    historico: [
        {
            id_utilizador: 1,
            id_submissao: 1001,
            aceite: true,
            feedback: null,
            data_avaliacao: "2026-03-28T15:00:00+00:00",
        },
        {
            id_utilizador: 1,
            id_submissao: 1004,
            aceite: false,
            feedback:
                "A candidatura não demonstra ainda experiência suficiente para este badge. Revê os requisitos e volta a submeter quando tiveres documentação mais completa.",
            data_avaliacao: "2026-05-02T15:00:00+00:00",
        },
        {
            id_utilizador: 1,
            id_submissao: 1005,
            aceite: true,
            feedback: null,
            data_avaliacao: "2025-09-25T15:00:00+00:00",
        },
    ],

    registoBadges: [
        {
            id_registo: 1,
            id_badge: 10,
            id_utilizador: 1,
            data_obtencao: "2026-03-28T15:00:00+00:00",
        },
        {
            id_registo: 2,
            id_badge: 21,
            id_utilizador: 1,
            data_obtencao: "2025-09-25T15:00:00+00:00",
        },
    ],
};

export default badgeDetalheConsultorMock;