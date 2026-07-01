import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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

  const renderBadge = (badge) => {
    const nomeBadge = badge.nome || badge.nomeBadge;
    const icone = badge.icon || badge.icone;
    const imagemBadge = badge.imagem || badge.imagemBadge;
    const especial = badge.especial;
    const tipoEspecial = badge.tipoEspecial;

    return (
      <button
        key={badge.id}
        type="button"
        className="badge-item"
        onClick={() => onEdit && onEdit(badge)}
        aria-label={`Editar badge ${nomeBadge}`}
      >
        <div className="badge-item-visual">
          <BadgeCirculo 
            icone={icone}
            nomeBadge={nomeBadge}
            imagemBadge={imagemBadge}
            corBg={badge.cor}
            especial={especial}
            tipoEspecial={tipoEspecial}
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
        <span className="texto-nome-badge badge-item-nome">{nomeBadge}</span>
      </button>
    );
  };

  return (
    <div className="d-flex flex-column flex-grow-1" style={{ minHeight: '400px' }}>     
      <div className="d-flex flex-column gap-4 flex-grow-1 overflow-auto pb-4 pe-2" style={{ overflowX: 'hidden' }}>
        
        {badgesEspeciais.length > 0 && (
          <BadgeSeccao titulo={t("badges_especiais")} tipo="gold" icone="fi-br-badge">
            {badgesEspeciais.map(renderBadge)}
          </BadgeSeccao>
        )}

        <BadgeSeccao titulo={t("outros_badges")} tipo="azul">
          {badgesNormais.map(renderBadge)}
        </BadgeSeccao>

      </div>

      <ModalConfirmacao 
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteConfirm}
        titulo={t("eliminar_badge_confirm")}
        mensagem={t("confirmar_eliminar_badge", { nome: itemToDelete?.nome })}
        textoConfirmar={t("eliminar")}
      />
    </div>
  );
}
