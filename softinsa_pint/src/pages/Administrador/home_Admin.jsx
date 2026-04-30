import React from "react";
import { useNavigate } from "react-router-dom";

import { BotaoVerMais } from "../../components/components.jsx";
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
const dados_esta_semana = [
  { nome: "Aceites", quantidade: 60, cor: "#4ade80" },
  { nome: "Pendentes", quantidade: 25, cor: "#60a5fa" },
  { nome: "Rejeitadas", quantidade: 15, cor: "#f87171" },
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
      className="rounded-4 d-flex flex-column align-items-center justify-content-center text-center shadow-sm"
      style={{
        backgroundColor: cor,
        flex: "1 1 0",
        aspectRatio: "1 / 1",
        maxWidth: "140px",
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

  return (
    <div
      className="p-3 d-flex flex-column gap-2"
      style={{ height: "calc(100vh - 80px)", overflow: "hidden" }}
    >
      {/* Saudação */}
      <div className="flex-shrink-0 ms-2">
        <h2
          className="fw-bold m-0"
          style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}
        >
          {saudacao}
        </h2>
      </div>

      {/* Ações Rápidas */}
      <div className="flex-shrink-0 mt-2">
        <h6
          className="text-muted mb-2 ms-2"
          style={{ fontSize: "clamp(0.8rem, 1.2vw, 1rem)" }}
        >
          Ações Rápidas
        </h6>
        <div className="d-flex w-100 px-2" style={{ gap: "5%" }}>
          <AcaoRapida
            cor="#00b4d8"
            icone="fi-br-user-add"
            texto="Adicionar Utilizador"
          />

          <AcaoRapida
            cor="#ffb703"
            icone="fi-br-badge"
            texto="Adicionar Badge"
          />

          <AcaoRapida
            cor="#3a5a92"
            icone="fi-br-users"
            texto="Consultar Equipa"
          />

          <AcaoRapida
            cor="#2dc653"
            icone="fi-br-apps"
            texto="Editar Service Lines"
          />

          <AcaoRapida
            cor="#f48c06"
            icone="fi-br-road"
            texto="Editar Learning Paths"
          />

          <AcaoRapida
            cor="#dc2f02"
            icone="fi-br-target"
            texto="Editar Áreas"
          ></AcaoRapida>
        </div>
      </div>

      {/* Estatísticas */}
      {/* A altura é 20% do espaço restante */}
      <div className="row mt-1" style={{ height: "20%", minHeight: "100px" }}>
        <div className="col-4 h-100">
          <div className="border border-2 rounded-4 p-3 bg-white d-flex flex-column justify-content-between h-100">
            <div className="d-flex justify-content-between align-items-start">
              <span
                className="text-muted"
                style={{ fontSize: "clamp(0.75rem, 1vw, 1rem)" }}
              >
                Total de Utilizadores
              </span>
              <i
                className="fi fi-br-user text-dark"
                style={{ fontSize: "clamp(1rem, 1.5vw, 1.5rem)" }}
              ></i>
            </div>
            <h3
              className="fw-bold m-0"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}
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
        <div className="col-4 h-100">
          <div className="border border-2 rounded-4 p-3 bg-white d-flex flex-column justify-content-between h-100">
            <div className="d-flex justify-content-between align-items-start">
              <span
                className="text-muted"
                style={{ fontSize: "clamp(0.75rem, 1vw, 1rem)" }}
              >
                Badges por Utilizador
              </span>
            </div>
            <h3
              className="fw-bold m-0"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}
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
        <div className="col-4 h-100">
          <div className="border border-2 rounded-4 p-3 bg-white d-flex flex-column justify-content-between h-100">
            <div className="d-flex justify-content-between align-items-start">
              <span
                className="text-muted"
                style={{ fontSize: "clamp(0.75rem, 1vw, 1rem)" }}
              >
                Badges Atribuídos
              </span>
              <i
                className="fi fi-br-settings text-dark"
                style={{ fontSize: "clamp(1rem, 1.5vw, 1.5rem)" }}
              ></i>
            </div>
            <h3
              className="fw-bold m-0"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}
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
      <div className="row mt-1 flex-grow-1" style={{ minHeight: 0 }}>
        <div className="col-4 h-100 d-flex flex-column">
          <div className="flex-grow-1" style={{ overflow: "hidden" }}>
            <AtividadeModal atividades={dados_atividade} />
          </div>
        </div>

        <div className="col-4 h-100 d-flex flex-column">
          <div className="flex-grow-1" style={{ overflow: "hidden" }}>
            <ClassificacaoModal classificacao={lista_classificacao} />
          </div>
        </div>

        <div className="col-4 h-100 d-flex flex-column">
          <div
            className="caixa-branca p-4 d-flex flex-column flex-grow-1"
            style={{ overflow: "hidden" }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <h5
                className="m-0 fw-bold"
                style={{ fontSize: "clamp(1rem, 1.5vw, 1.25rem)" }}
              >
                Esta semana
              </h5>
              <span
                className="fw-bold"
                style={{ fontSize: "clamp(1rem, 1.5vw, 1.25rem)" }}
              >
                10
              </span>
            </div>

            <div className="flex-grow-1 position-relative w-100">
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dados_esta_semana}
                      cx="50%"
                      cy="50%"
                      innerRadius="50%"
                      outerRadius="75%"
                      nameKey="nome"
                      dataKey="quantidade"
                      stroke="none"
                    >
                      {dados_esta_semana.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeAdmin;
