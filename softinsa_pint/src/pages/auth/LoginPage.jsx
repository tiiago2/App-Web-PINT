import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import api from '../../services/api.js';
import AuthTopBar from "../../components/Auth/AuthTopBar/AuthTopBar.jsx";
import AuthArtPanel from "../../components/Auth/AuthArtPanel/AuthArtPanel.jsx";
import "./LoginPage.css";

function LoginPage({ onLoginSuccess }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const passwordResetSuccess = location.state?.passwordResetSuccess || false;

  const [etapa, setEtapa] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [estadoLogin, setEstadoLogin] = useState("normal");

  const [utilizadorValidado, setUtilizadorValidado] = useState(null);
  const [roles, setRoles] = useState(null);
  const [roleSelecionada, setRoleSelecionada] = useState(null);

  const extrairDadosEAvancar = (userApi, roleEscolhida) => {

    const idParaGuardar = userApi.id;
    localStorage.setItem('utilizador_id', idParaGuardar);
    localStorage.setItem('role_softinsa', JSON.stringify(roleEscolhida));

    onLoginSuccess({
      id: idParaGuardar,
      nome: userApi.nome || userApi.nome_user,
      role: roleEscolhida.nome,
      foto: userApi.imagem_perfil
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setEstadoLogin("loading");

    try {
      const resposta = await api.post('/login', { email, password });
      const { token, utilizador } = resposta.data;

      localStorage.setItem('token_softinsa', token);
      setUtilizadorValidado(utilizador);

      const rolesRecebidas = utilizador.roles || [];

      if (rolesRecebidas.length === 1) {
        extrairDadosEAvancar(utilizador, rolesRecebidas[0]);
      } else if (rolesRecebidas.length > 1) {
        setRoles(rolesRecebidas);
        setRoleSelecionada(rolesRecebidas[0]);
        setEtapa("roles");
        setEstadoLogin("normal");
      } else {
        setEstadoLogin("error");
      }
    } catch (erro) {
      console.error("Erro no login:", erro);
      setEstadoLogin("error");
    }
  };

  const handleContinuarComRole = () => {
    if (!roleSelecionada || !utilizadorValidado) return;
    extrairDadosEAvancar(utilizadorValidado, roleSelecionada);
  };

  const handleVoltar = () => {
    localStorage.removeItem('token_softinsa');
    localStorage.removeItem('utilizador_id');
    setEtapa("login");
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
              <h1 className="texto-titulo-principal login-page-titulo">{t("auth_login_titulo")}</h1>
              <p className="texto-auth-subtitulo login-page-descricao">{t("auth_login_subtitulo")}</p>
            </div>

            {passwordResetSuccess && (
              <div className="login-feedback login-feedback-sucesso">
                <i className="fi fi-br-check"></i>
                <span className="texto-auth-feedback">{t("auth_login_sucesso_password_reset")}</span>
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="login-form-grupo">
                <label className="texto-auth-label login-form-label">{t("auth_login_email")}</label>
                <input
                  className={`login-form-input ${estadoLogin === "error" ? "login-form-input-erro" : ""}`}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="login-form-grupo">
                <label className="texto-auth-label login-form-label">{t("auth_login_password")}</label>
                <div className="login-form-password-wrapper">
                  <input
                    className={`login-form-input login-form-input-password ${estadoLogin === "error" ? "login-form-input-erro" : ""}`}
                    type={mostrarPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="login-form-password-toggle texto-auth-link"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                  >
                    {mostrarPassword ? t("auth_login_password_ocultar") : t("auth_login_password_mostrar")}
                  </button>
                </div>
              </div>

              {estadoLogin === "error" && (
                <div className="login-feedback login-feedback-erro">
                  <i className="fi fi-br-info"></i>
                  <span className="texto-auth-feedback">{t("auth_login_erro")}</span>
                </div>
              )}

              <div className="login-form-acoes">
                <button type="submit" className="login-botao-principal" disabled={estadoLogin === "loading"}>
                  {estadoLogin === "loading" && <span className="login-botao-spinner" />}
                  <span>{estadoLogin === "loading" ? t("auth_login_loading") : t("auth_login_entrar")}</span>
                </button>
                <button
                  type="button"
                  className="login-link-secundario texto-auth-link"
                  onClick={() => navigate("/esqueci-password")}
                >
                  {t("auth_login_esqueci_password")}
                </button>
              </div>
            </form>
          </section>
        )}

        {etapa === "roles" && utilizadorValidado && roles && (
          <section className="login-page-card login-page-card-roles">
            <div className="login-page-cabecalho">
              <h1 className="texto-titulo-principal login-page-titulo">{t("auth_roles_titulo")}</h1>
              <p className="texto-auth-subtitulo login-page-descricao">{t("auth_roles_subtitulo")}</p>
            </div>
            <div className="login-roles-grid">
              {roles.map((role, index) => {
                const estaSelecionada = role === roleSelecionada;
                const nomeRole = role.tituloKey ? t(role.tituloKey) : (role.nome || role);

                // Como a BD já traz a classe completa ("fi fi-br-settings"), usamos DIRETAMENTE.
                // Colocamos o "fi fi-br-user" como fallback só para o caso de algum vir vazio.
                const classeIcone = role.icone_role || "fi fi-br-user";

                return (
                  <button
                    key={role.id || index}
                    type="button"
                    className={`login-role-card ${estaSelecionada ? "login-role-card-selecionado" : ""}`}
                    onClick={() => setRoleSelecionada(role)}
                  >
                    <span className="login-role-icone">
                      {/* Usamos a variável diretamente, sem adicionar mais nada! */}
                      <i className={classeIcone}></i>
                    </span>

                    <span className="login-role-texto">
                      <span className="texto-auth-role-titulo login-role-titulo">{nomeRole}</span>
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
              <button type="button" className="login-botao-secundario" onClick={handleVoltar}>{t("auth_roles_voltar")}</button>
              <button type="button" className="login-botao-principal" disabled={!roleSelecionada} onClick={handleContinuarComRole}>
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