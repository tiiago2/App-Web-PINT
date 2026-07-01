import "./MetricasResumo.css";

function MetricasResumo({ metricas = [], className = "" }) {
    if (!metricas.length) {
        return null;
    }

    return (
        <div className={`metricas-resumo ${className}`}>
            {metricas.map((metrica, index) => (
                <article key={index} className="metricas-resumo-card">
                    <div>
                        <h3 className="metricas-resumo-titulo">
                            {metrica.titulo}
                        </h3>

                        <p className="metricas-resumo-valor">
                            {metrica.valor}
                        </p>
                    </div>

                    {metrica.icon && (
                        <i
                            className={`fi ${metrica.icon} metricas-resumo-icone`}
                            aria-hidden="true"
                        ></i>
                    )}
                </article>
            ))}
        </div>
    );
}

export default MetricasResumo;