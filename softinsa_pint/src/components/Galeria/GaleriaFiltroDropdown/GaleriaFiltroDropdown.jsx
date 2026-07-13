import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./GaleriaFiltroDropdown.css";

function GaleriaFiltroDropdown({
  valor = { tipo: "todos", valor: "", label: "Todos" },
  opcoes = {
    learningPath: [],
    serviceLine: [],
    area: [],
  },
  onChange,
}) {
  const { t } = useTranslation();
  const [aberto, setAberto] = useState(false);
  const [categoriaAberta, setCategoriaAberta] = useState(null);
  const dropdownRef = useRef(null);

  const categoriasFiltro = [
    {
      tipo: "learningPath",
      label: t("learning_path", "Learning Path"),
    },
    {
      tipo: "serviceLine",
      label: t("service_line", "Service Line"),
    },
    {
      tipo: "area",
      label: t("area", "Área"),
    },
  ];

  function obterTextoFiltro(valor) {
    if (!valor || valor.tipo === "todos") {
      return `${t("filtrar", "Filtrar")}: ${t("todos", "Todos")}`;
    }

    return `${t("filtrar", "Filtrar")}: ${valor.label || valor.valor}`;
  }

  useEffect(() => {
    function handleClickFora(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAberto(false);
        setCategoriaAberta(null);
      }
    }

    document.addEventListener("mousedown", handleClickFora);

    return () => {
      document.removeEventListener("mousedown", handleClickFora);
    };
  }, []);

  function selecionarTodos() {
    onChange({
      tipo: "todos",
      valor: "",
      label: "Todos",
    });

    setAberto(false);
    setCategoriaAberta(null);
  }

  function selecionarOpcao(tipo, opcao) {
    onChange({
      tipo,
      valor: opcao.valor,
      label: opcao.label,
    });

    setAberto(false);
    setCategoriaAberta(null);
  }

  function toggleCategoria(tipo) {
    setCategoriaAberta((categoriaAtual) =>
      categoriaAtual === tipo ? null : tipo
    );
  }

  return (
    <div className="galeria-filtro-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="galeria-filtro-dropdown-trigger texto-botoes-1"
        onClick={() => setAberto((valorAtual) => !valorAtual)}
      >
        <span className="galeria-filtro-dropdown-conteudo">
          <i className="fi fi-br-filter galeria-filtro-dropdown-icone"></i>

          <span className="galeria-filtro-dropdown-texto">
            {obterTextoFiltro(valor)}
          </span>
        </span>
      </button>

      {aberto && (
        <div className="galeria-filtro-dropdown-menu">
          <button
            type="button"
            className={`galeria-filtro-dropdown-opcao texto-botoes-1 ${
              !valor || valor.tipo === "todos" ? "ativa" : ""
            }`}
            onClick={selecionarTodos}
          >
            {t("todos")}
          </button>

          {categoriasFiltro.map((categoria) => {
            const opcoesCategoria = opcoes[categoria.tipo] || [];
            const categoriaEstaAtiva = valor?.tipo === categoria.tipo;
            const categoriaEstaAberta = categoriaAberta === categoria.tipo;

            return (
              <div
                className="galeria-filtro-dropdown-grupo"
                key={categoria.tipo}
              >
                <button
                  type="button"
                  className={`galeria-filtro-dropdown-opcao galeria-filtro-dropdown-categoria texto-botoes-1 ${
                    categoriaEstaAtiva ? "ativa" : ""
                  }`}
                  onClick={() => toggleCategoria(categoria.tipo)}
                >
                  <span>{categoria.label}</span>

                  <i
                    className={`fi fi-br-angle-small-down galeria-filtro-dropdown-seta ${
                      categoriaEstaAberta ? "aberta" : ""
                    }`}
                  ></i>
                </button>

                {categoriaEstaAberta && (
                  <div className="galeria-filtro-dropdown-submenu">
                    {opcoesCategoria.length > 0 ? (
                      opcoesCategoria.map((opcao) => (
                        <button
                          key={opcao.valor}
                          type="button"
                          className={`galeria-filtro-dropdown-subopcao texto-botoes-1 ${
                            valor?.tipo === categoria.tipo &&
                            valor?.valor === opcao.valor
                              ? "ativa"
                              : ""
                          }`}
                          onClick={() =>
                            selecionarOpcao(categoria.tipo, opcao)
                          }
                        >
                          {opcao.label}
                        </button>
                      ))
                    ) : (
                      <span className="galeria-filtro-dropdown-vazio">
                        {t("sem_opcoes")}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default GaleriaFiltroDropdown;