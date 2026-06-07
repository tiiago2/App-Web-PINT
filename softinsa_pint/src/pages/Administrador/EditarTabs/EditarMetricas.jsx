import React from 'react';

export default function EditarMetricas({ metricas }) {
  // O parâmetro 'metricas' agora deve ser um array de objetos:
  // [{ titulo: "...", valor: 10, icon: "fi-br-road" }, ...]

  return (
    <div className="row g-3 mb-4">
      {metricas.map((metrica, idx) => (
        <div key={idx} className="col-md-4">
          <div className="p-3 border border-2 rounded-4 bg-white shadow-sm d-flex justify-content-between align-items-center h-100">
            <div>
              <h6 className="text-muted fw-semibold mb-1" style={{ fontSize: '0.85rem' }}>{metrica.titulo}</h6>
              <div className="fw-bold" style={{ fontSize: '2rem', color: 'var(--fontes)', lineHeight: '1' }}>{metrica.valor}</div>
            </div>
            <div className="text-muted fs-1 opacity-50">
              <i className={`fi ${metrica.icon}`}></i>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
