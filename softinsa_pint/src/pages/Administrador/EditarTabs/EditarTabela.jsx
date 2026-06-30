import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [itemToDelete, setItemToDelete] = useState(null);
  
  const filtrados = dados.filter(item => item.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleDeleteConfirm = () => {
    if (itemToDelete && onDelete) {
      onDelete(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  const getAbaNomeKey = (nome) => {
    return (nome || "").toLowerCase().replace(" ", "_");
  };

  return (
    <div className="d-flex flex-column flex-grow-1" style={{ minHeight: '400px' }}>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-shrink-0">
        <h4 className="fw-semibold mb-0" style={{ color: 'var(--fontes)' }}>{t("todos_tabela_label")}</h4>
        <button 
          className="btn px-4 text-white shadow-sm d-flex align-items-center gap-2 fw-semibold" 
          style={{ 
            backgroundColor: 'var(--barra_lateral)',
            borderRadius: 'var(--border-radius-pequeno)'
          }}
          onClick={onAdd}
        >
          <i className="fi fi-br-plus"></i> {t("adicionar_item", { nome: t(getAbaNomeKey(abaNome)) })}
        </button>
      </div>

      <div className="table-wrapper shadow-sm flex-grow-1">
        <div className="table-scrollable">
          <table className="table table-hover text-center align-middle mb-0">
            <thead>
              <tr>
                <th className="text-start ps-4">{t("nome_com_parentesis", { nome: t(getAbaNomeKey(abaNome)) })}</th>
                {colunas.map((col, idx) => (
                  <th key={idx}>{col}</th>
                ))}
                <th>{t("acoes")}</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length > 0 ? filtrados.map((item) => (
                <tr key={item.id}>
                  <td className="text-start ps-4 fw-semibold" style={{ color: 'var(--fontes)' }}>
                    {item.icon || item.imagem ? (
                      <div className="d-inline-block align-middle me-2" style={{ width: '32px', height: '32px' }}>
                        <BadgeCirculo 
                          icone={item.icon} 
                          nomeBadge={item.nome} 
                          imagemBadge={item.imagem} 
                          corBg={item.cor} 
                          estado="desbloqueados"
                          especial={item.especial}
                          tipoEspecial={item.tipoEspecial}
                        />
                      </div>
                    ) : null}
                    <span className="align-middle">{item.nome}</span>
                  </td>
                  
                  {colunas.includes("Requisito") || colunas.includes("Requirement") || colunas.includes("Requisito (Es)") ? (
                    <td>{item.requisito || "-"}</td>
                  ) : null}
                  {colunas.includes("Learning Path") || colunas.includes("Trayectoria de Aprendizaje") ? (
                    <td>{item.learningPath || "-"}</td>
                  ) : null}
                  {colunas.includes("Service Line") || colunas.includes("Línea de Servicio") ? (
                    <td>{item.serviceLine || "-"}</td>
                  ) : null}
                  {colunas.includes("Área") || colunas.includes("Area") ? (
                    <td>{item.nomeArea || item.categoria || item.area || "-"}</td>
                  ) : null}

                  <td>
                    <button 
                      className="action-btn me-2" 
                      title="Editar"
                      onClick={() => onEdit && onEdit(item)}
                    >
                      <i className="fi fi-br-pencil"></i>
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
                    {t("nenhum_registo_pesquisa")}
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
        titulo={t("eliminar_item", { nome: t(getAbaNomeKey(abaNome)) })}
        mensagem={t("confirmar_eliminar_item_msg", { nome: itemToDelete?.nome || itemToDelete?.nomeArea || itemToDelete?.nomeServiceLine || itemToDelete?.nomeLearningPath })}
        textoConfirmar={t("eliminar")}
      />
    </div>
  );
}
