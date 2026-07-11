import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import BotaoDropdown from "../../../components/ui/BotaoDropdown/BotaoDropdown";
import ToggleSwitch from "../../../components/ui/ToggleSwitch/ToggleSwitch";
import useToast from "../../../hooks/useToast.js";
import api from "../../../services/api.js";

const DB_MAPPING = {
  1: "cons_2",
  2: "cons_3",
  3: "cons_4",
  4: "tal_1",
  5: "tal_3",
  6: "serv_1",
  7: "serv_3"
};

const FRONTEND_TO_DB_ID = {
  "cons_2": 1,
  "cons_3": 2,
  "cons_4": 3,
  "tal_1": 4,
  "tal_3": 5,
  "serv_1": 6,
  "serv_3": 7
};

export default function TabUtilizadores() {
  const { t } = useTranslation();
  const { mostrarToast } = useToast();

  const [roleSelecionada, setRoleSelecionada] = useState("");
  const [permissoesAtivas, setPermissoesAtivas] = useState({});
  const [estadoOriginal, setEstadoOriginal] = useState({});

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

  useEffect(() => {
    async function carregarPermissoes() {
      try {
        const response = await api.get("/defs-permissoes");
        const novoEstado = {};
        response.data.forEach((perm) => {
          const key = DB_MAPPING[perm.id_permissao];
          if (key) {
            novoEstado[key] = perm.toggle;
          }
        });
        setPermissoesAtivas(novoEstado);
        setEstadoOriginal(novoEstado);
      } catch (error) {
        console.error("Erro ao carregar permissões:", error);
      }
    }
    carregarPermissoes();
  }, []);

  const togglePermissao = (id) => {
    setPermissoesAtivas((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleGuardar = async () => {
    try {
      const alteracoes = [];
      Object.keys(permissoesAtivas).forEach((key) => {
        if (permissoesAtivas[key] !== estadoOriginal[key]) {
          alteracoes.push({
            id_permissao: FRONTEND_TO_DB_ID[key],
            toggle: permissoesAtivas[key],
          });
        }
      });

      if (alteracoes.length === 0) {
        mostrarToast(t("sem_alteracoes", "Não existem alterações para guardar."), "info");
        return;
      }

      await api.put("/defs-permissoes", { alteracoes });
      setEstadoOriginal({ ...permissoesAtivas });
      mostrarToast(t("permissoes_guardadas_sucesso", "Configurações de permissões guardadas com sucesso!"), "sucesso");
    } catch (error) {
      console.error("Erro ao guardar permissões:", error);
      mostrarToast(t("erro_guardar_permissoes", "Ocorreu um erro ao guardar as permissões."), "erro");
    }
  };

  return (
    <>
      <h3 className="section-title">{t("niveis_permissoes")}</h3>
      <p className="section-subtitle">{t("gerir_roles")}</p>

      <div className="mt-4">
        <label className="form-label fw-medium mb-2">
          {t("selecionar_tipo_utilizador")}
        </label>
        <div className="definicoes-dropdown-wrapper">
          <BotaoDropdown
            titulo={t("selecione_opcao")}
            valor={roleSelecionada}
            opcoes={roles.map((op) => ({ valor: op, label: t(op) }))}
            onChange={setRoleSelecionada}
            mostrarTituloNoValor={false}
          />
        </div>
      </div>

      {roleSelecionada && (
        <div className="mt-4 p-4 border border-2 rounded-4 bg-light shadow-sm">
          <h5
            className="mb-4 fw-semibold"
            style={{ color: "var(--fontes)" }}
          >
            {t("permissoes_para", { role: t(roleSelecionada) })}
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
                    {t(permissao.id + "_label")}
                  </label>
                  <p
                    className="text-muted mb-0"
                    style={{ fontSize: "0.85rem" }}
                  >
                    {t(permissao.id + "_desc")}
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

          <div className="mt-4 text-end definicoes-acao-guardar">
            <button
              onClick={handleGuardar}
              className="btn d-inline-flex align-items-center gap-2 shadow-sm border-0 px-4 text-white definicoes-btn-guardar"
              style={{
                backgroundColor: "var(--barra_lateral)",
                height: "44px",
                fontWeight: 500,
                fontSize: "16px",
                borderRadius: "var(--border-radius-pequeno)"
              }}
            >
              <i className="fi fi-br-disk me-2"></i> {t("guardar_alteracoes")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
