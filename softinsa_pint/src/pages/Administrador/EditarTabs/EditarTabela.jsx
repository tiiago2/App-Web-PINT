import React, { useState } from 'react';
import ModalConfirmacao from '../../../components/ui/ModalConfirmacao/ModalConfirmacao';
import BadgeCirculo from '../../../components/Galeria/BadgeCirculo/BadgeCirculo';

export default function EditarTabela({ 
  abaNome, 
  dados, 
  searchTerm, 
  colunas,
  onAdd,
  onEdit,
  onDelete
}) {
  const [itemToDelete, setItemToDelete] = useState(null);
  
  const filtrados = dados.filter(item => item.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleDeleteConfirm = () => {
    if (itemToDelete && onDelete) {
      onDelete(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  return (
    <div className="d-flex flex-column flex-grow-1" style={{ minHeight: '400px' }}>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-shrink-0">
        <h4 className="fw-semibold mb-0" style={{ color: 'var(--fontes)' }}>Todos:</h4>
        <button 
          className="btn rounded-pill px-4 text-white shadow-sm d-flex align-items-center gap-2" 
          style={{ backgroundColor: 'var(--barra_lateral)' }}
          onClick={onAdd}
        >
          <i className="fi fi-br-plus"></i> Adicionar {abaNome}
        </button>
      </div>

      <div className="table-wrapper shadow-sm flex-grow-1">
        <div className="table-scrollable">
          <table className="table table-hover text-center align-middle mb-0">
            <thead>
              <tr>
                <th className="text-start ps-4">Nome ({abaNome})</th>
                {colunas.map((col, idx) => (
                  <th key={idx}>{col}</th>
                ))}
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length > 0 ? filtrados.map((item) => (
                <tr key={item.id}>
                  <td className="text-start ps-4 fw-medium text-dark">
                    {abaNome === "Badge" ? (
                      <div className="d-flex align-items-center gap-3">
                        <div style={{ transform: "scale(0.55)", transformOrigin: "left center", minWidth: "55px", height: "45px", display: "flex", alignItems: "center" }}>
                          <BadgeCirculo 
                            icone={item.icon || "fi-br-badge"}
                            nomeBadge={item.nome}
                            imagemBadge={item.imagem}
                            corBg={item.cor}
                            especial={item.especial}
                            tipoEspecial={item.tipoEspecial}
                            estado="desbloqueados"
                          />
                        </div>
                        <span style={{ marginLeft: "-5px" }}>{item.nome}</span>
                      </div>
                    ) : (
                      item.nome
                    )}
                  </td>
                  
                  {/* Para a aba de Badges que passa a coluna "Categoria" */}
                  {colunas.includes("Categoria") && <td>{item.categoria}</td>}
                  {colunas.includes("Service Lines") && <td>{item.servicelines}</td>}
                  {colunas.includes("Badges") && <td>{item.badges}</td>}
                  {colunas.includes("Nº Elementos") && <td>{item.elementos}</td>}
                  {colunas.includes("Elementos") && <td>{item.elementos}</td>}
                  {colunas.includes("Área") && <td>{item.area}</td>}
                  {colunas.includes("Responsavel") && <td>{item.responsavel}</td>}

                  <td>
                    <button 
                      className="action-btn me-2" 
                      title="Editar"
                      onClick={() => onEdit && onEdit(item)}
                    >
                      <i className="fi fi-br-edit"></i>
                    </button>
                    <button 
                      className="action-btn action-btn-danger" 
                      title="Eliminar"
                      onClick={() => setItemToDelete(item)}
                    >
                      <i className="fi fi-br-trash"></i>
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={colunas.length + 2} className="text-muted py-5">
                    Nenhum registo encontrado para a tua pesquisa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ModalConfirmacao 
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteConfirm}
        titulo={`Eliminar ${abaNome}`}
        mensagem={`Tem a certeza que deseja eliminar "${itemToDelete?.nome}"? Esta ação não pode ser desfeita.`}
        textoConfirmar="Eliminar"
      />
    </div>
  );
}
