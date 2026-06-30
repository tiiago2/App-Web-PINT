import "./AuthArtPanel.css";

function AuthArtPanel() {
  return (
    <div className="auth-art-panel" aria-hidden="true">
      <svg
        className="auth-art-panel-svg"
        viewBox="0 0 480 760"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <circle
          className="auth-art-linha auth-art-opacidade-media"
          cx="380"
          cy="120"
          r="150"
        />

        <circle
          className="auth-art-linha auth-art-opacidade-baixa"
          cx="380"
          cy="120"
          r="100"
        />

        <circle
          className="auth-art-preenchimento-suave"
          cx="380"
          cy="120"
          r="55"
        />

        <g transform="translate(78 250)">
          <path
            className="auth-art-badge-forma"
            d="M60 0 L112 30 L112 90 L60 120 L8 90 L8 30 Z"
          />

          <circle
            className="auth-art-linha-destaque"
            cx="60"
            cy="56"
            r="22"
          />

          <path
            className="auth-art-check"
            d="M50 56 l7 7 l14 -16"
          />
        </g>

        <g transform="translate(300 470)">
          <rect
            className="auth-art-preenchimento-suave"
            x="0"
            y="80"
            width="26"
            height="60"
            rx="6"
          />

          <rect
            className="auth-art-preenchimento-suave"
            x="40"
            y="50"
            width="26"
            height="90"
            rx="6"
          />

          <rect
            className="auth-art-preenchimento-destaque"
            x="80"
            y="20"
            width="26"
            height="120"
            rx="6"
          />

          <rect
            className="auth-art-preenchimento-suave"
            x="120"
            y="0"
            width="26"
            height="140"
            rx="6"
          />
        </g>

        <path
          className="auth-art-linha-tracejada"
          d="M40 600 C 160 540, 300 660, 440 580"
        />

        <circle className="auth-art-ponto" cx="40" cy="600" r="6" />
        <circle className="auth-art-ponto" cx="440" cy="580" r="6" />

        <path
          className="auth-art-estrela"
          d="M120 140 l4 9 l10 1 l-7 7 l2 10 l-9 -5 l-9 5 l2 -10 l-7 -7 l10 -1 Z"
        />
      </svg>
    </div>
  );
}

export default AuthArtPanel;