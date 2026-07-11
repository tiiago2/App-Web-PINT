import React from "react";
import SkeletonLinha from "./SkeletonLinha";
import "./Loading.css";

export default function SkeletonCard({ linhas = 3, temImagem = true, className = "" }) {
  return (
    <div className={`skeleton-card ${className}`}>
      {temImagem && <div className="skeleton skeleton-imagem" />}
      <div className="skeleton-card-conteudo">
        {Array.from({ length: linhas }).map((_, i) => (
          <SkeletonLinha
            key={i}
            largura={i === 0 ? "70%" : i === linhas - 1 ? "45%" : "100%"}
          />
        ))}
      </div>
    </div>
  );
}
