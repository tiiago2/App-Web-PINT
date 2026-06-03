import badgeLowCode from "../assets/badges/Low Code.png";
import badgeLowCode2 from "../assets/badges/Low Code 2.png";
import badgeLowCode3 from "../assets/badges/Low Code 3.png";
import badgeLowCode4 from "../assets/badges/Low Code 4.png";
import badgeLowCode5 from "../assets/badges/Low Code 5.png";
import badgeTeste from "../assets/teste_badge.png";

const badgesConsultorMock = [
  /* =========================
     BADGES ESPECIAIS
     ========================= */

  {
    idBadge: 1,
    nomeBadge: "Mentor de Ouro",
    pontosBadge: 500,

    idArea: 1,
    nomeArea: "Geral",
    serviceLine: "Geral",
    learningPath: "Reconhecimento",

    idNivel: 3,
    nivel: "Avançado",
    validade: "Permanente",

    especial: true,
    tipoEspecial: "gold",

    estado: "conquistados",
    progresso: 100,

    imagemBadge: badgeLowCode,
    icone: "fi-br-badge",

    grupo: "badgesEspeciais",
    temaVisual: "gold",
    dataCriacao: "2026-01-10",
  },

  {
    idBadge: 2,
    nomeBadge: "Embaixador Prata",
    pontosBadge: 300,

    idArea: 1,
    nomeArea: "Geral",
    serviceLine: "Geral",
    learningPath: "Reconhecimento",

    idNivel: 2,
    nivel: "Intermédio",
    validade: "Permanente",

    especial: true,
    tipoEspecial: "silver",

    estado: "pendentes",
    progresso: 100,

    imagemBadge: badgeLowCode2,
    icone: "fi-br-badge",

    grupo: "badgesEspeciais",
    temaVisual: "silver",
    dataCriacao: "2026-01-18",
  },

  {
    idBadge: 3,
    nomeBadge: "Lenda Softinsa",
    pontosBadge: 1000,

    idArea: 1,
    nomeArea: "Geral",
    serviceLine: "Geral",
    learningPath: "Reconhecimento",

    idNivel: 4,
    nivel: "Master",
    validade: "Permanente",

    especial: true,
    tipoEspecial: "gold",

    estado: "bloqueados",
    progresso: 0,

    imagemBadge: badgeLowCode3,
    icone: "fi-br-badge",

    grupo: "badgesEspeciais",
    temaVisual: "gold",
    dataCriacao: "2026-02-01",
  },

  /* =========================
     A MINHA ÁREA
     ========================= */

  {
    idBadge: 10,
    nomeBadge: "Low Code",
    pontosBadge: 150,

    idArea: 2,
    nomeArea: "Hybrid Systems",
    serviceLine: "Hybrid Systems",
    learningPath: "Jornada Técnica",

    idNivel: 1,
    nivel: "Inicial",
    validade: "1 ano",

    especial: false,
    tipoEspecial: null,

    estado: "conquistados",
    progresso: 100,

    imagemBadge: badgeLowCode,
    icone: "fi-br-badge",

    grupo: "minhaArea",
    temaVisual: "azul",
    dataCriacao: "2026-03-15",
  },

  {
    idBadge: 11,
    nomeBadge: "Integration Pro",
    pontosBadge: 200,

    idArea: 2,
    nomeArea: "Hybrid Systems",
    serviceLine: "Hybrid Systems",
    learningPath: "Jornada Técnica",

    idNivel: 2,
    nivel: "Intermédio",
    validade: "1 ano",

    especial: false,
    tipoEspecial: null,

    estado: "emProgresso",
    progresso: 65,

    imagemBadge: badgeLowCode2,
    icone: "fi-br-badge",

    grupo: "minhaArea",
    temaVisual: "verde",
    dataCriacao: "2026-04-02",
  },

  {
    idBadge: 12,
    nomeBadge: "Cloud Foundations",
    pontosBadge: 180,

    idArea: 2,
    nomeArea: "Hybrid Systems",
    serviceLine: "Hybrid Systems",
    learningPath: "Jornada Técnica",

    idNivel: 1,
    nivel: "Inicial",
    validade: "1 ano",

    especial: false,
    tipoEspecial: null,

    estado: "pendentes",
    progresso: 100,

    imagemBadge: badgeLowCode3,
    icone: "fi-br-badge",

    grupo: "minhaArea",
    temaVisual: "azulClaro",
    dataCriacao: "2026-04-10",
  },

  {
    idBadge: 13,
    nomeBadge: "API Master",
    pontosBadge: 220,

    idArea: 2,
    nomeArea: "Hybrid Systems",
    serviceLine: "Hybrid Systems",
    learningPath: "Jornada Técnica",

    idNivel: 3,
    nivel: "Avançado",
    validade: "1 ano",

    especial: false,
    tipoEspecial: null,

    estado: "recusados",
    progresso: 0,

    imagemBadge: badgeLowCode4,
    icone: "fi-br-badge",

    grupo: "minhaArea",
    temaVisual: "amarelo",
    dataCriacao: "2026-04-22",
  },

  {
    idBadge: 14,
    nomeBadge: "DevOps Basics",
    pontosBadge: 150,

    idArea: 2,
    nomeArea: "Hybrid Systems",
    serviceLine: "Hybrid Systems",
    learningPath: "Jornada Técnica",

    idNivel: 1,
    nivel: "Inicial",
    validade: "1 ano",

    especial: false,
    tipoEspecial: null,

    estado: "bloqueados",
    progresso: 0,

    imagemBadge: badgeLowCode5,
    icone: "fi-br-badge",

    grupo: "minhaArea",
    temaVisual: "roxo",
    dataCriacao: "2026-05-05",
  },

  /* =========================
     OUTRAS ÁREAS
     ========================= */

  {
    idBadge: 20,
    nomeBadge: "Data Analytics",
    pontosBadge: 200,

    idArea: 3,
    nomeArea: "Data & AI",
    serviceLine: "Data & AI",
    learningPath: "Jornada Analítica",

    idNivel: 2,
    nivel: "Intermédio",
    validade: "1 ano",

    especial: false,
    tipoEspecial: null,

    estado: "conquistados",
    progresso: 100,

    imagemBadge: badgeTeste,
    icone: "fi-br-badge",

    grupo: "outrasAreas",
    temaVisual: "azul",
    dataCriacao: "2025-12-12",
  },

  {
    idBadge: 21,
    nomeBadge: "Cyber Awareness",
    pontosBadge: 130,

    idArea: 4,
    nomeArea: "Cybersecurity",
    serviceLine: "Cybersecurity",
    learningPath: "Jornada de Segurança",

    idNivel: 1,
    nivel: "Inicial",
    validade: "1 ano",

    especial: false,
    tipoEspecial: null,

    estado: "expirados",
    progresso: 100,

    imagemBadge: badgeLowCode4,
    icone: "fi-br-badge",

    grupo: "outrasAreas",
    temaVisual: "vermelho",
    dataCriacao: "2025-09-01",
  },

  {
    idBadge: 22,
    nomeBadge: "Agile Foundations",
    pontosBadge: 120,

    idArea: 5,
    nomeArea: "Project Management",
    serviceLine: "Delivery",
    learningPath: "Jornada de Gestão",

    idNivel: 1,
    nivel: "Inicial",
    validade: "1 ano",

    especial: false,
    tipoEspecial: null,

    estado: "emProgresso",
    progresso: 35,

    imagemBadge: badgeLowCode2,
    icone: "fi-br-badge",

    grupo: "outrasAreas",
    temaVisual: "laranja",
    dataCriacao: "2026-02-18",
  },

  {
    idBadge: 23,
    nomeBadge: "UX Research",
    pontosBadge: 160,

    idArea: 6,
    nomeArea: "Design",
    serviceLine: "Design",
    learningPath: "Jornada Criativa",

    idNivel: 2,
    nivel: "Intermédio",
    validade: "1 ano",

    especial: false,
    tipoEspecial: null,

    estado: "bloqueados",
    progresso: 0,

    imagemBadge: badgeLowCode5,
    icone: "fi-br-badge",

    grupo: "outrasAreas",
    temaVisual: "rosa",
    dataCriacao: "2026-03-30",
  },
];

export default badgesConsultorMock;