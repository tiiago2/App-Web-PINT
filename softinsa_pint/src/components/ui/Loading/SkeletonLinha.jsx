import React from "react";
import "./Loading.css";

export default function SkeletonLinha({ largura = "100%", altura = "1rem", classeAdicional = "" }) {
  return (
    <div
      className={`skeleton skeleton-linha ${classeAdicional}`}
      style={{ width: largura, height: altura }}
    />
  );
}
