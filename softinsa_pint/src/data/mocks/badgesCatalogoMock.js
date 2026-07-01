import badgeLowCode from "../../assets/badges/Low Code.png";
import badgeLowCode2 from "../../assets/badges/Low Code 2.png";
import badgeLowCode3 from "../../assets/badges/Low Code 3.png";
import badgeLowCode4 from "../../assets/badges/Low Code 4.png";
import badgeLowCode5 from "../../assets/badges/Low Code 5.png";
import badgeTeste from "../../assets/teste_badge.png";

const badgesCatalogoMock = [
    {
        id_badge: 1,
        nome_badge: "Mentor de Ouro",
        descricao_badge: "Badge especial de reconhecimento interno.",
        imagem: badgeLowCode,
        especial: true,
        pontos_badge: 500,
        validade: 730,

        id_nivel: 5,
        nome_nivel: "Líder de conhecimento",

        id_area: 1,
        nome_area: "Geral",

        id_service_line: 1,
        nome_service_line: "Geral",

        id_learning_path: 1,
        nome_learning_path: "Reconhecimento",

        data_criacao: "2026-01-10",
    },
    {
        id_badge: 2,
        nome_badge: "Lenda Softinsa",
        descricao_badge: "Badge especial atribuído por conquistas excecionais.",
        imagem: badgeLowCode2,
        especial: true,
        pontos_badge: 1000,
        validade: 730,

        id_nivel: 5,
        nome_nivel: "Líder de conhecimento",

        id_area: 1,
        nome_area: "Geral",

        id_service_line: 1,
        nome_service_line: "Geral",

        id_learning_path: 1,
        nome_learning_path: "Reconhecimento",

        data_criacao: "2026-02-01",
    },
    {
        id_badge: 3,
        nome_badge: "AWS Architect",
        descricao_badge: "Competências em arquitetura cloud AWS.",
        imagem: badgeLowCode3,
        especial: true,
        pontos_badge: 350,
        imagem: badgeLowCode3,
        especial: true,
        pontos_badge: 350,
        validade: 365,

        id_nivel: 4,
        nome_nivel: "Especialista",

        id_area: 3,
        nome_area: "Cloud",

        id_service_line: 2,
        nome_service_line: "Hybrid Cloud",

        id_learning_path: 2,
        nome_learning_path: "Jornada Técnica",

        data_criacao: "2026-02-20",
    },
    {
        id_badge: 10,
        nome_badge: "Low Code Junior",
        descricao_badge: "Fundamentos de desenvolvimento low-code.",
        imagem: badgeLowCode,
        especial: false,
        pontos_badge: 150,
        validade: 365,

        id_nivel: 1,
        nome_nivel: "Junior",

        id_area: 2,
        nome_area: "Low Code",

        id_service_line: 2,
        nome_service_line: "Hybrid Cloud",

        id_learning_path: 2,
        nome_learning_path: "Jornada Técnica",

        data_criacao: "2026-03-15",
    },
    {
        id_badge: 11,
        nome_badge: "Low Code Intermédio",
        descricao_badge: "Construção de soluções low-code com autonomia.",
        imagem: badgeLowCode2,
        especial: false,
        pontos_badge: 200,
        validade: 365,

        id_nivel: 2,
        nome_nivel: "Intermédio",

        id_area: 2,
        nome_area: "Low Code",

        id_service_line: 2,
        nome_service_line: "Hybrid Cloud",

        id_learning_path: 2,
        nome_learning_path: "Jornada Técnica",

        data_criacao: "2026-04-02",
    },
    {
        id_badge: 12,
        nome_badge: "Cloud Foundations",
        descricao_badge: "Fundamentos de cloud e serviços base.",
        imagem: badgeLowCode3,
        especial: false,
        pontos_badge: 180,
        validade: 365,

        id_nivel: 1,
        nome_nivel: "Junior",

        id_area: 3,
        nome_area: "Cloud",

        id_service_line: 2,
        nome_service_line: "Hybrid Cloud",

        id_learning_path: 2,
        nome_learning_path: "Jornada Técnica",

        data_criacao: "2026-04-10",
    },
    {
        id_badge: 13,
        nome_badge: "API Master",
        descricao_badge: "Desenvolvimento e integração de APIs.",
        imagem: badgeLowCode4,
        especial: false,
        pontos_badge: 220,
        validade: 365,

        id_nivel: 3,
        nome_nivel: "Sénior",

        id_area: 4,
        nome_area: "Backend",

        id_service_line: 3,
        nome_service_line: "Application Operations",

        id_learning_path: 2,
        nome_learning_path: "Jornada Técnica",

        data_criacao: "2026-04-22",
    },
    {
        id_badge: 14,
        nome_badge: "DevOps Basics",
        descricao_badge: "Fundamentos de automação, pipelines e DevOps.",
        imagem: badgeLowCode5,
        especial: false,
        pontos_badge: 150,
        validade: 365,

        id_nivel: 1,
        nome_nivel: "Junior",

        id_area: 5,
        nome_area: "DevOps",

        id_service_line: 3,
        nome_service_line: "Application Operations",

        id_learning_path: 2,
        nome_learning_path: "Jornada Técnica",

        data_criacao: "2026-05-05",
    },
    {
        id_badge: 20,
        nome_badge: "Data Analytics",
        descricao_badge: "Análise de dados e interpretação de métricas.",
        imagem: badgeTeste,
        especial: false,
        pontos_badge: 200,
        validade: 365,

        id_nivel: 2,
        nome_nivel: "Intermédio",

        id_area: 6,
        nome_area: "Data & AI",

        id_service_line: 4,
        nome_service_line: "Data & AI",

        id_learning_path: 3,
        nome_learning_path: "Jornada Analítica",

        data_criacao: "2025-12-12",
    },
    {
        id_badge: 21,
        nome_badge: "Cyber Awareness",
        descricao_badge: "Boas práticas de segurança e proteção de sistemas.",
        imagem: badgeLowCode4,
        especial: false,
        pontos_badge: 130,
        validade: 365,

        id_nivel: 1,
        nome_nivel: "Junior",

        id_area: 7,
        nome_area: "Cybersecurity",

        id_service_line: 5,
        nome_service_line: "Cybersecurity",

        id_learning_path: 4,
        nome_learning_path: "Jornada de Segurança",

        data_criacao: "2025-09-01",
    },
    {
        id_badge: 22,
        nome_badge: "Agile Foundations",
        descricao_badge: "Princípios base de metodologias ágeis.",
        imagem: badgeLowCode2,
        especial: false,
        pontos_badge: 120,
        validade: 365,

        id_nivel: 1,
        nome_nivel: "Junior",

        id_area: 8,
        nome_area: "Project Management",

        id_service_line: 6,
        nome_service_line: "Delivery",

        id_learning_path: 5,
        nome_learning_path: "Jornada de Gestão",

        data_criacao: "2026-02-18",
    },
    {
        id_badge: 23,
        nome_badge: "UX Research",
        descricao_badge: "Pesquisa com utilizadores e análise de experiência.",
        imagem: badgeLowCode5,
        especial: false,
        pontos_badge: 160,
        validade: 365,

        id_nivel: 2,
        nome_nivel: "Intermédio",

        id_area: 9,
        nome_area: "Design",

        id_service_line: 7,
        nome_service_line: "Design",

        id_learning_path: 6,
        nome_learning_path: "Jornada Criativa",

        data_criacao: "2026-03-30",
    },
];

export default badgesCatalogoMock;