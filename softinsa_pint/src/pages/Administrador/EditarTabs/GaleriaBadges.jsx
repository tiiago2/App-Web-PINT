import React from 'react';
import BadgeCirculo from '../../../components/Galeria/BadgeCirculo/BadgeCirculo';

export default function GaleriaBadges({ 
  mockBadges, 
  searchTerm,
  onAdd,
  onEdit,
  onDelete
}) {
  const filtrados = mockBadges.filter(b => b.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="d-flex flex-column flex-grow-1" style={{ minHeight: '400px' }}>
      <h4 className="fw-semibold mb-3 flex-shrink-0" style={{ color: 'var(--fontes)' }}>Todos:</h4>
      
      <div className="table-wrapper shadow-sm flex-grow-1">
        <div className="table-scrollable p-3">
          <div className="badge-gallery-grid" style={{ padding: 0 }}>
            {/* Botão Criar Badge */}
            <div className="badge-item-wrapper" onClick={onAdd} style={{ cursor: 'pointer' }}>
              <div className="badge-circle create-badge">
                <i className="fi fi-br-plus"></i>
              </div>
              <div className="badge-name">Criar Badge</div>
              <div className="badge-category">Adicionar novo</div>
            </div>

            {/* Lista de Todos os Badges */}
            {filtrados.map(badge => (
              <div key={badge.id} className="badge-item-wrapper">
                <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => onEdit && onEdit(badge)}>
                  <BadgeCirculo 
                    icone={badge.icon}
                    nomeBadge={badge.nome}
                    imagemBadge={badge.imagem}
                    corBg={badge.cor}
                    estado="desbloqueados"
                  />
                  <div 
                    className="badge-delete-btn" 
                    title="Eliminar Badge"
                    onClick={(e) => {
                      e.stopPropagation(); // Impede que abra o modal de edição ao eliminar
                      if (onDelete) onDelete(badge.id);
                    }}
                    style={{ zIndex: 10 }}
                  >
                    <i className="fi fi-br-trash"></i>
                  </div>
                </div>
                <div className="badge-name">{badge.nome}</div>
                <div className="badge-category">{badge.categoria}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
