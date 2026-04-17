import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BotaoVerMais,
  WidgetAtividade,
  WidgetClassificacao,
} from "../../components/components.jsx";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

import "./home_Admin.css";
import ClassificacaoModal from "../../components/ClassificacaoModal.jsx";
import AtividadeModal from "../../components/AtividadeModal.jsx";

const classificacao = [
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
    nome: "João Silva",
    area: "Hybrid Systems",
    pontos: "374 957",
    cor: "#C0C0C0",
    classe: "prata",
  },
  {
    pos: 3,
    nome: "João Silva",
    area: "Hybrid Systems",
    pontos: "374 957",
    cor: "#CD7F32",
    classe: "bronze",
  },
  { pos: 4, nome: "Afonso Moreira", area: "Hybrid System", pontos: "37 455" },
  { pos: 5, nome: "Afonso Moreira", area: "Hybrid System", pontos: "37 455" },
  { pos: 6, nome: "Afonso Moreira", area: "Hybrid System", pontos: "37 455" },
  { pos: 7, nome: "Afonso Moreira", area: "Hybrid System", pontos: "37 455" },
  { pos: 8, nome: "Afonso Moreira", area: "Hybrid System", pontos: "37 455" },
  { pos: 9, nome: "Afonso Moreira", area: "Hybrid System", pontos: "37 455" },
];

const dados_esta_semana = [
  { nome: "Aceites", quantidade: 60, cor: "#4ade80" },
  { nome: "Pendentes", quantidade: 25, cor: "#60a5fa" },
  { nome: "Rejeitadas", quantidade: 15, cor: "#f87171" },
];

const dados_atividade = [
  {
    icone: "fi-br-check",
    cor: "text-success",
    textoNegrito: "João Silva",
    texto: "aceitou o badge Low Code",
    tempo: "Há 2 horas",
  },
  {
    icone: "fi-br-document",
    cor: "text-primary",
    texto: "Nova candidatura de João Silva",
    tempo: "Há 2 horas",
  },
  {
    icone: "fi-br-cross",
    cor: "text-danger",
    textoNegrito: "João Silva",
    texto: "foi rejeitado em Low Code",
    tempo: "Há 5 horas",
  },
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

function Estatisticas({ titulo, valor, icone }) {
  return (
    <div className="cartao-estatistica border border-2 rounded-4 p-3 h-100 bg-white position-relative d-flex flex-column">
      <div className="d-flex justify-content-between align-items-start">
        <span className="text-muted titulo-estatistica">{titulo}</span>
        <i className={`fi ${icone} fs-4 text-dark`}></i>
      </div>

      <div className="mt-3 mb-4">
        <span className="fw-bold fs-3">{valor}</span>
      </div>

      <div className="position-absolute bottom-0 end-0 p-2">
        <BotaoVerMais
          onClick={() => console.log(`Ver mais de: ${titulo}`)}
          tamanho={0.7}
        />
      </div>
    </div>
  );
}

const HomeAdmin = (user, saudacao) => {
  const { t } = useTranslation();
  const [modalAtividadeAberto, setModalAtividadeAberto] = useState(false);
  const [modalClassificacaoAberto, setModalClassificacaoAberto] =
    useState(false);
  return (
    <div
      className="m-4 d-flex flex-column"
      style={{
        height: "calc(100vh - 100px)",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {/* SAUDAÇÃO */}
      <div className="mb-4">
        <h2 className="fw-bold m-0 text-dark">{saudacao}</h2>
      </div>

      {/* AÇÕES RÁPIDAS */}
      <div className="mb-4">
        <span
          className="ms-1 mb-2 d-block fw-semibold"
          style={{ fontSize: "0.9rem", color: "#666" }}
        >
          Ações Rápidas
        </span>
        <div
          className="d-flex flex-wrap justify-content-center"
          style={{ gap: "4rem" }}
        >
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
          />
        </div>
      </div>

      {/* KPIs (Estatísticas) */}
      <div className="row mb-4 g-3">
        <div className="col-4">
          <Estatisticas
            titulo="Total de Utilizadores"
            valor="345"
            icone="fi-br-user"
          />
        </div>
        <div className="col-4">
          <Estatisticas
            titulo="Badges por Utilizador"
            valor="4.8"
            icone="fi-br-user-badge"
          />
        </div>
        <div className="col-4">
          <Estatisticas
            titulo="Badges Atribuídos"
            valor="3.456"
            icone="fi-br-award"
          />
        </div>
      </div>

      {/* WIDGETS INFERIORES */}
      <div className="row g-3 flex-grow-1">
        <div className="col-4">
          <WidgetAtividade
            atividades={dados_atividade}
            onExpandir={() => setModalAtividadeAberto(true)}
            t={t}
          />
        </div>

        {/* Contentor 2: Classificação */}
        <div className="col-4">
          <WidgetClassificacao
            classificacao={classificacao}
            onExpandir={() => setModalClassificacaoAberto(true)}
            t={t}
          />
        </div>

        {/* Contentor 3: Gráfico Esta Semana */}
        <div className="col-4">
          <div className="border border-2 rounded-4 p-3 h-100 bg-white d-flex flex-column">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="m-0">Esta semana</h5>
              <span className="fw-bold">10</span>
            </div>
            <div className="flex-grow-1" style={{ minHeight: "150px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dados_esta_semana}
                    innerRadius="0%"
                    outerRadius="80%"
                    nameKey="none"
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
      {modalAtividadeAberto && (
        <AtividadeModal
          atividades={dados_atividade}
          onClose={() => setModalAtividadeAberto(false)}
        />
      )}
      {modalClassificacaoAberto && (
        <ClassificacaoModal
          classificacao={dados_classificacao}
          onClose={() => setModalClassificacaoAberto(false)}
        />
      )}
    </div>
  );
};

export default HomeAdmin;
