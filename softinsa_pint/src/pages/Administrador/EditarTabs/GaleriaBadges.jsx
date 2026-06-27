import React, { useState } from 'react';
import BadgeCirculo from '../../../components/Galeria/BadgeCirculo/BadgeCirculo';
import BadgeSeccao from '../../../components/Galeria/BadgeSeccao/BadgeSeccao';
import ModalConfirmacao from '../../../components/ui/ModalConfirmacao/ModalConfirmacao';

export default function GaleriaBadges({ 
  mockBadges, 
  searchTerm,
  onAdd,
  onEdit,
  onDelete
}) {
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleDeleteConfirm = () => {
    if (itemToDelete && onDelete) {
      onDelete(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  const filtrados = mockBadges.filter(b => b.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  const badgesEspeciais = filtrados.filter(b => b.especial);
  const badgesNormais = filtrados.filter(b => !b.especial);

  const renderBadge = (badge) => (
    <div key={badge.id} className="badge-item-wrapper">
      <div style={{ position: 'relative', cursor: 'pointer', marginBottom: 'var(--espaco-circulo-nome-badge)' }} onClick={() => onEdit && onEdit(badge)}>
        <BadgeCirculo 
          icone={badge.icon}
          nomeBadge={badge.nome}
          imagemBadge={badge.imagem}
          corBg={badge.cor}
          especial={badge.especial}
          tipoEspecial={badge.tipoEspecial}
          estado="desbloqueados"
        />
        <div 
          className="badge-delete-btn" 
          title="Eliminar Badge"
          onClick={(e) => {
            e.stopPropagation();
            setItemToDelete(badge);
          }}
          style={{ zIndex: 10 }}
        >
          <i className="fi fi-br-trash"></i>
        </div>
      </div>
      <div className="badge-name">{badge.nome}</div>
      <div className="badge-category">{badge.categoria}</div>
    </div>
  );

  return (
    <div className="d-flex flex-column flex-grow-1" style={{ minHeight: '400px' }}>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-shrink-0">
        <h4 className="fw-semibold mb-0" style={{ color: 'var(--fontes)' }}>Galeria:</h4>
        <button 
          className="btn rounded-pill px-4 text-white shadow-sm d-flex align-items-center gap-2" 
          style={{ backgroundColor: 'var(--barra_lateral)' }}
          onClick={onAdd}
        >
          <i className="fi fi-br-plus"></i> Adicionar Badge
        </button>
      </div>
      
      <div className="d-flex flex-column gap-4 flex-grow-1 overflow-auto pb-4 pe-2" style={{ overflowX: 'hidden' }}>
        
        {badgesEspeciais.length > 0 && (
          <BadgeSeccao titulo="BADGES ESPECIAIS" tipo="gold" icone="fi-br-star">
            {badgesEspeciais.map(renderBadge)}
          </BadgeSeccao>
        )}

        <BadgeSeccao titulo="OUTROS BADGES" tipo="azul">
          {badgesNormais.map(renderBadge)}
        </BadgeSeccao>

      </div>

      <ModalConfirmacao 
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteConfirm}
        titulo="Eliminar Badge"
        mensagem={`Tem a certeza que deseja eliminar "${itemToDelete?.nome}"? Esta ação não pode ser desfeita.`}
        textoConfirmar="Eliminar"
      />
    </div>
  );
}
