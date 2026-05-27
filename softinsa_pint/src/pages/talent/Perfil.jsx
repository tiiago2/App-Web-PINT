import React from 'react';
import { useParams } from 'react-router-dom';
import './Perfil.css'; // Importa o CSS (certifica-te que o nome do ficheiro corresponde)

const PerfilPessoal = () => {
  const { id } = useParams();
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="p-3 p-md-4 flex-shrink-0 texto-titulo-principal">
            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0' }}>perfil_pessoal</h1>
        </div>
        
        <div style={{ flex: '1 1 auto', overflow: 'auto', paddingLeft: '1rem', paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h1>retangulo cima</h1>
        </div>

        <div className="row g-2 g-md-3" style={{ flex: '1 1 auto', overflow: 'auto', paddingLeft: '1rem', paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h1>retangulo baixo</h1>
        </div>
    </div>
  );
};

export default PerfilPessoal;