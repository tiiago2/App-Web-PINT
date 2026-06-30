import softinsaLogo from "../../../assets/logotipo_softinsa.png";
import LanguageSelector from "../../ui/LanguageSelector/LanguageSelector.jsx";
import "./AuthTopBar.css";

function AuthTopBar() {
  return (
    <header className="auth-topbar">
      <div className="auth-topbar-logo-area">
        <img
          className="auth-topbar-logo"
          src={softinsaLogo}
          alt="Softinsa Logo"
        />
      </div>

      <div className="auth-topbar-direita">
        <LanguageSelector />
      </div>
    </header>
  );
}

export default AuthTopBar;