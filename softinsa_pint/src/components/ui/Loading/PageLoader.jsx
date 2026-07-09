import React from "react";
import LoadingSpinner from "./LoadingSpinner";
import "./Loading.css";

export default function PageLoader({ texto = "A carregar..." }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <LoadingSpinner tamanho="lg" texto={texto} />
    </div>
  );
}
