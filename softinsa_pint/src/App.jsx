import React, { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import api from "./services/api.js";
import { menu_lateral } from "./defs/barra_lateral.jsx";
import { iconesNotificacao } from "./defs/dicionario.jsx";
import useToast from "./hooks/useToast.js";
import PageLoader from "./components/ui/Loading/PageLoader.jsx";
import "./i18n";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import "./components/ui/AvisosPopUp.css";

// Paginas
import HomeConsultor from "./pages/consultor/home_consultor.jsx";
import EstatisticasConsultor from "./pages/consultor/estatisticas_consultor.jsx";
import ObjetivosConsultor from "./pages/consultor/objetivos_consultor.jsx";
import HomeTalent from "./pages/talent/home_talent.jsx";
import EstatisticasTalent from "./pages/talent/estatisticas_talent.jsx";
import HomeService from "./pages/service/home_service.jsx";
import EstatisticasService from "./pages/service/estatisticas_service.jsx";
import HomeAdmin from "./pages/Administrador/home_Admin.jsx";
import EstatisticasAdmin from "./pages/Administrador/estatisticas_Admin.jsx";
import DefinicoesAdmin from "./pages/Administrador/definicoes_Admin.jsx";
import EditarAdmin from "./pages/Administrador/editar_Admin.jsx";
import Galeria from "./pages/talent/Galeria.jsx";
import GaleriaConsultor from "./pages/consultor/GaleriaConsultor.jsx";
import Galeria_Talent_ServiceLine from "./pages/talent_service_line/Galeria_Talent_ServiceLine.jsx";
import PerfilPessoal from "./pages/talent/Perfil.jsx";
import Atividade from "./pages/atividade/Atividade.jsx";
import Candidaturas from "./pages/candidaturas/Candidaturas.jsx";
import ModalConfirmacao from "./components/ui/ModalConfirmacao/ModalConfirmacao";
import LoginPage from "./pages/auth/LoginPage.jsx";
import EsqueciPasswordPage from "./pages/auth/EsqueciPasswordPage.jsx";
import PrimeiroAcessoPage from "./pages/auth/PrimeiroAcessoPage.jsx";
import Utilizadores from "./pages/utilizadores/Utilizadores.jsx";
import CriarUtilizador from "./pages/utilizadores/CriarUtilizador.jsx";
import LanguageSelector from "./components/ui/LanguageSelector/LanguageSelector.jsx";
import BadgePublico from "./pages/public/BadgePublico.jsx";
import PerfilPublico from "./pages/public/PerfilPublico.jsx";
import PoliticasRGPD from "./pages/rgpd/PoliticasRGPD.jsx";

// Imagens
import softinsa_logo from "./assets/logotipo_softinsa.png";
import user_logo from "./assets/utilizador.png";

function App() {
  const { t } = useTranslation();
  const { mostrarToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isRotaPublicaBadge = location.pathname.startsWith("/badges/");
  const isRotaPublicaPerfil = location.pathname.startsWith("/perfil/publico/");
  const isRotaPublicaAuth = location.pathname === "/login" || location.pathname === "/esqueci-password" || location.pathname === "/primeiro-acesso";
  const isRotaPerfil = location.pathname.startsWith("/perfil");

  // === ESTADOS GLOBAIS DA APP ===
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({
    id: null,
    nome: null,
    cargo: null,
    foto: null,
    ultimoLogin: null,
  });

  const Saudacao = () => {
    if (!user.ultimoLogin) {
      return t("saudacao_1");
    } else {
      const data_atual = new Date();
      const hora_atual = data_atual.getHours();

      const diferencaEmMilissegundos = Math.abs(data_atual - user.ultimoLogin);
      const milissegundosNumDia = 1000 * 60 * 60 * 24;

      const diasPassados = diferencaEmMilissegundos / milissegundosNumDia;

      if (diasPassados >= 15) {
        return t("saudacao_15");
      } else if (hora_atual < 6 || hora_atual > 19) {
        return t("saudacao_noite");
      } else if (hora_atual < 12) {
        return t("saudacao_dia");
      } else {
        return t("saudacao_tarde");
      }
    }
  };

  const atualizar_lastLogin = async () => {
    const idGuardado = localStorage.getItem("utilizador_id");
    const resposta = await api.put('/putlastlogin', { id: idGuardado });
  }
  // Redirecionar para /login se não autenticado (após terminar o carregamento)
  useEffect(() => {
    if (
      !loading &&
      !user.cargo &&
      !isRotaPublicaAuth &&
      !isRotaPublicaBadge &&
      !isRotaPublicaPerfil
    ) {
      navigate("/login", { replace: true });
    }
  }, [loading, user.cargo, location.pathname, isRotaPublicaAuth, isRotaPublicaBadge, isRotaPublicaPerfil, navigate]);

  // Atualizar último login quando a página carrega/muda (exceto na rota de perfil)
  useEffect(() => {
    if (user.id && user.cargo && !isRotaPublicaAuth && !isRotaPublicaBadge && !isRotaPerfil && !isRotaPublicaPerfil) {
      atualizar_lastLogin();
    }
  }, [location.pathname, user.id, user.cargo, isRotaPublicaAuth, isRotaPublicaBadge, isRotaPerfil, isRotaPublicaPerfil]);

  // === REFS E ESTADOS PARA MENUS, NOTIFICAÇÕES E AVISOS ===
  const bellRef = useRef(null);
  const notifPopupRef = useRef(null);

  const [menuNotificacoesAberto, setMenuNotificacoesAberto] = useState(false);
  const [abaNotificacoes, setAbaNotificacoes] = useState("notificacoes");
  const [isAvisoModalOpen, setIsAvisoModalOpen] = useState(false);
  const [avisoParaVisualizar, setAvisoParaVisualizar] = useState(null);
  const [avisoToDelete, setAvisoToDelete] = useState(null);
  const [avisoParaEditar, setAvisoParaEditar] = useState(null);
  const [abaAvisos, setAbaAvisos] = useState("recebidos");

  // === INICIALIZAÇÃO DO UTILIZADOR ===
  useEffect(() => {
    const buscarUserAPI = async () => {
      try {
        const idGuardado = localStorage.getItem("utilizador_id");
        const roleGuardada = localStorage.getItem("role_softinsa");

        if (!idGuardado || !roleGuardada) {
          setLoading(false);
          return;
        }

        const roleParseada = JSON.parse(roleGuardada);
        const cargoFinal = typeof roleParseada === "string"
          ? roleParseada
          : (roleParseada.nome ? roleParseada.nome : null);

        const res = await api.get("/getuser", { params: { id: idGuardado } });
        if (res.data) {
          setUser({
            id: idGuardado,
            nome: res.data.nome_user || res.data.nome,
            cargo: cargoFinal,
            foto: res.data.imagem_perfil || res.data.foto || null,
            ultimoLogin: res.data.ultimoLogin ? new Date(res.data.ultimoLogin) : null
          });
        }
      } catch (error) {
        console.error("Erro ao buscar dados do user no arranque:", error);
      } finally {
        setLoading(false);
      }
    };

    buscarUserAPI();
  }, []);

  // === CLICK OUTSIDE (Para fechar o menu de Notificações) ===
  useEffect(() => {
    const handleCliqFora = (e) => {
      if (menuNotificacoesAberto && bellRef.current && !bellRef.current.contains(e.target) && notifPopupRef.current && !notifPopupRef.current.contains(e.target)) {
        setMenuNotificacoesAberto(false);
      }
    };
    document.addEventListener("mousedown", handleCliqFora);
    return () => document.removeEventListener("mousedown", handleCliqFora);
  }, [menuNotificacoesAberto]);

  // === CARREGAR NOTIFICAÇÕES E AVISOS DA BD ===
  const [avisosRecebidos, setAvisosRecebidos] = useState([]);
  const [avisosEnviados, setAvisosEnviados] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);

  const formatarData = (dataStr) => {
    if (!dataStr) return "";
    const d = new Date(dataStr);
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const ano = d.getFullYear();
    const horas = String(d.getHours()).padStart(2, "0");
    const minutos = String(d.getMinutes()).padStart(2, "0");
    return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
  };

  const carregarNotificacoesEAvisos = async () => {
    try {
      if (user.id) {
        const loginTime = user.ultimoLogin ? new Date(user.ultimoLogin).getTime() : 0;

        // 1. Carregar Notificações
        const resNotif = await api.get("/notificacoes/getnotificacoes");
        const formatadas = resNotif.data.map(n => {
          let tipoFront = 'Sistema';
          if (n.tipo_notificacao === 'BADGE_EXPIRADO') tipoFront = 'Badge';
          else if (n.tipo_notificacao === 'Candidatura' || n.tipo_notificacao === 'NOVA_CANDIDATURA') tipoFront = 'Candidatura';
          else if (n.tipo_notificacao === 'Aceite') tipoFront = 'Aceite';
          else if (n.tipo_notificacao === 'Rejeitada') tipoFront = 'Rejeitada';
          else if (n.tipo_notificacao === 'AVALIACAO_STATUS') {
             if (n.descricao_notificacao && n.descricao_notificacao.toLowerCase().includes('recusado')) {
                tipoFront = 'Rejeitada';
             } else {
                tipoFront = 'Aceite';
             }
          }
          else if (iconesNotificacao[n.tipo_notificacao]) tipoFront = n.tipo_notificacao;

          const isLida = new Date(n.data_envio).getTime() <= loginTime;

          return {
            id: n.id_notificacao,
            id_notificacao: n.id_notificacao,
            texto: n.descricao_notificacao,
            tipo: tipoFront,
            data: formatarData(n.data_envio),
            remetente: "Sistema",
            lida: isLida
          };
        });
        setNotificacoes(formatadas);

        // 2. Carregar Avisos (Recebidos e Enviados)
        const resAvisos = await api.get("/notificacoes/getavisos");
        
        const recebidosFormatados = (resAvisos.data.recebidos || []).map(a => {
          const isLida = new Date(a.data).getTime() <= loginTime;
          return {
            ...a,
            data: formatarData(a.data),
            lida: isLida
          };
        });
        const enviadosFormatados = (resAvisos.data.enviados || []).map(a => ({
          ...a,
          data: formatarData(a.data),
          lida: true
        }));

        setAvisosRecebidos(recebidosFormatados);
        setAvisosEnviados(enviadosFormatados);
      }
    } catch (error) {
      console.error("Erro ao carregar notificações e avisos:", error);
    }
  };

  useEffect(() => {
    if (user.id && !isRotaPublicaAuth && !isRotaPublicaBadge) {
      carregarNotificacoesEAvisos();
    }
  }, [user.id, location.pathname]);

  const notificacoesNaoLidas = notificacoes.filter((n) => !n.lida).length;
  const notificacoesRecentes = notificacoes.slice(0, 30);

  const CliqueSino = async () => {
    setMenuNotificacoesAberto(!menuNotificacoesAberto);
    if (!menuNotificacoesAberto) {
      if (abaNotificacoes === "notificacoes") {
        const naoLidas = notificacoes.filter(n => !n.lida);
        for (const n of naoLidas) {
          try {
            await api.get(`/notificacoes/updaterecetor?id_notificacao=${n.id_notificacao}`);
          } catch (e) {
            console.error(e);
          }
        }
        setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
      } else if (abaNotificacoes === "avisos" && abaAvisos === "recebidos") {
        const naoLidos = avisosRecebidos.filter(a => !a.lida);
        for (const a of naoLidos) {
          try {
            await api.get(`/notificacoes/updaterecetor?id_notificacao=${a.id}`);
          } catch (e) {
            console.error(e);
          }
        }
        setAvisosRecebidos(prev => prev.map(a => ({ ...a, lida: true })));
      }
    }
  };

  const handleSwitchAba = async (aba) => {
    setAbaNotificacoes(aba);
    if (aba === "avisos" && abaAvisos === "recebidos") {
      const naoLidos = avisosRecebidos.filter(a => !a.lida);
      for (const a of naoLidos) {
        try {
          await api.get(`/notificacoes/updaterecetor?id_notificacao=${a.id}`);
        } catch (e) {
          console.error(e);
        }
      }
      setAvisosRecebidos(prev => prev.map(a => ({ ...a, lida: true })));
    } else if (aba === "notificacoes") {
      const naoLidas = notificacoes.filter(n => !n.lida);
      for (const n of naoLidas) {
        try {
          await api.get(`/notificacoes/updaterecetor?id_notificacao=${n.id_notificacao}`);
        } catch (e) {
          console.error(e);
        }
      }
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    }
  };

  const avisosExibidos = useMemo(() => {
    if (abaAvisos === "recebidos") return avisosRecebidos;
    return avisosEnviados;
  }, [abaAvisos, avisosRecebidos, avisosEnviados]);

  const avisosNaoLidosCount = useMemo(() => {
    return avisosRecebidos.filter(a => !a.lida).length;
  }, [avisosRecebidos]);

  const visualizarAviso = async (aviso) => {
    setAvisoParaVisualizar(aviso);
    setMenuNotificacoesAberto(false);
    if (!aviso.lida && abaAvisos === "recebidos") {
      try {
        await api.get(`/notificacoes/updaterecetor?id_notificacao=${aviso.id}`);
        setAvisosRecebidos(prev => prev.map(a => a.id === aviso.id ? { ...a, lida: true } : a));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const getTradDestino = (aviso) => {
    if (aviso.tipoDestino === "individual") return `${t("individual")}: ${aviso.destino}`;
    if (aviso.destino === "Todos") return t("todos");
    if (aviso.destino === "Todos os Consultores") return t("consultores");
    if (aviso.destino === "Todos os Talent Managers") return t("talent_managers");
    if (aviso.destino === "Todos os Service Line Leaders") return t("service_line_leaders");
    return aviso.destino;
  };

  const getStyleClass = (aviso) => {
    if (aviso.tipoDestino === "individual") return "individual";
    if (aviso.destino === "Todos") return "todos";
    if (aviso.destino === "Todos os Consultores") return "consultores";
    if (aviso.destino === "Todos os Talent Managers") return "talents";
    if (aviso.destino === "Todos os Service Line Leaders") return "services";
    return "todos";
  };

  // === MENUS E ROTAS ===
  const menuItems = useMemo(() => {
    if (!user.cargo) return [];
    return menu_lateral.filter((item) => item.permissao.includes(user.cargo));
  }, [user.cargo]);

  const renderPagina = () => {
    if (!user.cargo) return <Routes><Route path="*" element={<Navigate to="/login" replace />} /></Routes>;

    return (
      <Routes>
        {/* Rota Home Comum */}
        <Route path="/home" element={
          user.cargo === "Administrador" ? <HomeAdmin user={user} saudacao={Saudacao()} onCriarAviso={() => setIsAvisoModalOpen(true)} /> :
            user.cargo === "Service Line Leader" ? <HomeService user={user} saudacao={Saudacao()} /> :
              user.cargo === "Talent Manager" ? <HomeTalent user={user} saudacao={Saudacao()} /> :
                <HomeConsultor user={user} saudacao={Saudacao()} />
        } />

        {/* Atividade (se for comum a todos) */}
        <Route path="/atividade" element={<Atividade />} />
        <Route path="/perfil/:id" element={<PerfilPessoal />} />

        {/* --- BLOCO ADMINISTRADOR --- */}
        {user.cargo === "Administrador" && (
          <>
            <Route path="/candidaturas" element={<Candidaturas loggedUser={user} />} />
            <Route path="/estatisticas" element={<EstatisticasAdmin />} />
            <Route path="/galeria" element={<Galeria />} />
            <Route path="/editar" element={<EditarAdmin />} />
            <Route path="/definicoes" element={<DefinicoesAdmin />} />
            <Route path="/utilizadores" element={<Utilizadores userRole={user.cargo} />} />
            <Route path="/utilizadores/criar-utilizador" element={<CriarUtilizador />} />
          </>
        )}

        {/* --- BLOCO TALENT MANAGER --- */}
        {user.cargo === "Talent Manager" && (
          <>
            <Route path="/candidaturas" element={<Candidaturas loggedUser={user} />} />
            <Route path="/estatisticas" element={<EstatisticasTalent />} />
            <Route path="/galeria" element={<Galeria_Talent_ServiceLine />} />
            <Route path="/utilizadores" element={<Utilizadores userRole={user.cargo} />} />
          </>
        )}

        {/* --- BLOCO SERVICE LINE LEADER --- */}
        {user.cargo === "Service Line Leader" && (
          <>
            <Route path="/candidaturas" element={<Candidaturas loggedUser={user} />} />
            <Route path="/estatisticas" element={<EstatisticasService user={user} />} />
            <Route path="/galeria" element={<Galeria_Talent_ServiceLine />} />
            <Route path="/utilizadores" element={<Utilizadores userRole={user.cargo} />} />
          </>
        )}

        {/* --- BLOCO CONSULTOR --- */}
        {user.cargo === "Consultor" && (
          <>
            <Route path="/candidaturas" element={<Candidaturas loggedUser={user} />} />
            <Route path="/estatisticas" element={<EstatisticasConsultor user={user} />} />
            <Route path="/galeria" element={<GaleriaConsultor />} />
            <Route path="/objetivos" element={<ObjetivosConsultor user={user} />} />
          </>
        )}

        <Route path="/politicas-rgpd" element={<PoliticasRGPD />} />

        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    );
  };

  // === RENDERIZAÇÃO CONDICIONAL ===
  if (loading) return <PageLoader texto={t("a_carregar", "A carregar...")} />;
  
  if (isRotaPublicaBadge) {
    return (
      <Routes>
        <Route path="/badges/:idBadge" element={<BadgePublico />} />
        <Route path="*" element={<Navigate to="/badges/1" replace />} />
      </Routes>
    );
  }

  if (isRotaPublicaPerfil) {
    return (
      <Routes>
        <Route path="/perfil/publico/:idUtilizador" element={<PerfilPublico />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    );
  }
  
  if (location.pathname === "/login") {
    if (user.cargo) return <Navigate to="/home" replace />;

    return <LoginPage onLoginSuccess={(dados) => {
      setUser({
        id: dados.id,
        nome: dados.nome,
        cargo: dados.role,
        foto: dados.imagem_perfil,
        ultimoLogin: new Date()
      });
    }} />
  }

  if (location.pathname === "/esqueci-password") {
    if (user.cargo) return <Navigate to="/home" replace />;
    return <EsqueciPasswordPage />;
  }

  if (location.pathname === "/primeiro-acesso") {
    if (user.cargo) return <Navigate to="/home" replace />;
    return <PrimeiroAcessoPage />;
  }

  // === ESTRUTURA PRINCIPAL (LAYOUT) ===
  return (
    <div className="vh-100 d-flex flex-column" id="layout">
      {/* CABEÇALHO */}
      <header className="d-flex justify-content-between align-items-center px-2 py-1 position-relative z-3" id="barra_horizontal">
        <div id="image_esquerda"><img id="softinsa_logo" src={softinsa_logo} alt="Softinsa Logo" /></div>
        <div className="d-flex align-items-center pe-2" id="info_direita">

          {/* SINO DE NOTIFICAÇÕES (UNIFICADO) */}
          <div className="position-relative d-flex align-items-center">
            <i ref={bellRef} id="bell_icon" className="fi fi-br-bell mx-2" onClick={CliqueSino} style={{ cursor: "pointer", fontSize: "1.2rem", color: "var(--fontes)" }}></i>
            {!menuNotificacoesAberto && (notificacoesNaoLidas + avisosNaoLidosCount) > 0 && (
              <span className="d-flex position-absolute translate-middle badge rounded-pill align-items-center justify-content-center" id="bolinha_sino">
                {(notificacoesNaoLidas + avisosNaoLidosCount) > 9 ? "9+" : (notificacoesNaoLidas + avisosNaoLidosCount)}
              </span>
            )}
          </div>

          {/* POPUP NOTIFICAÇÕES (UNIFICADO) */}
          {menuNotificacoesAberto && (
            <div ref={notifPopupRef} className="position-absolute bg-white shadow-sm p-3 rounded-4" id="pop_up_notification" style={{ top: "63%", right: "5%", width: "380px", zIndex: 1050 }}>

              {/* Header com Tabs */}
              <div className="d-flex border-bottom mb-3 justify-content-around align-items-center" style={{ borderColor: "var(--contorno)" }}>
                <button
                  type="button"
                  className={`notif-popup-tab pb-2 px-3 fw-semibold border-0 bg-transparent position-relative ${abaNotificacoes === "notificacoes" ? "active" : ""}`}
                  onClick={() => handleSwitchAba("notificacoes")}
                >
                  {t("notificacoes")}
                  {notificacoesNaoLidas > 0 && (
                    <span className="badge bg-danger rounded-circle ms-1" style={{ fontSize: "0.65rem", padding: "0.2rem 0.4rem" }}>
                      {notificacoesNaoLidas}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  className={`notif-popup-tab pb-2 px-3 fw-semibold border-0 bg-transparent position-relative ${abaNotificacoes === "avisos" ? "active" : ""}`}
                  onClick={() => handleSwitchAba("avisos")}
                >
                  {t("avisos_titulo")}
                  {avisosNaoLidosCount > 0 && (
                    <span className="badge bg-danger rounded-circle ms-1" style={{ fontSize: "0.65rem", padding: "0.2rem 0.4rem" }}>
                      {avisosNaoLidosCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Conteúdo: Aba Notificações */}
              {abaNotificacoes === "notificacoes" && (
                <div className="d-flex flex-column gap-1" id="notification_list" style={{ maxHeight: "250px", overflowY: "auto" }}>
                  {notificacoesRecentes.length === 0 ? (
                    <p className="text-center my-3 text-muted">{t("notificacao_vazia")}</p>
                  ) : (
                    notificacoesRecentes.map((notif) => (
                      <div key={notif.id} className="d-flex justify-content-between align-items-center p-2 bg-white" id="notification_option">
                        <div className="m-0 pe-2" id="notification_esquerda">
                          <span id="nome_notificacao">{notif.texto}</span>
                        </div>
                        <div className="d-flex flex-column align-items-center justify-content-center" id="notification_direita">
                          <i className={`${iconesNotificacao[notif.tipo].desenho}`} style={{ color: iconesNotificacao[notif.tipo].cor }}></i>
                          <span>{notif.data}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Conteúdo: Aba Avisos */}
              {abaNotificacoes === "avisos" && (
                <div className="d-flex flex-column" id="unified_avisos_container">
                  {/* Linha de controlo (Adicionar aviso / Filtro Recebidos-Enviados) para Admin/TM */}
                  {(user.cargo === "Administrador" || user.cargo === "Talent Manager") && (
                    <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                      <div className="d-flex gap-2">
                        <span
                          className={`aviso-popup-tab pb-1 px-2 fw-semibold`}
                          style={{
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            borderBottom: abaAvisos === "recebidos" ? "2px solid var(--barra_lateral)" : "none",
                            color: abaAvisos === "recebidos" ? "var(--barra_lateral)" : "var(--cor-cinza-escura)"
                          }}
                          onClick={() => setAbaAvisos("recebidos")}
                        >
                          {t("recebidos")}
                        </span>
                        <span
                          className={`aviso-popup-tab pb-1 px-2 fw-semibold`}
                          style={{
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            borderBottom: abaAvisos === "enviados" ? "2px solid var(--barra_lateral)" : "none",
                            color: abaAvisos === "enviados" ? "var(--barra_lateral)" : "var(--cor-cinza-escura)"
                          }}
                          onClick={() => setAbaAvisos("enviados")}
                        >
                          {t("enviados")}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm rounded-circle d-flex align-items-center justify-content-center border-0 text-white"
                        style={{ width: "22px", height: "22px", padding: 0, backgroundColor: "var(--barra_lateral)" }}
                        onClick={() => { setIsAvisoModalOpen(true); setMenuNotificacoesAberto(false); }}
                        title={t("criar_aviso_btn") || "Criar Aviso"}
                      >
                        <i className="fi fi-br-plus" style={{ fontSize: "9px", lineHeight: "0" }}></i>
                      </button>
                    </div>
                  )}

                  <div className="d-flex flex-column gap-1" id="notification_list" style={{ maxHeight: "250px", overflowY: "auto" }}>
                    {avisosExibidos.length === 0 ? (
                      <p className="text-center my-3 text-muted">{t("aviso_vazio")}</p>
                    ) : (
                      [...avisosExibidos].reverse().map((aviso) => (
                        <div key={aviso.id} className="d-flex justify-content-between align-items-center p-2 bg-white" id="notification_option">
                          <div className="m-0 pe-2" id="notification_esquerda" style={{ cursor: "pointer" }} onClick={() => visualizarAviso(aviso)}>
                            <span id="nome_notificacao">{aviso.mensagem}</span>
                          </div>
                          <div className="d-flex flex-column align-items-center justify-content-center" id="notification_direita">
                            <div className="d-flex align-items-center gap-1 mb-1">
                              <i className="fi fi-br-info me-1" style={{ color: "var(--fontes)", fontSize: "0.9rem" }}></i>
                              <span className={`aviso-tag aviso-tag-${getStyleClass(aviso)}`}>{getTradDestino(aviso)}</span>
                            </div>
                            <span>{aviso.data}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          <div className="mx-2"><LanguageSelector /></div>

          <div id="name_cargo" className="d-flex flex-column align-items-center mx-2 d-none d-md-flex text-dark">
            <span><b>{user.nome}</b></span>
            <span style={{ fontSize: "0.8rem" }}>{user.cargo ? t(user.cargo) : ""}</span>
          </div>

          <img
            id="user_image"
            className="mx-3 rounded-2"
            src={user.foto || user_logo}
            width="30"
            height="30"
            alt="Utilizador"
            style={{ cursor: "pointer", objectFit: "cover" }}
            onClick={() => navigate(`perfil/${user.id}`)}
          />
        </div>
      </header>

      {/* CORPO PRINCIPAL */}
      <div className="d-flex m-0 flex-grow-1 w-100" style={{ minHeight: 0 }}>
        <div id="barra_lateral">
          <div className="sidebar-nav">
            {menuItems.map((item) => (
              <div
                key={item.slug}
                className={`sidebar-nav-item ${location.pathname.includes(item.slug) ? "pag_ativa" : ""}`}
                onClick={() => navigate(`/${item.slug}`)}
              >
                <i className={`fi ${item.icon} sidebar-nav-icon`}></i>
                <span className="sidebar-nav-label d-none d-xl-block">{t(item.label)}</span>
              </div>
            ))}
          </div>
          <div className="sidebar-footer d-none d-xl-flex">
            <span className="item_rodape_lateral" onClick={() => navigate("/politicas-rgpd")}>{t("politicas_rgpd")}</span>
            <span className="sidebar-footer-dot">•</span>
            <span className="item_rodape_lateral" onClick={() => window.open('https://www.softinsa.pt', '_blank', 'noopener,noreferrer')}>{t("quem_somos")}</span>
          </div>
        </div>

        <div className="h-100 d-flex flex-column flex-grow-1" id="Container" style={{ overflow: "hidden", minWidth: 0 }}>
          {renderPagina()}
        </div>

        {/* MODAIS DE AVISOS */}
        {isAvisoModalOpen && (
          <AvisoFormModal
            avisoParaEditar={avisoParaEditar}
            mostrarToast={mostrarToast}
            onClose={() => { setIsAvisoModalOpen(false); setAvisoParaEditar(null); }}
            onSave={async (dados) => {
              try {
                if (avisoParaEditar) {
                  await api.put(`/notificacoes/editaraviso/${avisoParaEditar.id}`, dados);
                } else {
                  await api.post("/notificacoes/enviaraviso", dados);
                }
                await carregarNotificacoesEAvisos();
              } catch (error) {
                console.error("Erro ao guardar aviso:", error);
                mostrarToast("Erro ao guardar o aviso.", "erro");
              }
              setIsAvisoModalOpen(false);
              setAvisoParaEditar(null);
            }} 
            t={t} 
          />
        )}

        {avisoParaVisualizar && (
          <AvisoDetailModal 
            aviso={avisoParaVisualizar} 
            onClose={() => setAvisoParaVisualizar(null)} 
            t={t} 
            getTradDestino={getTradDestino} 
            getStyleClass={getStyleClass} 
            onEdit={(avisoParaVisualizar.autor === user.nome || avisoParaVisualizar.autor === "Eu") ? () => {
              setAvisoParaEditar(avisoParaVisualizar);
              setAvisoParaVisualizar(null);
              setIsAvisoModalOpen(true);
            } : null}
          />
        )}

        <ModalConfirmacao isOpen={!!avisoToDelete} onClose={() => setAvisoToDelete(null)} onConfirm={() => { setAvisosEnviados((prev) => prev.filter((a) => a.id !== avisoToDelete.id)); setAvisoToDelete(null); }} titulo={t("eliminar_aviso")} mensagem={`${t("confirmar_eliminar_aviso")} (${avisoToDelete?.titulo || (avisoToDelete?.mensagem ? (avisoToDelete.mensagem.substring(0, 30) + '...') : '')})`} textoConfirmar="Eliminar" />
      </div>
    </div>
  );
}

// === COMPONENTS AUXILIARES PARA AVISOS ===
function AvisoFormModal({ onClose, onSave, t, avisoParaEditar, mostrarToast }) {
  const [mensagem, setMensagem] = useState(avisoParaEditar ? avisoParaEditar.mensagem : "");
  const [tipoDestino, setTipoDestino] = useState(avisoParaEditar ? avisoParaEditar.tipoDestino : "grupo");
  const [destino, setDestino] = useState(avisoParaEditar ? avisoParaEditar.destino : "Todos");

  const handleTipoChange = (e) => { const val = e.target.value; setTipoDestino(val); setDestino(val === "grupo" ? "Todos" : ""); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!mensagem.trim() || (tipoDestino === "individual" && !destino.trim())) {
      mostrarToast("Por favor preencha todos os campos obrigatórios.", "erro");
      return;
    }
    onSave({ titulo: "", mensagem, tipoDestino, destino });
  };

  return (
    <div className="aviso-modal-overlay">
      <div className="aviso-modal-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="m-0">{avisoParaEditar ? t("editar_aviso") || "Editar Aviso" : t("criar_aviso")}</h4>
          <button className="aviso-modal-close-btn" type="button" onClick={onClose}><i className="fi fi-br-cross"></i></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">{t("destinatario")} *</label>
            <div className="d-flex gap-3 mb-2">
              <div className="form-check"><input className="form-check-input" type="radio" name="tipoDestino" id="destGrupo" value="grupo" checked={tipoDestino === "grupo"} onChange={handleTipoChange} /><label className="form-check-label" htmlFor="destGrupo">{t("grupo")}</label></div>
              <div className="form-check"><input className="form-check-input" type="radio" name="tipoDestino" id="destIndiv" value="individual" checked={tipoDestino === "individual"} onChange={handleTipoChange} /><label className="form-check-label" htmlFor="destIndiv">{t("individual")}</label></div>
            </div>
            {tipoDestino === "grupo" ? (
              <select className="form-select" value={destino} onChange={(e) => setDestino(e.target.value)}>
                <option value="Todos">{t("todos")}</option><option value="Todos os Consultores">{t("consultores")}</option><option value="Todos os Talent Managers">{t("talent_managers")}</option><option value="Todos os Service Line Leaders">{t("service_line_leaders")}</option>
              </select>
            ) : (<input type="text" className="form-control" value={destino} onChange={(e) => setDestino(e.target.value)} placeholder="Nome ou e-mail exato do colaborador" required />)}
          </div>
          <div className="mb-4">
            <label className="form-label fw-semibold">{t("mensagem")} *</label>
            <textarea className="form-control" rows="5" value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Escreva a mensagem aqui..." required></textarea>
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-light border d-inline-flex align-items-center justify-content-center px-4"
              style={{
                height: "44px",
                fontWeight: 500,
                fontSize: "16px",
                borderRadius: "var(--border-radius-pequeno)"
              }}
              onClick={onClose}
            >
              {t("cancelar")}
            </button>
            <button
              type="submit"
              className="btn text-white border-0 d-inline-flex align-items-center justify-content-center px-4 shadow-sm"
              style={{
                backgroundColor: "var(--barra_lateral)",
                height: "44px",
                fontWeight: 500,
                fontSize: "16px",
                borderRadius: "var(--border-radius-pequeno)"
              }}
            >
              {t("enviar")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AvisoDetailModal({ aviso, onClose, getTradDestino, getStyleClass, t, onEdit }) {
  return (
    <div className="aviso-modal-overlay" onClick={onClose}>
      <div className="aviso-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="d-flex align-items-center gap-2">
            <span className={`aviso-tag aviso-tag-${getStyleClass(aviso)}`}>{getTradDestino(aviso)}</span>
            {onEdit && (
              <button 
                type="button" 
                className="btn btn-outline-secondary btn-sm border-0 d-inline-flex align-items-center justify-content-center p-1" 
                onClick={onEdit}
                title={t("editar") || "Editar"}
              >
                <i className="fi fi-br-edit" style={{ fontSize: "12px" }}></i>
              </button>
            )}
          </div>
          <button className="aviso-modal-close-btn" type="button" onClick={onClose}><i className="fi fi-br-cross" style={{ fontSize: "0.9rem" }}></i></button>
        </div>
        {aviso.titulo && <h4 className="mb-3">{aviso.titulo}</h4>}
        <p className="mb-4 text-muted" style={{ whiteSpace: "pre-line", fontSize: "0.95rem" }}>{aviso.mensagem}</p>
        <hr className="mb-3" style={{ opacity: 0.15 }} />
        <div className="d-flex justify-content-between text-muted" style={{ fontSize: "0.8rem" }}>
          <span>Enviado por: <strong>{aviso.autor}</strong></span><span>{aviso.data}</span>
        </div>
      </div>
    </div>
  );
}

export default App;