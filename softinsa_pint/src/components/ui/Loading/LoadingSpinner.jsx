import React from "react";
import "./Loading.css";

export default function LoadingSpinner({
  tamanho = "md",
  texto = "",
  centralizado = false,
  className = "",
}) {
  const tamanhos = {
    sm: "loading-spinner-sm",
    md: "loading-spinner-md",
    lg: "loading-spinner-lg",
  };

  const spinner = (
    <span
      className={`loading-spinner ${tamanhos[tamanho] || tamanhos.md} ${className}`}
      role="status"
      aria-hidden="true"
    />
  );

  if (!texto && !centralizado) return spinner;

  return (
    <div className={`loading-wrapper ${centralizado ? "loading-wrapper-centralizado" : ""}`}>
      {spinner}
      {texto && <span className="loading-texto">{texto}</span>}
    </div>
  );
}
