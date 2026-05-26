import { useState } from "react";
import "./GaleriaConsultor.css";

function GaleriaConsultor() {
  const [abaAtiva, setAbaAtiva] = useState("sugeridos");

  return (
    <main className="galeria-consultor-page">
      <div className="galeria-consultor-header">
        <h1>Galeria de Badges</h1>
      </div>

      <section className="galeria-main-tabs">
        <button
          className={`galeria-main-tab ${
            abaAtiva === "sugeridos" ? "ativa" : ""
          }`}
          onClick={() => setAbaAtiva("sugeridos")}
        >
          Sugeridos
        </button>

        <button
          className={`galeria-main-tab ${
            abaAtiva === "todos" ? "ativa" : ""
          }`}
          onClick={() => setAbaAtiva("todos")}
        >
          Todos os Badges
        </button>
      </section>
    </main>
  );
}

export default GaleriaConsultor;