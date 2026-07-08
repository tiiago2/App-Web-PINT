import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api.js";
import AuthTopBar from "../../components/Auth/AuthTopBar/AuthTopBar.jsx";
import AuthArtPanel from "../../components/Auth/AuthArtPanel/AuthArtPanel.jsx";
import RgpdModal from "../../components/ui/RgpdModal/RgpdModal.jsx";
import "./EsqueciPasswordPage.css";

function PrimeiroAcessoPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmPassword, setMostrarConfirmPassword] = useState(false);
  const [estado, setEstado] = useState("normal");
  const [mensagemErro, setMensagemErro] = useState("");
  const [aceitouPoliticas, setAceitouPoliticas] = useState(false);
  const [mostrarModalRgpd, setMostrarModalRgpd] = useState(false);

  useEffect(() => {
    // Se o email veio através do state de navegação do Login, preenche automaticamente
    if (location.state && location.state.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const validarPassword = (valor) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#^~_\-+=])[A-Za-z\d@$!%*?&.#^~_\-+=]{8,}$/;
    return regex.test(valor);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setEstado("loading");
    setMensagemErro("");

    if (!email.trim()) {
      setMensagemErro(t("auth_esqueci_erro_email_obrigatorio"));
      setEstado("error");
      return;
    }

    if (!validarPassword(password)) {
      setMensagemErro(t("auth_esqueci_erro_password_requisitos"));
      setEstado("error");
      return;
    }

    if (password !== confirmPassword) {
      setMensagemErro(t("auth_esqueci_erro_password_diferente"));
      setEstado("error");
      return;
    }

    if (!aceitouPoliticas) {
      setMensagemErro(t("primeiro_acesso_erro_aceitar"));
      setEstado("error");
      return;
    }

    try {
      await api.post("/primeiro-acesso", { email, password, confirmPassword });
      // Após definir com sucesso, limpa credenciais temporárias e navega para o login
      localStorage.removeItem("token_softinsa");
      localStorage.removeItem("utilizador");
      navigate("/login", { state: { primeiroAcessoSuccess: true } });
    } catch (erro) {
      console.error("Erro no primeiro acesso:", erro);
      const msg = erro.response?.data?.error || t("auth_esqueci_erro_generico");
      setMensagemErro(msg);
      setEstado("error");
    }
  };

  return (
    <div className="login-page">
      <AuthTopBar />
      <AuthArtPanel />
      <main className="login-page-conteudo">
        <section className="login-page-card">
          <div className="login-page-cabecalho">
            <h1 className="texto-titulo-principal login-page-titulo">{t("auth_primeiro_titulo")}</h1>
            <p className="texto-auth-subtitulo login-page-descricao">{t("auth_primeiro_subtitulo")}</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-form-grupo">
              <label className="texto-auth-label login-form-label">{t("auth_esqueci_email")}</label>
              <input
                className={`login-form-input ${estado === "error" ? "login-form-input-erro" : ""}`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="login-form-grupo">
              <label className="texto-auth-label login-form-label">{t("auth_esqueci_password")}</label>
              <div className="login-form-password-wrapper">
                <input
                  className={`login-form-input login-form-input-password ${estado === "error" ? "login-form-input-erro" : ""}`}
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

            <div className="login-form-grupo">
              <label className="texto-auth-label login-form-label">{t("auth_esqueci_confirmar_password")}</label>
              <div className="login-form-password-wrapper">
                <input
                  className={`login-form-input login-form-input-password ${estado === "error" ? "login-form-input-erro" : ""}`}
                  type={mostrarConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="login-form-password-toggle texto-auth-link"
                  onClick={() => setMostrarConfirmPassword(!mostrarConfirmPassword)}
                >
                  {mostrarConfirmPassword ? t("auth_login_password_ocultar") : t("auth_login_password_mostrar")}
                </button>
              </div>
            </div>

            <div className="login-form-grupo primeiro-acesso-checkbox-rgpd">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="aceitar-rgpd"
                  checked={aceitouPoliticas}
                  onChange={(e) => setAceitouPoliticas(e.target.checked)}
                />
                <label className="form-check-label texto-auth-label" htmlFor="aceitar-rgpd">
                  {t("primeiro_acesso_aceitar_politicas")}{" "}
                  <button
                    type="button"
                    className="primeiro-acesso-link-rgpd"
                    onClick={() => setMostrarModalRgpd(true)}
                  >
                    {t("primeiro_acesso_ver_politicas")}
                  </button>
                </label>
              </div>
            </div>

            {estado === "error" && (
              <div className="login-feedback login-feedback-erro">
                <i className="fi fi-br-info"></i>
                <span className="texto-auth-feedback">{mensagemErro}</span>
              </div>
            )}

            <div className="login-form-acoes">
              <button type="submit" className="login-botao-principal" disabled={estado === "loading"}>
                {estado === "loading" && <span className="login-botao-spinner" />}
                <span>{estado === "loading" ? t("auth_primeiro_loading") : t("auth_primeiro_definir")}</span>
              </button>
              <button
                type="button"
                className="login-link-secundario texto-auth-link"
                onClick={() => {
                  localStorage.removeItem("token_softinsa");
                  localStorage.removeItem("utilizador");
                  navigate("/login");
                }}
              >
                {t("auth_esqueci_voltar_login")}
              </button>
            </div>
          </form>
        </section>
      </main>

      <RgpdModal
        isOpen={mostrarModalRgpd}
        onAceitar={() => {
          setAceitouPoliticas(true);
          setMostrarModalRgpd(false);
        }}
        onRecusar={() => setMostrarModalRgpd(false)}
      />
    </div>
  );
}

export default PrimeiroAcessoPage;
