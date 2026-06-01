import React from 'react';
import './TabsAdmin.css';

export function TabsAdmin({ abas, abaAtiva, setAbaAtiva }) {
  return (
    <div className="tabs-admin-container">
      {abas.map((aba) => (
        <button
          key={aba.id}
          className={`tab-admin-btn ${abaAtiva === aba.id ? 'active' : ''}`}
          onClick={() => setAbaAtiva(aba.id)}
        >
          {aba.label}
        </button>
      ))}
    </div>
  );
}
