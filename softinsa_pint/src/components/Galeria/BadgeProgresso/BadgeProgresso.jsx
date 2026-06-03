import "./BadgeProgresso.css";

function BadgeProgresso({ progresso = 0 }) {
  const progressoSeguro = Math.max(0, Math.min(100, Number(progresso) || 0));

  return (
    <div
      className="badge-progresso"
      role="progressbar"
      aria-valuenow={progressoSeguro}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="badge-progresso-preenchimento"
        style={{ width: `${progressoSeguro}%` }}
      />
    </div>
  );
}

export default BadgeProgresso;