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
    expirado: true,
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
      className="rounded-4 d-flex flex-column align-items-center justify-content-center text-center p-2 shadow-sm"
      style={{
        backgroundColor: cor,
        width: "110px",
        height: "110px",
        cursor: "pointer",
        color: "white",
      }}
    >
      <i className={`fi ${icone} mb-2`} style={{ fontSize: "1.8rem" }}></i>
      <span
        style={{ fontSize: "0.75rem", fontWeight: "500", lineHeight: "1.2" }}
      >
        {texto}
      </span>
    </div>
  );
}

// --- 3. A PÁGINA PRINCIPAL ---
const HomeAdmin = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 d-flex flex-column gap-3">
      {/* --- Linha 1: Ações Rápidas --- */}
      <div>
        <h6 className="text-muted mb-3 ms-2">Ações Rápidas</h6>
        <div className="d-flex flex-wrap justify-content-center gap-4 w-100 px-2">
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
            icone="fi-br-crosshair"
            texto="Editar Áreas"
          ></AcaoRapida>
        </div>
      </div>

      {/* --- Linha 2: Estatísticas --- */}
      <div className="row mt-2">
        <div className="col-4">
          <div className="border border-2 rounded-4 p-3 bg-white d-flex flex-column justify-content-between h-100">
            <div className="d-flex justify-content-between align-items-start">
              <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                Total de Utilizadores
              </span>
              <i className="fi fi-br-user text-dark fs-5"></i>
            </div>
            <h3 className="fw-bold mt-3 mb-3">345</h3>
            <div className="text-end">
              <BotaoVerMais
                onClick={() => navigate("/utilizadores")}
                tamanho={0.7}
              />
            </div>
          </div>
        </div>
        <div className="col-4">
          <div className="border border-2 rounded-4 p-3 bg-white d-flex flex-column justify-content-between h-100">
            <div className="d-flex justify-content-between align-items-start">
              <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                Badges por Utilizador
              </span>
            </div>
            <h3 className="fw-bold mt-3 mb-3">4.8</h3>
            <div className="text-end">
              <BotaoVerMais
                onClick={() => navigate("/estatisticas")}
                tamanho={0.7}
              />
            </div>
          </div>
        </div>
        <div className="col-4">
          <div className="border border-2 rounded-4 p-3 bg-white d-flex flex-column justify-content-between h-100">
            <div className="d-flex justify-content-between align-items-start">
              <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                Badges Atribuídos
              </span>
              <i className="fi fi-br-settings text-dark fs-5"></i>
            </div>
            <h3 className="fw-bold mt-3 mb-3">3.456</h3>
            <div className="text-end">
              <BotaoVerMais
                onClick={() => navigate("/estatisticas")}
                tamanho={0.7}
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- Linha 3: Widgets Inferiores --- */}
      <div className="row flex-grow-1 mt-2" style={{ minHeight: "350px" }}>
        {/* Contentor 1: Atividade*/}
        <div className="col-4 h-100">
          <AtividadeModal atividades={dados_atividade} />
        </div>

        {/* Contentor 2: Classificação*/}
        <div className="col-4 h-100">
          <ClassificacaoModal classificacao={lista_classificacao} />
        </div>

        {/* Contentor 3: Gráfico Esta Semana */}
        <div className="col-4 h-100">
          <div className="border border-2 rounded-4 p-3 h-100 bg-white d-flex flex-column">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="m-0 fw-bold">Esta semana</h5>
              <span className="fw-bold fs-5">10</span>
            </div>

            <div className="flex-grow-1" style={{ minHeight: "200px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dados_esta_semana}
                    cx="50%"
                    cy="50%"
                    innerRadius="40%"
                    outerRadius={100}
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
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeAdmin;
