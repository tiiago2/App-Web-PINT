import React from 'react';
import { useParams } from 'react-router-dom';
import '../../App.css'; // Importa estilos globais (onde está texto-titulo-principal)
import './Perfil.css'; // Importa o CSS (certifica-te que o nome do ficheiro corresponde)

const PerfilPessoal = () => {
  const { id } = useParams();
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="p-3 p-md-4 flex-shrink-0 texto-titulo-principal">
            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0' }}>perfil_pessoal</h1>
        </div>
        
        <div style={{ flex: '1 1 auto', overflow: 'auto', paddingLeft: '1rem', paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} classname="d-flex flex-column">
            <div className="info-column">
              <h2 className="section-title">Informação Pessoal</h2>
              <div className="info-content">
                <div className="avatar-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div className="info-details">
                  <p><strong>Pontos:</strong> 14 600</p>
                  <p><strong>Nome:</strong> Tiago Lourenço</p>
                  <p><strong>Email:</strong> tiagolourenco@gmail.com</p>
                  <p><strong>Telefone:</strong> +351 999 999 999</p>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Assinatura Pessoal */}
            <div className="signature-column">
              <div className="section-title">
                <h2>Assinatura Pessoal</h2>
                {/* Ícone de Lápis */}
                <svg style={{ width: '18px', cursor: 'pointer', color: '#475569' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
              </div>
              <div className="signature-card">
                <div className="signature-text">
                  <span>Tiago Lourenço</span> | <span>Talent Manager</span><br />
                  <span>tiagolourenco@gmail.com</span> | <span>+351 999 999 999</span>
                </div>
                <div className="badges-row">
                  <div className="icon-circle bg-green">
                    <svg viewBox="0 0 24 24" fill="#4d7c0f">
                      <path d="M9 9h6v6H9z" /><path d="M22 11h-2V9a2 2 0 0 0-2-2h-2V5h-2v2h-2V5H9v2H7a2 2 0 0 0-2 2v2H3v2h2v2a2 2 0 0 0 2 2h2v2h2v-2h2v2h2v-2h2a2 2 0 0 0 2-2v-2h2v-2zM18 15a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6z" />
                    </svg>
                  </div>
                  <div className="icon-circle bg-yellow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#a16207" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                  </div>
                  <div className="icon-circle bg-red">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2">
                      <path d="M8 21h8M12 17v4M7 4h10M17 4v8a5 5 0 0 1-10 0V4" />
                      <path d="M4 9h3M17 9h3" />
                    </svg>
                  </div>
                  <div className="icon-circle bg-blue">
                    <svg viewBox="0 0 24 24" fill="#1d4ed8">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
        </div>

        <div style={{ flex: '1 1 auto', overflow: 'auto', paddingLeft: '1rem', paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h1>retangulo baixo</h1>
        </div>
    </div>
  );
};

export default PerfilPessoal;