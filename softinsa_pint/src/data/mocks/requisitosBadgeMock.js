const requisitosMock = [
    {
        id_requisito: 1,
        nome_requisito: "Formação introdutória",
        descricao_requisito: "Concluir uma formação introdutória relacionada com a área do badge.",
        updated_requisitos: "2026-01-10T00:00:00+00:00",
        deleted_requisitos: false,
    },
    {
        id_requisito: 2,
        nome_requisito: "Projeto prático",
        descricao_requisito: "Anexar documentação de um projeto prático relacionado com o badge.",
        updated_requisitos: "2026-01-10T00:00:00+00:00",
        deleted_requisitos: false,
    },
    {
        id_requisito: 3,
        nome_requisito: "Validação técnica",
        descricao_requisito: "Anexar comprovativo de validação técnica ou revisão realizada.",
        updated_requisitos: "2026-01-10T00:00:00+00:00",
        deleted_requisitos: false,
    },
    {
        id_requisito: 4,
        nome_requisito: "Partilha de conhecimento",
        descricao_requisito: "Demonstrar partilha de conhecimento através de sessão, documentação ou mentoria.",
        updated_requisitos: "2026-01-10T00:00:00+00:00",
        deleted_requisitos: false,
    },
    {
        id_requisito: 5,
        nome_requisito: "Certificação externa",
        descricao_requisito: "Anexar certificado externo válido relacionado com a competência do badge.",
        updated_requisitos: "2026-01-10T00:00:00+00:00",
        deleted_requisitos: false,
    },
    {
        id_requisito: 6,
        nome_requisito: "Experiência comprovada",
        descricao_requisito: "Anexar documento que comprove experiência prática na área do badge.",
        updated_requisitos: "2026-01-10T00:00:00+00:00",
        deleted_requisitos: false,
    },
];

const requisitosBadgeMock = [
    { id_badge: 1, id_requisito: 4 },
    { id_badge: 1, id_requisito: 6 },

    { id_badge: 2, id_requisito: 4 },
    { id_badge: 2, id_requisito: 5 },
    { id_badge: 2, id_requisito: 6 },

    { id_badge: 3, id_requisito: 1 },
    { id_badge: 3, id_requisito: 2 },
    { id_badge: 3, id_requisito: 5 },

    { id_badge: 10, id_requisito: 1 },
    { id_badge: 10, id_requisito: 2 },
    { id_badge: 10, id_requisito: 3 },
    { id_badge: 10, id_requisito: 4 },

    { id_badge: 11, id_requisito: 1 },
    { id_badge: 11, id_requisito: 2 },
    { id_badge: 11, id_requisito: 3 },
    { id_badge: 11, id_requisito: 4 },

    { id_badge: 12, id_requisito: 1 },
    { id_badge: 12, id_requisito: 2 },
    { id_badge: 12, id_requisito: 3 },

    { id_badge: 13, id_requisito: 1 },
    { id_badge: 13, id_requisito: 2 },
    { id_badge: 13, id_requisito: 3 },
    { id_badge: 13, id_requisito: 6 },

    { id_badge: 14, id_requisito: 1 },
    { id_badge: 14, id_requisito: 2 },
    { id_badge: 14, id_requisito: 3 },

    { id_badge: 20, id_requisito: 1 },
    { id_badge: 20, id_requisito: 2 },
    { id_badge: 20, id_requisito: 6 },

    { id_badge: 21, id_requisito: 1 },
    { id_badge: 21, id_requisito: 3 },
    { id_badge: 21, id_requisito: 5 },

    { id_badge: 22, id_requisito: 1 },
    { id_badge: 22, id_requisito: 2 },
    { id_badge: 22, id_requisito: 4 },

    { id_badge: 23, id_requisito: 1 },
    { id_badge: 23, id_requisito: 2 },
    { id_badge: 23, id_requisito: 6 },
];

export { requisitosMock, requisitosBadgeMock };

export default {
    requisitosMock,
    requisitosBadgeMock,
};