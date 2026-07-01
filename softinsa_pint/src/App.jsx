import React, { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import axios from "axios";
import { menu_lateral } from "./defs/barra_lateral.jsx";
import { iconesNotificacao } from "./defs/dicionario.jsx";
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
import LanguageSelector from "./components/ui/LanguageSelector/LanguageSelector.jsx";

// Imagens
import softinsa_logo from "./assets/logotipo_softinsa.png";
import user_logo from "./assets/utilizador.png";

function App() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // === ESTADOS GLOBAIS DA APP ===
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({
    id: null,
    nome: null,
    cargo: null,
    foto: null,
    ultimoLogin: null,
  });

  // Redirecionar para /login se não autenticado (após terminar o carregamento)
  useEffect(() => {
    if (!loading && !user.cargo && location.pathname !== "/login") {
      navigate("/login", { replace: true });
    }
  }, [loading, user.cargo, location.pathname, navigate]);

  // === REFS E ESTADOS PARA MENUS, NOTIFICAÇÕES E AVISOS ===
  const bellRef = useRef(null);
  const notifPopupRef = useRef(null);

  const [menuNotificacoesAberto, setMenuNotificacoesAberto] = useState(false);
  const [abaNotificacoes, setAbaNotificacoes] = useState("notificacoes");
  const [isAvisoModalOpen, setIsAvisoModalOpen] = useState(false);
  const [avisoParaEditar, setAvisoParaEditar] = useState(null);
  const [avisoParaVisualizar, setAvisoParaVisualizar] = useState(null);
  const [avisoToDelete, setAvisoToDelete] = useState(null);
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
          ? roleParseada.toLowerCase() 
          : (roleParseada.nome ? roleParseada.nome.toLowerCase() : null);

        const res = await axios.get("http://localhost:5000/api/getuser", { params: { id: idGuardado } });
        
        if (res.data) {
          setUser({
            id: idGuardado,
            nome: res.data.nome_user || res.data.nome,
            cargo: cargoFinal,
            foto: res.data.imagem_perfil || res.data.foto || null,
            ultimoLogin: res.data.last_login || new Date()
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

  // === DADOS DE TESTE E LÓGICA (Avisos e Notificações) ===
  const [avisos, setAvisos] = useState(() => {
    const saved = localStorage.getItem("softinsa_avisos");
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [
      { id: 1, titulo: "Manutenção do Portal", mensagem: "O portal de badges estará em manutenção no próximo sábado.", tipoDestino: "grupo", destino: "Todos", data: "25/06/2026 10:00", autor: "Admin" },
      { id: 2, titulo: "Nova Learning Path de DevOps", mensagem: "Lançámos a nova trilha focada em DevOps!", tipoDestino: "grupo", destino: "Todos os Consultores", data: "26/06/2026 14:30", autor: "Admin" },
      { id: 3, titulo: "Reunião de Alinhamento", mensagem: "Carlos, por favor comparece na sala 1.", tipoDestino: "individual", destino: "Carlos", data: "27/06/2026 09:15", autor: "Gonçalo" },
    ];
  });

  useEffect(() => localStorage.setItem("softinsa_avisos", JSON.stringify(avisos)), [avisos]);

  const [notificacoes, setNotificacoes] = useState([
    { id: 1, texto: "Submeteu uma nova candidatura para React.", tipo: "Badge", data: "21/08/2025 19:40", remetente: "Ana Silva", lida: false },
    { id: 2, texto: "A reunião foi alterada para a sala 3.", tipo: "Aceite", data: "21/08/2025 19:40", remetente: "Carlos", lida: false },
  ]);

  const notificacoesNaoLidas = notificacoes.filter((n) => !n.lida).length;
  const notificacoesRecentes = notificacoes.slice(0, 30);

  const CliqueSino = () => {
    setMenuNotificacoesAberto(!menuNotificacoesAberto);
    if (!menuNotificacoesAberto) {
      if (notificacoesNaoLidas > 0) {
        setNotificacoes(notificacoes.map((n) => ({ ...n, lida: true })));
      }
      if (abaNotificacoes === "avisos") {
        setAvisosNaoLidosCount(0);
      }
    }
  };

  const handleSwitchAba = (aba) => {
    setAbaNotificacoes(aba);
    if (aba === "avisos") {
      setAvisosNaoLidosCount(0);
    }
  };

  const avisosFiltrados = useMemo(() => {
    return avisos.filter((aviso) => {
      if (aviso.tipoDestino === "grupo") {
        if (aviso.destino === "Todos") return true;
        if (aviso.destino === "Todos os Consultores" && user.cargo === "consultor") return true;
        if (aviso.destino === "Todos os Talent Managers" && user.cargo === "talent manager") return true;
        if (aviso.destino === "Todos os Service Line Leaders" && user.cargo === "service line leader") return true;
      } else if (aviso.tipoDestino === "individual") {
        const target = aviso.destino ? aviso.destino.toLowerCase().trim() : "";
        const userName = user.nome ? user.nome.toLowerCase().trim() : "";
        return target === userName;
      }
      return false;
    });
  }, [avisos, user]);

  const avisosExibidos = useMemo(() => {
    if (abaAvisos === "recebidos") return avisosFiltrados.filter((a) => a.autor !== user.nome);
    return avisos.filter((a) => a.autor === user.nome);
  }, [abaAvisos, avisosFiltrados, avisos, user.nome]);

  const [avisosNaoLidosCount, setAvisosNaoLidosCount] = useState(0);

  useEffect(() => {
    if (user.ultimoLogin) {
      const loginTime = new Date(user.ultimoLogin).getTime();
      const unread = avisosFiltrados.filter((aviso) => {
        const parts = aviso.data.split(" ");
        if (parts.length === 2) {
          const dateParts = parts[0].split("/");
          const timeParts = parts[1].split(":");
          if (dateParts.length === 3 && timeParts.length === 2) {
            const avisoDate = new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]), parseInt(timeParts[0]), parseInt(timeParts[1]));
            return avisoDate.getTime() > loginTime;
          }
        }
        return false;
      }).length;
      setAvisosNaoLidosCount(unread);
    }
  }, [avisosFiltrados, user.ultimoLogin]);

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
        <Route path="/home" element={
          user.cargo === "administrador" 
            ? <HomeAdmin user={user} saudacao={t("saudacao_dia")} onCriarAviso={() => setIsAvisoModalOpen(true)} />
            : user.cargo === "service line leader" ? <HomeService user={user} saudacao={t("saudacao_dia")} />
            : user.cargo === "talent manager" ? <HomeTalent user={user} saudacao={t("saudacao_dia")} />
            : <HomeConsultor user={user} saudacao={t("saudacao_dia")} />
        } />
        
        {/* Rotas partilhadas */}
        <Route path="/candidaturas" element={<Candidaturas />} />
        <Route path="/atividade" element={<Atividade />} />
        <Route path="/perfil/:id" element={<PerfilPessoal />} />

        {/* Estatisticas Especificas */}
        {user.cargo === "administrador" && <Route path="/estatisticas" element={<EstatisticasAdmin />} />}
        {user.cargo === "service line leader" && <Route path="/estatisticas" element={<EstatisticasService user={user} />} />}
        {user.cargo === "talent manager" && <Route path="/estatisticas" element={<EstatisticasTalent />} />}
        {user.cargo === "consultor" && <Route path="/estatisticas" element={<EstatisticasConsultor user={user} />} />}

        {/* Galerias */}
        {user.cargo === "administrador" && (
          <Route path="/galeria" element={<Galeria />} />
        )}

        {user.cargo === "consultor" && (
          <Route path="/galeria" element={<GaleriaConsultor />} />
        )}

        {(user.cargo === "talent manager" ||
          user.cargo === "service line leader") && (
          <Route path="/galeria" element={<Galeria_Talent_ServiceLine />} />
        )}

        {/* Rotas Exclusivas */}
        {user.cargo === "consultor" && <Route path="/objetivos" element={<ObjetivosConsultor user={user} />} />}
        {user.cargo === "administrador" && <Route path="/editar" element={<EditarAdmin />} />}
        {user.cargo === "administrador" && <Route path="/definicoes" element={<DefinicoesAdmin />} />}

        {/* Fallbacks */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    );
  };

  // === RENDERIZAÇÃO CONDICIONAL ===
  if (loading) return <div className="vh-100 d-flex justify-content-center align-items-center text-secondary">A carregar...</div>;

  if (location.pathname === "/login") {
    if (user.cargo) return <Navigate to="/home" replace />;
    
    return <LoginPage onLoginSuccess={({ id, nome, role, foto }) => {
      setUser({ id, nome, cargo: role.toLowerCase(), foto, ultimoLogin: new Date() });
    }} />;
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
                          <span id="nome_notificacao"><b>{notif.remetente}</b></span>
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
                  {(user.cargo === "administrador" || user.cargo === "talent manager") && (
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
                        onClick={() => { setAvisoParaEditar(null); setIsAvisoModalOpen(true); setMenuNotificacoesAberto(false); }}
                        title={t("criar_aviso_btn") || "Criar Aviso"}
                      >
                        <i className="fi fi-br-plus" style={{ fontSize: "9px", lineHeight: "0" }}></i>
                      </button>
                    </div>
                  )}

                  <div className="d-flex flex-column gap-2" id="avisos_list" style={{ maxHeight: "230px", overflowY: "auto" }}>
                    {avisosExibidos.length === 0 ? (
                      <p className="text-center my-3 text-muted">{t("aviso_vazio")}</p>
                    ) : (
                      [...avisosExibidos].reverse().map((aviso) => (
                        <div key={aviso.id} className="aviso-item p-2 rounded-3 position-relative">
                          <div className="d-flex justify-content-between align-items-start gap-2">
                            <span className="fw-bold text-truncate text-dark" style={{ cursor: "pointer", maxWidth: "160px", fontSize: "0.85rem" }} onClick={() => { setAvisoParaVisualizar(aviso); setMenuNotificacoesAberto(false); }}>{aviso.titulo}</span>
                            <div className="d-flex gap-1 align-items-center flex-shrink-0">
                              <span className={`aviso-tag aviso-tag-${getStyleClass(aviso)}`}>{getTradDestino(aviso)}</span>
                              {aviso.autor === user.nome && (
                                <div className="d-flex gap-1 ms-2">
                                  <i className="fi fi-br-pencil text-muted" style={{ cursor: "pointer", fontSize: "11px" }} onClick={() => { setAvisoParaEditar(aviso); setIsAvisoModalOpen(true); setMenuNotificacoesAberto(false); }}></i>
                                  <i className="fi fi-br-trash text-danger" style={{ cursor: "pointer", fontSize: "11px" }} onClick={() => setAvisoToDelete(aviso)}></i>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-muted mb-1 text-truncate" style={{ fontSize: "0.75rem", cursor: "pointer" }} onClick={() => { setAvisoParaVisualizar(aviso); setMenuNotificacoesAberto(false); }}>{aviso.mensagem}</p>
                          <div className="d-flex justify-content-between text-muted" style={{ fontSize: "0.65rem" }}>
                            <span>Por: {aviso.autor}</span><span>{aviso.data}</span>
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
          <i
            className="fi fi-br-sign-out-alt me-2 text-secondary"
            style={{ cursor: "pointer", fontSize: "1.1rem" }}
            title={t("auth_roles_terminar")}
            onClick={() => {
              setUser((prev) => ({ ...prev, cargo: null }));
              navigate("/login");
            }}
          ></i>
        </div>
      </header>

      {/* CORPO PRINCIPAL */}
      <div className="d-flex m-0 flex-grow-1 w-100" style={{ minHeight: 0 }}>
        <div id="barra_lateral">
          <div className="mt-3 justify-content-center">
            {menuItems.map((item) => (
              <div key={item.slug} className={`d-flex align-items-center justify-content-center justify-content-xl-start my-2 ps-xl-2 ${location.pathname.includes(item.slug) ? "pag_ativa" : ""}`} onClick={() => navigate(`/${item.slug}`)} id="item_lateral">
                <i className={`fi ${item.icon} mx-2 fs-5`}></i>
                <span className="ms-2 d-none d-xl-block fs-5">{t(item.label)}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="h-100 d-flex flex-column flex-grow-1" id="Container" style={{ overflow: "hidden", minWidth: 0 }}>
          {renderPagina()}
        </div>

        {/* MODAIS DE AVISOS */}
        {isAvisoModalOpen && (
          <AvisoFormModal aviso={avisoParaEditar} onClose={() => setIsAvisoModalOpen(false)} onSave={(dados) => {
            if (avisoParaEditar) {
              setAvisos((prev) => prev.map((a) => a.id === avisoParaEditar.id ? { ...a, ...dados } : a));
            } else {
              const novo = { id: avisos.length > 0 ? Math.max(...avisos.map((a) => a.id)) + 1 : 1, ...dados, data: new Date().toLocaleDateString("pt-PT") + " " + new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }), autor: user.nome || "Admin" };
              setAvisos((prev) => [...prev, novo]);
            }
            setIsAvisoModalOpen(false);
          }} t={t} />
        )}

        {avisoParaVisualizar && (
          <AvisoDetailModal aviso={avisoParaVisualizar} onClose={() => setAvisoParaVisualizar(null)} t={t} getTradDestino={getTradDestino} getStyleClass={getStyleClass} />
        )}

        <ModalConfirmacao isOpen={!!avisoToDelete} onClose={() => setAvisoToDelete(null)} onConfirm={() => { setAvisos((prev) => prev.filter((a) => a.id !== avisoToDelete.id)); setAvisoToDelete(null); }} titulo={t("eliminar_aviso")} mensagem={`${t("confirmar_eliminar_aviso")} (${avisoToDelete?.titulo})`} textoConfirmar="Eliminar" />
      </div>
    </div>
  );
}

// === COMPONENTS AUXILIARES PARA AVISOS ===
function AvisoFormModal({ aviso, onClose, onSave, t }) {
  const [titulo, setTitulo] = useState(aviso ? aviso.titulo : "");
  const [mensagem, setMensagem] = useState(aviso ? aviso.mensagem : "");
  const [tipoDestino, setTipoDestino] = useState(aviso ? aviso.tipoDestino : "grupo");
  const [destino, setDestino] = useState(aviso ? aviso.destino : "Todos");

  const handleTipoChange = (e) => { const val = e.target.value; setTipoDestino(val); setDestino(val === "grupo" ? "Todos" : ""); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!titulo.trim() || !mensagem.trim() || (tipoDestino === "individual" && !destino.trim())) { alert("Por favor preencha todos os campos obrigatórios."); return; }
    onSave({ titulo, mensagem, tipoDestino, destino });
  };

  return (
    <div className="aviso-modal-overlay">
      <div className="aviso-modal-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="m-0">{aviso ? t("editar_aviso") : t("criar_aviso")}</h4>
          <button className="aviso-modal-close-btn" type="button" onClick={onClose}><i className="fi fi-br-cross"></i></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">{t("titulo")} *</label>
            <input type="text" className="form-control" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Atualização dos Termos de Uso" required />
          </div>
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

function AvisoDetailModal({ aviso, onClose, getTradDestino, getStyleClass }) {
  return (
    <div className="aviso-modal-overlay" onClick={onClose}>
      <div className="aviso-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <span className={`aviso-tag aviso-tag-${getStyleClass(aviso)}`}>{getTradDestino(aviso)}</span>
          <button className="aviso-modal-close-btn" type="button" onClick={onClose}><i className="fi fi-br-cross" style={{ fontSize: "0.9rem" }}></i></button>
        </div>
        <h4 className="mb-3">{aviso.titulo}</h4>
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