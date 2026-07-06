import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./home_Admin.css";
import api from "../../services/api.js";

import { BotaoVerMais, GraficoCandidaturas } from "../../components/components.jsx";
import AtividadeRecente from "../../components/AtividadeModal.jsx";
import { mapearAtividadeParaModal } from "../../utils/atividadeUtils.js";
import ClassificacaoModal from "../../components/ClassificacaoModal.jsx";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function AcaoRapida({ cor, icone, texto, onClick }) {
  return (
    <div
      className="acao-rapida-btn d-flex flex-column align-items-center justify-content-center text-center shadow-sm"
      onClick={onClick}
      style={{
        background: `linear-gradient(135deg, ${cor}dd, ${cor})`, // Gradiente muito subtil para profundidade
        borderRadius: "var(--border-radius-grande)",
        flex: "1 1 0",
        aspectRatio: "1 / 1",
        maxHeight: "110px",
        maxWidth: "110px",
        minWidth: "80px",
        cursor: "pointer",
        color: "#ffffff",
        padding: "10px",
        transition: "all 0.3s ease",
        border: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = `0 10px 20px ${cor}66`; // Sombra brilhante da cor do botão
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)"; // Sombra normal
      }}
    >
      <div className="d-flex align-items-center justify-content-center mb-2">
        <i
          className={`fi ${icone}`}
          style={{ fontSize: "1.7rem" }}
        ></i>
      </div>
      <span
        style={{
          fontSize: "clamp(0.6rem, 0.9vw, 0.8rem)",
          fontWeight: "600",
          lineHeight: "1.2",
          textShadow: "0 1px 2px rgba(0,0,0,0.2)" // Melhor legibilidade do texto branco
        }}
      >
        {texto}
      </span>
    </div>
  );
}

// --- 2. PÁGINA PRINCIPAL ---
const HomeAdmin = ({ saudacao = "Boa Noite, Gonçalo!", onCriarAviso }) => {
  const idGuardado = localStorage.getItem("utilizador_id");
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [dados_grafico_candidaturas, setDados_grafico_candidaturas] = useState([
    { nome: 'aceites', quantidade: null, cor: '#3bb413' },
    { nome: 'rejeitadas', quantidade: null, cor: '#de2121' }
  ]);
  const [stats, setStats] = useState({
    totalUtilizadores: 0,
    badgesPorUtilizador: 0,
    badgesAtribuidos: 0
  });
  const [classificacao, setClassificacao] = useState([]);
  const [dadosAtividade, setDadosAtividade] = useState([]);
  const [carregandoAtividade, setCarregandoAtividade] = useState(true);

  useEffect(() => {
    const carregarStats = async () => {
      try {
        const res = await api.get("/homeadmin/stats");
        if (res.data) {
          setStats(res.data);
        }
      } catch (error) {
        console.error("Erro ao carregar estatísticas do admin:", error);
      }
    };

    const carregarRanking = async () => {
      if (!localStorage.getItem('token_softinsa')) {
        setClassificacao([]);
        return;
      }

      try {
        const res = await api.get("/homeadmin/ranking");
        setClassificacao(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Erro ao carregar ranking do admin:", error);
        setClassificacao([]);
      }
    };
    const getGrafCandidaturas = async () => {
      if (!localStorage.getItem('token_softinsa')) {
        setDados_grafico_candidaturas(prev => prev.map(item => ({ ...item, quantidade: 0 })));
        return;
      }

      try {
        const res = await api.get(`/commun/candidaturasweek/${idGuardado}`);

        setDados_grafico_candidaturas(prevDados =>
          prevDados.map(item => {
            if (item.nome === 'aceites') {
              return { ...item, quantidade: res.data.aceites };
            }
            if (item.nome === 'rejeitadas') {
              return { ...item, quantidade: res.data.rejeitadas };
            }
            return item;
          })
        );

      } catch (erro) {
        console.error('Erro ao buscar dados do gráfico:', erro);
        setDados_grafico_candidaturas(prev => prev.map(item => ({ ...item, quantidade: null })));
      }
    };

    const carregarAtividade = async () => {
      if (!localStorage.getItem('token_softinsa')) {
        setDadosAtividade([]);
        setCarregandoAtividade(false);
        return;
      }

      try {
        setCarregandoAtividade(true);
        const res = await api.get('/atividade/get', {
          params: { perfil: 'Administrador', limit: 6 }
        });
        const atividades = res.data.data || [];
        setDadosAtividade(atividades.map(mapearAtividadeParaModal).filter(Boolean));
      } catch (erro) {
        console.error('Erro ao buscar atividade recente do administrador:', erro);
        setDadosAtividade([]);
      } finally {
        setCarregandoAtividade(false);
      }
    };

    getGrafCandidaturas();
    carregarStats();
    carregarRanking();
    carregarAtividade();
  }, []);

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
          style={{ fontSize: "clamp(0.8rem, 1.2vw, 1rem)", marginBottom: 'var(--gap-default-seccoes)' }}
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
            onClick={() => { }}
          />

          <AcaoRapida
            cor="#ffb703"
            icone="fi-br-badge"
            texto={t("add_badge")}
            onClick={() => navigate('/galeria', { state: { openCreateModal: true } })}
          />

          <AcaoRapida
            cor="#e63946"
            icone="fi-br-megaphone"
            texto={t("criar_aviso")}
            onClick={onCriarAviso}
          />

          <AcaoRapida
            cor="#2dc653"
            icone="fi-br-diagram-project"
            texto={t("editar_service_lines")}
            onClick={() => navigate('/editar', { state: { abaAtiva: 'service_line' } })}
          />

          <AcaoRapida
            cor="#f48c06"
            icone="fi-br-road"
            texto={t("editar_learning_paths")}
            onClick={() => navigate('/editar', { state: { abaAtiva: 'learning_paths' } })}
          />

          <AcaoRapida
            cor="#3a5a92"
            icone="fi-br-target"
            texto={t("editar_areas")}
            onClick={() => navigate('/editar', { state: { abaAtiva: 'areas' } })}
          />
        </div>
      </div>

      {/* Estatísticas */}
      <div className="row" style={{ flex: "0 0 auto", marginTop: 'var(--gap-default-seccoes)' }}>
        <div className="col-4">
          <div
            className="admin-card py-2 px-3 bg-white d-flex flex-column justify-content-between h-100"
            style={{ minHeight: "90px" }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <span
                className="text-muted"
                style={{ fontSize: "clamp(0.75rem, 0.9vw, 0.85rem)" }}
              >
                {t("total_utilizadores")}
              </span>
              <i
                className="fi fi-br-user text-dark"
                style={{ fontSize: "clamp(1rem, 1.2vw, 1.25rem)" }}
              ></i>
            </div>
            <h3
              className="fw-bold m-0"
              style={{ fontSize: "clamp(1.2rem, 2vw, 1.6rem)" }}
            >
              {stats.totalUtilizadores.toLocaleString("pt-PT")}
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
            className="admin-card py-2 px-3 bg-white d-flex flex-column justify-content-between h-100"
            style={{ minHeight: "90px" }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <span
                className="text-muted"
                style={{ fontSize: "clamp(0.75rem, 0.9vw, 0.85rem)" }}
              >
                {t("badges_por_utilizador")}
              </span>
            </div>
            <h3
              className="fw-bold m-0"
              style={{ fontSize: "clamp(1.2rem, 2vw, 1.6rem)" }}
            >
              {stats.badgesPorUtilizador.toLocaleString("pt-PT")}
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
            className="admin-card py-2 px-3 bg-white d-flex flex-column justify-content-between h-100"
            style={{ minHeight: "90px" }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <span
                className="text-muted"
                style={{ fontSize: "clamp(0.75rem, 0.9vw, 0.85rem)" }}
              >
                {t("badges_atribuidos")}
              </span>
              <i
                className="fi fi-br-settings text-dark"
                style={{ fontSize: "clamp(1rem, 1.2vw, 1.25rem)" }}
              ></i>
            </div>
            <h3
              className="fw-bold m-0"
              style={{ fontSize: "clamp(1.2rem, 2vw, 1.6rem)" }}
            >
              {stats.badgesAtribuidos.toLocaleString("pt-PT")}
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
            <AtividadeRecente atividades={dadosAtividade} fullHeight={true} isLoading={carregandoAtividade} />
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
            <ClassificacaoModal classificacao={classificacao} fullHeight={true} />
          </div>
        </div>

        <div
          className="col-4 h-100 d-flex flex-column"
          style={{ minHeight: 0 }}
        >
          <GraficoCandidaturas dados_grafico_candidaturas={dados_grafico_candidaturas} />
        </div>
      </div>
    </div>
  );
};

export default HomeAdmin;
