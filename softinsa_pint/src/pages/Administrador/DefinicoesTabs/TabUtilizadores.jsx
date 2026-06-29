import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import BotaoDropdown from "../../../components/ui/BotaoDropdown/BotaoDropdown";
import ToggleSwitch from "../../../components/ui/ToggleSwitch/ToggleSwitch";

export default function TabUtilizadores() {
  const { t } = useTranslation();

  const [roleSelecionada, setRoleSelecionada] = useState("");
  const [permissoesAtivas, setPermissoesAtivas] = useState({});

  const roles = ["consultor", "talent", "service"];

  const checkboxesPermissoes = {
    consultor: [
      {
        id: "cons_2",
        label: "Upload de Evidências",
        desc: "Habilita a submissão de documentação comprobatória para candidaturas a badges.",
      },
      {
        id: "cons_3",
        label: "Partilha Externa (LinkedIn)",
        desc: "Autoriza a integração e partilha pública de certificações no LinkedIn, em conformidade com o RGPD.",
      },
      {
        id: "cons_4",
        label: "Download de PDFs",
        desc: "Disponibiliza a funcionalidade de extração de certificados em formato PDF.",
      },
    ],
    talent: [
      {
        id: "tal_1",
        label: "Validar Evidências",
        desc: "Garante acesso para análise e validação documental das candidaturas submetidas.",
      },
      {
        id: "tal_3",
        label: "Exportação de Dados",
        desc: "Autoriza a extração e exportação de relatórios gerenciais e dados globais do sistema.",
      },
    ],
    service: [
      {
        id: "serv_1",
        label: "Validação Final",
        desc: "Atribui competência para a emissão do parecer final (Aprovação, Rejeição ou Send Back) no fluxo de atribuição.",
      },
      {
        id: "serv_3",
        label: "Gerar Relatórios de Área",
        desc: "Habilita a geração de relatórios segmentados e estatísticas operacionais específicas da sua área.",
      },
    ],
  };

  const togglePermissao = (id) => {
    setPermissoesAtivas((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <>
      <h3 className="section-title">{t("niveis_permissoes")}</h3>
      <p className="section-subtitle">{t("gerir_roles")}</p>

      <div className="mt-4">
        <label className="form-label fw-medium mb-2">
          Selecionar Tipo de Utilizador
        </label>
        <div style={{ maxWidth: "300px" }}>
          <BotaoDropdown
            titulo="Selecione uma opção"
            valor={roleSelecionada}
            opcoes={roles.map((op) => ({ valor: op, label: t(op) }))}
            onChange={setRoleSelecionada}
          />
        </div>
      </div>

      {roleSelecionada && (
        <div className="mt-4 p-4 border border-2 rounded-4 bg-light shadow-sm">
          <h5
            className="mb-4 fw-semibold"
            style={{ color: "var(--fontes)" }}
          >
            Permissões para {t(roleSelecionada)}
          </h5>

          <div className="d-flex flex-column gap-3">
            {checkboxesPermissoes[roleSelecionada]?.map((permissao) => (
              <div
                key={permissao.id}
                className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border"
              >
                <div className="pe-3">
                  <label
                    className="form-check-label fw-semibold mb-1"
                    htmlFor={permissao.id}
                  >
                    {permissao.label}
                  </label>
                  <p
                    className="text-muted mb-0"
                    style={{ fontSize: "0.85rem" }}
                  >
                    {permissao.desc}
                  </p>
                </div>
                <div className="mb-0">
                  <ToggleSwitch
                    checked={permissoesAtivas[permissao.id] || false}
                    onChange={() => togglePermissao(permissao.id)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-end">
            <button
              className="btn px-4 rounded-pill text-white"
              style={{
                backgroundColor: "var(--barra_lateral)",
                border: "none",
              }}
            >
              <i className="fi fi-br-disk me-2"></i> Guardar Alterações
            </button>
          </div>
        </div>
      )}
    </>
  );
}
