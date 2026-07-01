import "./BotaoAcao.css";

function BotaoAcao({
  children,
  icone,
  variante = "primario",
  type = "button",
  onClick,
  className = "",
}) {
  return (
    <button
      type={type}
      className={`botao-acao botao-acao--${variante} ${className}`}
      onClick={onClick}
    >
      {icone && <i className={`fi ${icone} botao-acao-icone`}></i>}
      <span>{children}</span>
    </button>
  );
}

export default BotaoAcao;