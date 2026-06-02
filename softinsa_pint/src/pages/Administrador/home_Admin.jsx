import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./home_Admin.css";

import { BotaoVerMais, GraficoCandidaturas } from "../../components/components.jsx";
import AtividadeModal from "../../components/AtividadeModal.jsx";
import ClassificacaoModal from "../../components/ClassificacaoModal.jsx";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// --- DADOS FALSOS ---
const dados_grafico_candidaturas = [
    { nome: 'aceites', quantidade: 405, cor: '#3bb413' },    
    { nome: 'rejeitadas', quantidade: 15, cor: '#de2121' }, 
    { nome: 'em_analise', quantidade: 25, cor: '#1c8cae' }  
];

const dados_atividade = [
  {
    icone: "fi-br-check",
    cor: "text-success",
    texto: "aceitou o badge Low Code",
    textoNegrito: "João Silva",
    tempo: "Há 2 horas",
    expirado: false,
  },
  {
    icone: "fi-br-document",
    cor: "text-primary",
    texto: "Nova candidatura de João Silva",
    tempo: "Há 2 horas",
    expirado: false,
  },
  {
    icone: "fi-br-cross",
    cor: "text-danger",
    texto: "foi rejeitado em Low Code",
    textoNegrito: "João Silva",
    tempo: "Há 5 horas",
    expirado: false,
  },
  {
    icone: "fi-br-check",
    cor: "text-success",
    texto: "aceitou o badge Cloud",
    textoNegrito: "Maria Ana",
    tempo: "Há 1 dia",
    expirado: false,
  },
  {
    icone: "fi-br-badge",
    cor: "text-warning",
    texto: "atualizou os requisitos",
    textoNegrito: "Administrador2",
    tempo: "Há 1 dia",
    expirado: false,
  },
  {
    icone: "fi-br-badge",
    cor: "text-warning",
    texto: "atualizou os requisitos",
    textoNegrito: "Administrador2",
    tempo: "Há 1 dia",
    expirado: false,
  },
];

const lista_classificacao = [
  {
    pos: 1,
    nome: "João Silva",
    area: "Hybrid Systems",
    pontos: "374 957",
    cor: "#FFD700",
    classe: "ouro",
  },
  {
    pos: 2,
    nome: "Maria Ana",
    area: "Mobile Solutions",
    pontos: "310 500",
    cor: "#C0C0C0",
    classe: "prata",
  },
  {
    pos: 3,
    nome: "Rui Sousa",
    area: "Enterprise Apps",
    pontos: "295 000",
    cor: "#CD7F32",
    classe: "bronze",
  },
  { pos: 4, nome: "Afonso Moreira", area: "Hybrid System", pontos: "37 455" },
  { pos: 5, nome: "Ana Beatriz", area: "Cloud", pontos: "35 200" },
];

function AcaoRapida({ cor, icone, texto }) {
  return (
    <div
      className="acao-rapida-btn rounded-4 d-flex flex-column align-items-center justify-content-center text-center shadow-sm"
      style={{
        backgroundColor: cor,
        flex: "1 1 0",
        aspectRatio: "1 / 1",
        maxHeight: "100px",
        maxWidth: "100px",
        minWidth: "70px",
        cursor: "pointer",
        color: "white",
        padding: "2%",
      }}
    >
      <i
        className={`fi ${icone} mb-1`}
        style={{ fontSize: "clamp(1.2rem, 2vw, 2rem)" }}
      ></i>
      <span
        style={{
          fontSize: "clamp(0.55rem, 1vw, 0.8rem)",
          fontWeight: "500",
          lineHeight: "1.2",
        }}
      >
        {texto}
      </span>
    </div>
  );
}

// --- 2. PÁGINA PRINCIPAL ---
const HomeAdmin = ({ saudacao = "Boa Noite, Gonçalo!" }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const dados_esta_semana = [
    { nome: t("aceites"), quantidade: 60, cor: "#4ade80" },
    { nome: t("pendentes"), quantidade: 25, cor: "#60a5fa" },
    { nome: t("rejeitadas"), quantidade: 15, cor: "#f87171" },
  ];

  return (
    <div
      className="home-admin-container d-flex flex-column"
    >
      {/* Saudação */}
      <div className="flex-shrink-0 ms-2">
        <h1 className="texto-titulo-principal m-0">
          {saudacao}
        </h1>
      </div>

      {/* Ações Rápidas */}
      <div className="flex-shrink-0" style={{ marginTop: 'var(--gap-titulo-principal-conteudo)' }}>
        <h6
          className="text-muted ms-2"
          style={{ fontSize: "clamp(0.8rem, 1.2vw, 1rem)", marginBottom: '16px' }}
        >
          {t("acoes_rapidas")}
        </h6>
        <div
          className="d-flex w-100 px-2 justify-content-center"
          style={{ gap: "6%" }}
        >
          <AcaoRapida
            cor="#00b4d8"
            icone="fi-br-user-add"
            texto={t("add_utilizador")}
          />

          <AcaoRapida
            cor="#ffb703"
            icone="fi-br-badge"
            texto={t("add_badge")}
          />

          <AcaoRapida
            cor="#3a5a92"
            icone="fi-br-users"
            texto={t("consultar_equipa")}
          />

          <AcaoRapida
            cor="#2dc653"
            icone="fi-br-apps"
            texto={t("editar_service_lines")}
          />

          <AcaoRapida
            cor="#f48c06"
            icone="fi-br-road"
            texto={t("editar_learning_paths")}
          />

          <AcaoRapida
            cor="#dc2f02"
            icone="fi-br-target"
            texto={t("editar_areas")}
          ></AcaoRapida>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="row" style={{ flex: "0 0 auto", marginTop: 'var(--gap-default-seccoes)' }}>
        <div className="col-4">
          <div
            className="admin-card p-3 bg-white d-flex flex-column justify-content-between h-100"
            style={{ minHeight: "110px" }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <span
                className="text-muted"
                style={{ fontSize: "clamp(0.75rem, 1vw, 1rem)" }}
              >
                {t("total_utilizadores")}
              </span>
              <i
                className="fi fi-br-user text-dark"
                style={{ fontSize: "clamp(1rem, 1.5vw, 1.5rem)" }}
              ></i>
            </div>
            <h3
              className="fw-bold m-0"
              style={{ fontSize: "clamp(1.2rem, 2.5vw, 2rem)" }}
            >
              345
            </h3>
            <div className="text-end">
              <BotaoVerMais
                onClick={() => navigate("/utilizadores")}
                tamanho={0.6}
              />
            </div>
          </div>
        </div>
        <div className="col-4">
          <div
            className="admin-card p-3 bg-white d-flex flex-column justify-content-between h-100"
            style={{ minHeight: "110px" }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <span
                className="text-muted"
                style={{ fontSize: "clamp(0.75rem, 1vw, 1rem)" }}
              >
                {t("badges_por_utilizador")}
              </span>
            </div>
            <h3
              className="fw-bold m-0"
              style={{ fontSize: "clamp(1.2rem, 2.5vw, 2rem)" }}
            >
              4.8
            </h3>
            <div className="text-end">
              <BotaoVerMais
                onClick={() => navigate("/estatisticas")}
                tamanho={0.6}
              />
            </div>
          </div>
        </div>
        <div className="col-4">
          <div
            className="admin-card p-3 bg-white d-flex flex-column justify-content-between h-100"
            style={{ minHeight: "110px" }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <span
                className="text-muted"
                style={{ fontSize: "clamp(0.75rem, 1vw, 1rem)" }}
              >
                {t("badges_atribuidos")}
              </span>
              <i
                className="fi fi-br-settings text-dark"
                style={{ fontSize: "clamp(1rem, 1.5vw, 1.5rem)" }}
              ></i>
            </div>
            <h3
              className="fw-bold m-0"
              style={{ fontSize: "clamp(1.2rem, 2.5vw, 2rem)" }}
            >
              3.456
            </h3>
            <div className="text-end">
              <BotaoVerMais
                onClick={() => navigate("/estatisticas")}
                tamanho={0.6}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Widgets Inferiores */}
      <div className="row flex-grow-1" style={{ marginTop: 'var(--gap-default-seccoes)' }}>
        <div
          className="col-4 h-100 d-flex flex-column"
          style={{ minHeight: 0 }}
        >
          <div
            className="flex-grow-1"
            style={{ overflow: "hidden", minHeight: 0 }}
          >
            <AtividadeModal atividades={dados_atividade} fullHeight={true} />
          </div>
        </div>

        <div
          className="col-4 h-100 d-flex flex-column"
          style={{ minHeight: 0 }}
        >
          <div
            className="flex-grow-1"
            style={{ overflow: "hidden", minHeight: 0 }}
          >
            <ClassificacaoModal classificacao={lista_classificacao} fullHeight={true} />
          </div>
        </div>

        <div
          className="col-4 h-100 d-flex flex-column"
          style={{ minHeight: 0 }}
        >
          <GraficoCandidaturas dados_grafico_candidaturas={dados_grafico_candidaturas}/>
        </div>
      </div>
    </div>
  );
};

export default HomeAdmin;
