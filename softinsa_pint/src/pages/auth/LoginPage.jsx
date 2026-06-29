import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AuthTopBar from "../../components/Auth/AuthTopBar/AuthTopBar.jsx";
import AuthArtPanel from "../../components/Auth/AuthArtPanel/AuthArtPanel.jsx";
import "./LoginPage.css";

const utilizadoresMock = {
  "consultor@softinsa.pt": {
    nome: "Consultor Demo",
    roles: ["consultor"],
  },
  "multi@softinsa.pt": {
    nome: "Utilizador Multi-role",
    roles: ["consultor", "talent", "service", "admin"],
  },
};

const rolesConfig = {
  consultor: {
    tituloKey: "auth_role_consultor",
    icone: "fi-br-user",
  },
  talent: {
    tituloKey: "auth_role_talent",
    icone: "fi-br-users",
  },
  service: {
    tituloKey: "auth_role_service",
    icone: "fi-br-diagram-project",
  },
  admin: {
    tituloKey: "auth_role_admin",
    icone: "fi-br-settings",
  },
};

function LoginPage({ onLoginSuccess }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [etapa, setEtapa] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [estadoLogin, setEstadoLogin] = useState("normal");
  const [utilizadorValidado, setUtilizadorValidado] = useState(null);
  const [roleSelecionada, setRoleSelecionada] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();

    setEstadoLogin("loading");

    setTimeout(() => {
      const utilizadorEncontrado = utilizadoresMock[email.trim().toLowerCase()];

      if (!utilizadorEncontrado || password.trim() === "") {
        setEstadoLogin("error");
        return;
      }

      setUtilizadorValidado(utilizadorEncontrado);

      if (utilizadorEncontrado.roles.length === 1) {
      onLoginSuccess({
          nome: utilizadorEncontrado.nome,
          role: utilizadorEncontrado.roles[0],
      });

      navigate("/home");
      return;
      }

      setRoleSelecionada(utilizadorEncontrado.roles[0]);
      setEtapa("roles");
      setEstadoLogin("normal");
    }, 700);
  };

  const handleContinuarComRole = () => {
    if (!roleSelecionada || !utilizadorValidado) {
      return;
    }

    onLoginSuccess({
      nome: utilizadorValidado.nome,
      role: roleSelecionada,
    });

    navigate("/home");
  };

  const handleVoltar = () => {
    setEtapa("login");
    setRoleSelecionada(null);
    setUtilizadorValidado(null);
    setEstadoLogin("normal");
  };

  const handleTerminarSessao = () => {
    setEtapa("login");
    setEmail("");
    setPassword("");
    setRoleSelecionada(null);
    setUtilizadorValidado(null);
    setEstadoLogin("normal");
  };

  return (
    <div className="login-page">
      <AuthTopBar />
      <AuthArtPanel />

      <main className="login-page-conteudo">
        {etapa === "login" && (
          <section className="login-page-card">

            <div className="login-page-cabecalho">
              <h1 className="texto-titulo-principal login-page-titulo">
                {t("auth_login_titulo")}
              </h1>

              <p className="texto-auth-subtitulo login-page-descricao">
                {t("auth_login_subtitulo")}
              </p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="login-form-grupo">
                <label className="texto-auth-label login-form-label">
                  {t("auth_login_email")}
                </label>

                <input
                  className={`login-form-input ${
                    estadoLogin === "error" ? "login-form-input-erro" : ""
                  }`}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="login-form-grupo">
                <label className="texto-auth-label login-form-label">
                  {t("auth_login_password")}
                </label>

                <div className="login-form-password-wrapper">
                  <input
                    className={`login-form-input login-form-input-password ${
                      estadoLogin === "error" ? "login-form-input-erro" : ""
                    }`}
                    type={mostrarPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="login-form-password-toggle texto-auth-link"
                    onClick={() =>
                      setMostrarPassword(
                        (mostrarAtual) => !mostrarAtual
                      )
                    }
                  >
                    {mostrarPassword
                      ? t("auth_login_password_ocultar")
                      : t("auth_login_password_mostrar")}
                  </button>
                </div>
              </div>

              {estadoLogin === "error" && (
                <div className="login-feedback login-feedback-erro">
                  <i className="fi fi-br-info"></i>
                  <span className="texto-auth-feedback">
                    {t("auth_login_erro")}
                  </span>
                </div>
              )}

              <div className="login-form-acoes">
                <button
                  type="submit"
                  className="login-botao-principal"
                  disabled={estadoLogin === "loading"}
                >
                  {estadoLogin === "loading" && (
                    <span className="login-botao-spinner" />
                  )}

                  <span>
                    {estadoLogin === "loading"
                      ? t("auth_login_loading")
                      : t("auth_login_entrar")}
                  </span>
                </button>

                <button
                  type="button"
                  className="login-link-secundario texto-auth-link"
                >
                  {t("auth_login_esqueci_password")}
                </button>
              </div>
            </form>
          </section>
        )}

        {etapa === "roles" && utilizadorValidado && (
          <section className="login-page-card login-page-card-roles">

            <div className="login-page-cabecalho">
              <h1 className="texto-titulo-principal login-page-titulo">
                {t("auth_roles_titulo")}
              </h1>

              <p className="texto-auth-subtitulo login-page-descricao">
                {t("auth_roles_subtitulo")}
              </p>
            </div>

            <div className="login-roles-grid">
              {utilizadorValidado.roles.map((role) => {
                const roleConfig = rolesConfig[role];
                const estaSelecionada = roleSelecionada === role;

                return (
                  <button
                    key={role}
                    type="button"
                    className={`login-role-card ${
                      estaSelecionada ? "login-role-card-selecionado" : ""
                    }`}
                    onClick={() => setRoleSelecionada(role)}
                  >
                    <span className="login-role-icone">
                      <i className={`fi ${roleConfig.icone}`}></i>
                    </span>

                    <span className="login-role-texto">
                      <span className="texto-auth-role-titulo login-role-titulo">
                        {t(roleConfig.tituloKey)}
                      </span>
                    </span>

                    {estaSelecionada && (
                      <span className="login-role-check">
                        <i className="fi fi-br-check"></i>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="login-roles-acoes">
              <button
                type="button"
                className="login-botao-secundario"
                onClick={handleVoltar}
              >
                {t("auth_roles_voltar")}
              </button>

              <button
                type="button"
                className="login-botao-secundario"
                onClick={handleTerminarSessao}
              >
                {t("auth_roles_terminar")}
              </button>

              <button
                type="button"
                className="login-botao-principal"
                disabled={!roleSelecionada}
                onClick={handleContinuarComRole}
              >
                {t("auth_roles_continuar")}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default LoginPage;