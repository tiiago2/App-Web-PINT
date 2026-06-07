import { useState } from "react";
import "./BotaoDropdown.css";

function BotaoDropdown({ titulo, valor, opcoes, onChange, icone,
    mostrarValor = true, mostrarSeta = true, mostrarTituloNoValor = true, abrirParaCima = false}) {
  const [aberto, setAberto] = useState(false);

  const opcaoSelecionada = opcoes.find((opcao) => opcao.valor === valor);

  const textoBotao = opcaoSelecionada
    ? (mostrarTituloNoValor && titulo ? `${titulo}: ${opcaoSelecionada.label}` : opcaoSelecionada.label)
    : titulo;

  function selecionarOpcao(novoValor) {
    onChange(novoValor);
    setAberto(false);
  }

  return (
    <div className="botao-dropdown">
      <button
        type="button"
        className="botao-dropdown-trigger texto-botoes-1"
        onClick={() => setAberto(!aberto)}
      >
        <span className="botao-dropdown-conteudo">
        {icone && <i className={`${icone} botao-dropdown-icone`}></i>}
        <span className="botao-dropdown-texto">{textoBotao}</span>
        </span>
        {mostrarSeta && (
            <i className="fi fi-br-angle-small-down botao-dropdown-seta"></i>
        )}
      </button>

      {aberto && (
        <div className={`botao-dropdown-menu ${abrirParaCima ? "para-cima" : ""}`}>
          {opcoes.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              className={`botao-dropdown-opcao texto-botoes-1 ${
                valor === opcao.valor ? "ativa" : ""
              }`}
              onClick={() => selecionarOpcao(opcao.valor)}
            >
              {opcao.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default BotaoDropdown;