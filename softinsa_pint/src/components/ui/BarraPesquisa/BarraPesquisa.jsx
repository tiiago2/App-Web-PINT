import "./BarraPesquisa.css";

function BarraPesquisa({ valor, onChange, placeholder = "Pesquisar..." }) {
  return (
    <div className="barra-pesquisa">
      <i className="fi fi-br-search barra-pesquisa-icone"></i>

      <input
        type="text"
        className="barra-pesquisa-input texto-botoes-1"
        value={valor}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export default BarraPesquisa;