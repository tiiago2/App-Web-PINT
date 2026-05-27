import "./SeletorAbas_Galeria.css";

function SeletorAbas({ opcoes, valorAtivo, onChange }) {
  return (
    <div className="seletor-abas">
      {opcoes.map((opcao) => {
        const estaAtivo = valorAtivo === opcao.valor;

        return (
          <button
            key={opcao.valor}
            type="button"
            className={`seletor-abas-botao ${
              estaAtivo ? "ativo texto-botoes-1-ativo" : "texto-botoes-1"
            }`}
            onClick={() => onChange(opcao.valor)}
          >
            {opcao.label}
          </button>
        );
      })}
    </div>
  );
}

export default SeletorAbas;