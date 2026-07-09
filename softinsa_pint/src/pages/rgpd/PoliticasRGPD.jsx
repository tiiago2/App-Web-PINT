import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../../services/api.js";
import RgpdRenderer from "../../components/RgpdRenderer/RgpdRenderer.jsx";
import LoadingSpinner from "../../components/ui/Loading/LoadingSpinner";
import "./PoliticasRGPD.css";

const TEXTO_MODELO_RGPD = `## 1. Identificação do Responsável pelo Tratamento

O responsável pelo tratamento dos dados pessoais recolhidos através da plataforma PINT é a Softinsa — Tecnologia e Consultoria, S.A., com sede na Avenida da Inovação, n.º 123, 1000-001 Lisboa, Portugal, NIF 500 123 456.

Para questões relacionadas com a proteção de dados pessoais, pode contactar o nosso Encarregado pela Proteção de Dados (DPO) através do endereço [dpo@softinsa.pt](mailto:dpo@softinsa.pt).

## 2. Dados Pessoais Recolhidos

No âmbito da utilização da plataforma PINT, podemos recolher e tratar as seguintes categorias de dados pessoais:

- Dados de identificação: nome completo, fotografia de perfil, endereço de e-mail profissional e número de telefone.
- Dados profissionais: função, cargo, service line, área de atuação, nível de carreira e histórico profissional.
- Dados de desempenho: candidaturas a badges, evidências submetidas, avaliações, classificações, pontuações e histórico de atribuições.
- Dados técnicos: endereço IP, tipo de navegador, logs de acesso e informações de utilização da plataforma.

## 3. Finalidades do Tratamento

Os dados pessoais são tratados para as seguintes finalidades:

- Gestão interna do programa de reconhecimento de competências (badges).
- Avaliação e validação de candidaturas a badges pelos Talent Managers e Service Line Leaders.
- Geração de estatísticas agregadas sobre progressão de carreira e atribuição de badges.
- Comunicação interna relacionada com candidaturas, objetivos, lembretes e notificações do sistema.
- Partilha externa de certificações e conquistas, apenas quando autorizado expressamente pelo titular.
- Cumprimento de obrigações legais ou regulamentares aplicáveis.

## 4. Base Legal do Tratamento

O tratamento dos dados pessoais baseia-se nas seguintes fundamentos jurídicos:

- Consentimento do titular, quando necessário para funcionalidades específicas (ex.: partilha externa no LinkedIn).
- Execução do contrato de trabalho ou de prestação de serviços.
- Interesses legítimos da Softinsa na gestão e desenvolvimento interno dos seus colaboradores.
- Cumprimento de obrigações legais a que a Softinsa esteja sujeita.

## 5. Prazos de Conservação

Os dados pessoais são conservados apenas pelo período necessário à prossecução das finalidades para que foram recolhidos, ou pelo prazo legalmente imposto. Findo esse prazo, os dados serão eliminados ou anonimizados, de forma segura.

## 6. Destinatários dos Dados

Os dados pessoais podem ser acedidos pelas seguintes entidades, sempre no estrito âmbito das suas funções:

- Talent Managers responsáveis pela validação inicial das candidaturas.
- Service Line Leaders responsáveis pela validação final técnica.
- Administradores da plataforma, para gestão e manutenção do sistema.
- Equipas internas de TI e segurança, quando necessário para garantir a disponibilidade e segurança da plataforma.

A Softinsa não partilha dados pessoais com terceiros externos, salvo obrigação legal ou consentimento expresso do titular.

## 7. Direitos do Titular dos Dados

Nos termos do RGPD, o titular dos dados tem o direito de:

- Aceder aos seus dados pessoais e obter informação sobre o tratamento.
- Retificar dados inexatos ou incompletos.
- Solicitar o apagamento dos seus dados ("direito ao esquecimento"), nos casos previstos na lei.
- Limitar o tratamento dos seus dados em determinadas situações.
- Opor-se ao tratamento dos seus dados, por motivos relacionados com a sua situação particular.
- Solicitar a portabilidade dos seus dados para outro responsável.
- Retirar o consentimento a qualquer momento, sem comprometer a licitude do tratamento anterior.

Para exercer estes direitos, contacte o DPO através de [dpo@softinsa.pt](mailto:dpo@softinsa.pt).

## 8. Medidas de Segurança

A Softinsa adota medidas técnicas e organizativas adequadas para proteger os dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição, incluindo:

- Encriptação de dados em trânsito e em repouso.
- Controlo de acessos baseado em funções (role-based access control).
- Registo de logs de auditoria das operações realizadas na plataforma.
- Atualização regular de sistemas e aplicação de patches de segurança.
- Formação e sensibilização dos colaboradores para a proteção de dados.

## 9. Transferências Internacionais

Os dados pessoais são tratados principalmente dentro do Espaço Económico Europeu (EEE). Caso ocorra alguma transferência internacional, a Softinsa garante que são adotadas as salvaguardas adequadas, como Cláusulas Contratuais Tipo aprovadas pela Comissão Europeia.

## 10. Cookies e Tecnologias Similares

A plataforma PINT pode utilizar cookies e tecnologias similares estritamente necessários ao funcionamento e segurança do serviço. A qualquer momento, o utilizador pode configurar o seu navegador para recusar cookies, embora isso possa afetar a experiência de utilização.

## 11. Alterações à Política de Privacidade

A Softinsa reserva-se o direito de atualizar a presente Política de Privacidade sempre que necessário. A data da última revisão será sempre indicada na plataforma. Em caso de alterações significativas, os utilizadores serão devidamente informados.

## 12. Reclamações

Se considerar que o tratamento dos seus dados pessoais viola a legislação em vigor, tem o direito de apresentar uma reclamação à Comissão Nacional de Proteção de Dados (CNPD), em Portugal, ou à autoridade de controlo do seu país de residência habitual ou de trabalho.

Para qualquer questão adicional, contacte-nos através de [dpo@softinsa.pt](mailto:dpo@softinsa.pt).`;

function PoliticasRGPD() {
  const { t } = useTranslation();

  const [texto, setTexto] = useState("");
  const [dataAlteracao, setDataAlteracao] = useState(null);
  const [nomeAutor, setNomeAutor] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarRGPD() {
      try {
        setLoading(true);
        setErro(false);

        const response = await api.get("/rgpd");

        if (!ativo) return;

        const textoServidor = response.data.textoConsentimento || "";
        setTexto(textoServidor.trim() ? textoServidor : TEXTO_MODELO_RGPD);
        setDataAlteracao(response.data.dataAlteracao);
        setNomeAutor(response.data.nomeAutor || "Sistema");
      } catch (error) {
        console.error("Erro ao carregar políticas RGPD:", error);
        if (ativo) {
          setTexto(TEXTO_MODELO_RGPD);
          setErro(true);
        }
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    carregarRGPD();

    return () => {
      ativo = false;
    };
  }, []);

  const formatarData = (dataStr) => {
    if (!dataStr) return "-";
    const data = new Date(dataStr);
    if (isNaN(data.getTime())) return "-";
    return data.toLocaleDateString("pt-PT") + " às " + data.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="rgpd-container d-flex justify-content-center align-items-center">
        <LoadingSpinner tamanho="lg" texto={t("a_carregar")} centralizado />
      </div>
    );
  }

  return (
    <div className="rgpd-container">
      <div className="rgpd-cabecalho">
        <div>
          <h1 className="rgpd-titulo-principal">{t("politicas_rgpd_titulo_pagina")}</h1>
          <p className="rgpd-subtitulo">{t("politicas_rgpd_subtitulo_pagina")}</p>
        </div>
      </div>

      <div className="rgpd-meta-card">
        <div className="rgpd-meta-item">
          <i className="fi fi-br-calendar-check rgpd-meta-icone"></i>
          <div>
            <span className="rgpd-meta-label">{t("ultima_revisao_legal")}</span>
            <span className="rgpd-meta-valor">{formatarData(dataAlteracao)}</span>
          </div>
        </div>
        <div className="rgpd-meta-item">
          <i className="fi fi-br-user rgpd-meta-icone"></i>
          <div>
            <span className="rgpd-meta-label">{t("rgpd_revisao_por", { autor: nomeAutor })}</span>
            <span className="rgpd-meta-valor">{nomeAutor}</span>
          </div>
        </div>
        {erro && (
          <div className="rgpd-meta-item rgpd-meta-aviso">
            <i className="fi fi-br-exclamation rgpd-meta-icone"></i>
            <div>
              <span className="rgpd-meta-label">{t("rgpd_modo_offline")}</span>
              <span className="rgpd-meta-valor">{t("rgpd_texto_modelo")}</span>
            </div>
          </div>
        )}
      </div>

      <div className="rgpd-conteudo-card">
        <RgpdRenderer texto={texto} />
      </div>

      <div className="rgpd-rodape">
        <p>{t("rgpd_rodape_texto")}</p>
      </div>
    </div>
  );
}

export default PoliticasRGPD;
