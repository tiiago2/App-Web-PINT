import React from "react";
import SkeletonLinha from "./SkeletonLinha";
import "./Loading.css";

export default function SkeletonTabela({ linhas = 5, colunas = 4, className = "" }) {
  return (
    <div className={`skeleton-tabela ${className}`}>
      <div className="skeleton-tabela-cabecalho">
        {Array.from({ length: colunas }).map((_, i) => (
          <SkeletonLinha key={`head-${i}`} largura="80%" altura="1rem" />
        ))}
      </div>
      {Array.from({ length: linhas }).map((_, linhaIndex) => (
        <div key={`row-${linhaIndex}`} className="skeleton-tabela-linha">
          {Array.from({ length: colunas }).map((_, colIndex) => (
            <SkeletonLinha
              key={`cell-${linhaIndex}-${colIndex}`}
              largura={colIndex === 0 ? "60%" : "80%"}
              altura="0.875rem"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
