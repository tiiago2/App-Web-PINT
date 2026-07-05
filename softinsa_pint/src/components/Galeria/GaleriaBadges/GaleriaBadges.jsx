import { useEffect, useMemo, useState } from "react";
import SeletorAbas from "../../ui/SeletorAbas/SeletorAbas_Galeria";
import GaleriaSugeridos from "../GaleriaSugeridos/GaleriaSugeridos";
import GaleriaTodosBadges from "../GaleriaTodosBadges/GaleriaTodosBadges";
import GaleriaToolbar from "../GaleriaToolbar/GaleriaToolbar";
import FiltroEstadoBadges from "../FiltroEstadoBadges/FiltroEstadoBadges";
import ModalConfirmacao from "../../ui/ModalConfirmacao/ModalConfirmacao";
import BadgeDetalheModal from "../../BadgeDetalhe/BadgeDetalheModal";
import badgesConsultorMock from "../../../data/badgesConsultorMock";
import {
    obterBadgeDetalheConsultor,
    anexarRequisitoAoBadge,
    submeterCandidaturaBadge,
    obterUrlPublicaDoBadge,
    obterUrlPartilhaLinkedInDoBadge,
} from "../../../services/badgeDetalheService";
import {
    obterBadgesCatalogoNormalizados,
    obterBadge,
} from "../../../services/badgesService";
import { normalizarBadgeDetalheCatalogo } from "../../../utils/badgeDetalheNormalizadores";
import "./GaleriaBadges.css";
import { verificarPermissaoPartilhaLinkedIn } from "../../../services/permissoesService";

function normalizarTexto(texto = "") {
    return String(texto)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function obterIdBadge(badge = {}) {
    return badge.id_badge ?? badge.idBadge ?? badge.id;
}

function obterNomeRequisito(requisito = {}) {
    return (
        requisito.nome_requisito ??
        requisito.nomeRequisito ??
        requisito.nome ??
        "requisito"
    );
}

function obterDescricaoRequisito(requisito = {}) {
    return (
        requisito.descricao_requisito ??
        requisito.descricaoRequisito ??
        requisito.descricao ??
        obterNomeRequisito(requisito)
    );
}

function obterNomeFicheiro(ficheiro) {
    if (!ficheiro) {
        return "ficheiro selecionado";
    }

    if (typeof ficheiro === "string") {
        return ficheiro;
    }

    return ficheiro.name ?? "ficheiro selecionado";
}

function criarOpcoesUnicas(badges, campo) {
    const mapa = new Map();

    badges.forEach((badge) => {
        const valor = badge[campo];

        if (valor && !mapa.has(valor)) {
            mapa.set(valor, {
                valor,
                label: valor,
            });
        }
    });

    return Array.from(mapa.values()).sort((a, b) =>
        a.label.localeCompare(b.label, "pt")
    );
}

function badgeCumpreFiltro(badge, filtro) {
    if (!filtro || filtro.tipo === "todos") {
        return true;
    }

    if (filtro.tipo === "learningPath") {
        return badge.learningPath === filtro.valor;
    }

    if (filtro.tipo === "serviceLine") {
        return badge.serviceLine === filtro.valor;
    }

    if (filtro.tipo === "area") {
        return badge.nomeArea === filtro.valor;
    }

    return true;
}

function calcularContagensEstadoBadges(badges) {
    const contagens = {
        todos: badges.length,
        conquistados: 0,
        emProgresso: 0,
        pendentes: 0,
        expirados: 0,
        recusados: 0,
        bloqueados: 0,
    };

    badges.forEach((badge) => {
        if (contagens[badge.estado] !== undefined) {
            contagens[badge.estado] += 1;
        }
    });

    return contagens;
}

function criarMensagemConfirmacaoAnexo(anexoPendente, detalheBadge) {
    if (!anexoPendente) {
        return "";
    }

    const nomeFicheiro = obterNomeFicheiro(anexoPendente.ficheiro);
    const descricaoRequisito = obterDescricaoRequisito(
        anexoPendente.requisito
    );

    let mensagem = `Vais anexar o ficheiro "${nomeFicheiro}" ao requisito "${descricaoRequisito}". Queres continuar?`;

    if (detalheBadge?.estado === "bloqueados") {
        mensagem +=
            " Depois de anexares o primeiro requisito, este badge passa para Em Progresso.";
    }

    return mensagem;
}

function GaleriaBadges({ modo = "consultor" }) {
    const isConsultor = modo === "consultor";

    const [badgesConsultor, setBadgesConsultor] = useState(
        () => (isConsultor ? badgesConsultorMock : [])
    );

    const [abaAtiva, setAbaAtiva] = useState("sugeridos");
    const [pesquisa, setPesquisa] = useState("");
    const [ordenacao, setOrdenacao] = useState("recentes");
    const [filtro, setFiltro] = useState({
        tipo: "todos",
        valor: "",
        label: "Todos",
    });
    const [estadoBadgeAtivo, setEstadoBadgeAtivo] = useState("todos");

    const [isDetalheBadgeOpen, setIsDetalheBadgeOpen] = useState(false);
    const [detalheBadge, setDetalheBadge] = useState(null);
    const [isLoadingDetalheBadge, setIsLoadingDetalheBadge] = useState(false);
    const [isLoadingCatalogo, setIsLoadingCatalogo] = useState(false);
    const [erroCatalogo, setErroCatalogo] = useState("");
    const [anexoPendente, setAnexoPendente] = useState(null);
    const [avisoPermissaoLinkedIn, setAvisoPermissaoLinkedIn] = useState(false);

    useEffect(() => {
        if (isConsultor) {
            setBadgesConsultor(badgesConsultorMock);
            setErroCatalogo("");
            setIsLoadingCatalogo(false);
            return undefined;
        }

        let ativo = true;

        async function carregarCatalogo() {
            setBadgesConsultor([]);
            setIsLoadingCatalogo(true);
            setErroCatalogo("");

            try {
                const badgesCatalogo = await obterBadgesCatalogoNormalizados();

                if (ativo) {
                    setBadgesConsultor(badgesCatalogo);
                }
            } catch (error) {
                console.error("Erro ao carregar catálogo de badges:", error);

                if (ativo) {
                    setErroCatalogo("Não foi possível carregar o catálogo de badges.");
                }
            } finally {
                if (ativo) {
                    setIsLoadingCatalogo(false);
                }
            }
        }

        carregarCatalogo();

        return () => {
            ativo = false;
        };
    }, [isConsultor]);

    const opcoesFiltro = useMemo(() => {
        return {
            learningPath: criarOpcoesUnicas(
                badgesConsultor,
                "learningPath"
            ),
            serviceLine: criarOpcoesUnicas(
                badgesConsultor,
                "serviceLine"
            ),
            area: criarOpcoesUnicas(badgesConsultor, "nomeArea"),
        };
    }, [badgesConsultor]);

    const abaAtual = isConsultor ? abaAtiva : "todos";

    const opcoesEstadoBadge = [
        { valor: "todos", label: "Todos" },
        { valor: "conquistados", label: "Conquistados" },
        { valor: "emProgresso", label: "Em Progresso" },
        { valor: "pendentes", label: "Pendentes" },
        { valor: "expirados", label: "Expirados" },
        { valor: "recusados", label: "Recusados" },
        { valor: "bloqueados", label: "Bloqueados" },
    ];

    const badgesParaContagem = useMemo(() => {
        let lista = [...badgesConsultor];

        const pesquisaNormalizada = normalizarTexto(pesquisa).trim();

        if (pesquisaNormalizada) {
            lista = lista.filter((badge) => {
                const camposPesquisaveis = [
                    badge.nomeBadge,
                    badge.nomeArea,
                    badge.serviceLine,
                    badge.learningPath,
                    badge.nivel,
                ];

                return camposPesquisaveis.some((campo) =>
                    normalizarTexto(campo).includes(pesquisaNormalizada)
                );
            });
        }

        lista = lista.filter((badge) => badgeCumpreFiltro(badge, filtro));

        return lista;
    }, [badgesConsultor, pesquisa, filtro]);

    const contagensEstadoBadge = useMemo(() => {
        return calcularContagensEstadoBadges(badgesParaContagem);
    }, [badgesParaContagem]);

    const mensagemGaleriaVazia = !isConsultor && isLoadingCatalogo
        ? "A carregar badges..."
        : erroCatalogo || undefined;

    const atualizarBadgeConsultorNaGaleria = (detalheAtualizado) => {
        const idBadge = obterIdBadge(detalheAtualizado);

        if (!idBadge) {
            return;
        }

        setBadgesConsultor((prev) =>
            prev.map((badge) => {
                if (Number(obterIdBadge(badge)) !== Number(idBadge)) {
                    return badge;
                }

                return {
                    ...badge,
                    estado: detalheAtualizado.estado,
                    progresso: detalheAtualizado.progresso,
                    data_candidatura:
                        detalheAtualizado.datas?.candidatura ??
                        badge.data_candidatura,
                    data_obtencao:
                        detalheAtualizado.datas?.obtencao ??
                        badge.data_obtencao,
                    data_expiracao:
                        detalheAtualizado.datas?.expiracao ??
                        badge.data_expiracao,
                };
            })
        );
    };

    const handleOpenDetalheBadge = async (badge) => {
        const idBadge = obterIdBadge(badge);

        if (!idBadge) {
            return;
        }

        setDetalheBadge(null);
        setIsLoadingDetalheBadge(true);

        if (isConsultor) {
            setIsDetalheBadgeOpen(true);
        }

        try {
            if (isConsultor) {
                const detalhe = await obterBadgeDetalheConsultor(idBadge);
                setDetalheBadge(detalhe);
                return;
            }

            const detalhe = await obterBadge(idBadge);
            const detalheNormalizado = normalizarBadgeDetalheCatalogo({
                badge: detalhe,
                requisitos: Array.isArray(detalhe.requisitos)
                    ? detalhe.requisitos
                    : [],
            });

            setDetalheBadge(detalheNormalizado);
            setIsDetalheBadgeOpen(true);
        } catch (error) {
            console.error("Erro ao carregar detalhe do badge:", error);
            setDetalheBadge(null);

            if (!isConsultor) {
                setIsDetalheBadgeOpen(false);
            }
        } finally {
            setIsLoadingDetalheBadge(false);
        }
    };

    const handleCloseDetalheBadge = () => {
        setIsDetalheBadgeOpen(false);
        setDetalheBadge(null);
        setAnexoPendente(null);
    };

    const handleSelecionarFicheiroRequisito = ({ requisito, ficheiro }) => {
        setAnexoPendente({
            requisito,
            ficheiro,
        });
    };

    const handleConfirmarAnexoRequisito = async () => {
        if (!anexoPendente || !detalheBadge) {
            return;
        }

        const idBadge = obterIdBadge(detalheBadge);
        const idRequisito =
            anexoPendente.requisito.id_requisito ??
            anexoPendente.requisito.idRequisito ??
            anexoPendente.requisito.id;

        if (!idBadge || !idRequisito) {
            return;
        }

        setIsLoadingDetalheBadge(true);

        try {
            const detalheAtualizado = await anexarRequisitoAoBadge({
                idBadge,
                idRequisito,
                ficheiro: anexoPendente.ficheiro,
            });

            setDetalheBadge(detalheAtualizado);
            atualizarBadgeConsultorNaGaleria(detalheAtualizado);
        } catch (error) {
            console.error("Erro ao anexar requisito:", error);
            alert("Não foi possível anexar o requisito.");
        } finally {
            setIsLoadingDetalheBadge(false);
            setAnexoPendente(null);
        }
    };

    const handleSubmeterCandidatura = async (badgeDetalhe) => {
        const idBadge = obterIdBadge(badgeDetalhe);

        if (!idBadge) {
            return;
        }

        setIsLoadingDetalheBadge(true);

        try {
            const detalheAtualizado = await submeterCandidaturaBadge(idBadge);

            setDetalheBadge(detalheAtualizado);
            atualizarBadgeConsultorNaGaleria(detalheAtualizado);
        } catch (error) {
            console.error("Erro ao submeter candidatura:", error);
            alert("Não foi possível submeter a candidatura.");
        } finally {
            setIsLoadingDetalheBadge(false);
        }
    };

    const handleVerPaginaPublicaBadge = (badgeDetalhe) => {
        const idBadge = obterIdBadge(badgeDetalhe);

        if (!idBadge) {
            return;
        }

        const urlPublica =
            badgeDetalhe?.urlPublica ?? obterUrlPublicaDoBadge(idBadge);

        window.open(urlPublica, "_blank", "noopener,noreferrer");
    };

    const handleCopiarLinkPublicoBadge = async (badgeDetalhe) => {
        const idBadge = obterIdBadge(badgeDetalhe);

        if (!idBadge) {
            return;
        }

        const urlPublica =
            badgeDetalhe?.urlPublica ?? obterUrlPublicaDoBadge(idBadge);

        const urlAbsoluta = `${window.location.origin}${urlPublica}`;

        try {
            await navigator.clipboard.writeText(urlAbsoluta);
            alert("Link público copiado.");
        } catch (error) {
            console.error("Erro ao copiar link público:", error);
            window.prompt("Copia o link público:", urlAbsoluta);
        }
    };

    const handlePartilharLinkedIn = async (badgeDetalhe) => {
        const idBadge = obterIdBadge(badgeDetalhe);

        if (!idBadge) {
            return;
        }

        const temPermissao = await verificarPermissaoPartilhaLinkedIn();

        if (!temPermissao) {
            setAvisoPermissaoLinkedIn(true);
            return;
        }

        const urlLinkedIn = obterUrlPartilhaLinkedInDoBadge(idBadge);

        window.open(urlLinkedIn, "_blank", "noopener,noreferrer");
    };

    return (
        <main className="galeria-badges-page">
            <div className="galeria-badges-topo">
                <h1 className="texto-titulo-principal galeria-badges-titulo">
                    Galeria de Badges
                </h1>

                {isConsultor && (
                    <div className="galeria-badges-seletor">
                        <SeletorAbas
                            valorAtivo={abaAtiva}
                            onChange={setAbaAtiva}
                            opcoes={[
                                { valor: "sugeridos", label: "Sugeridos" },
                                {
                                    valor: "todos",
                                    label: "Todos os Badges",
                                },
                            ]}
                        />
                    </div>
                )}
            </div>

            <div className="galeria-badges-conteudo">
                {abaAtual === "todos" && (
                    <>
                        <GaleriaToolbar
                            pesquisa={pesquisa}
                            onPesquisaChange={setPesquisa}
                            ordenacao={ordenacao}
                            onOrdenacaoChange={setOrdenacao}
                            filtro={filtro}
                            onFiltroChange={setFiltro}
                            opcoesFiltro={opcoesFiltro}
                        />

                        {isConsultor && (
                            <FiltroEstadoBadges
                                opcoes={opcoesEstadoBadge}
                                valorAtivo={estadoBadgeAtivo}
                                onChange={setEstadoBadgeAtivo}
                                contagens={contagensEstadoBadge}
                            />
                        )}
                    </>
                )}

                <div
                    className={`galeria-badges-resultados ${
                        abaAtual === "todos" ? "com-toolbar" : ""
                    }`}
                >
                    {isConsultor && abaAtual === "sugeridos" && (
                        <GaleriaSugeridos
                            onBadgeClick={handleOpenDetalheBadge}
                        />
                    )}

                    {abaAtual === "todos" && (
                        <GaleriaTodosBadges
                            modo={modo}
                            badges={badgesConsultor}
                            pesquisa={pesquisa}
                            ordenacao={ordenacao}
                            filtro={filtro}
                            estadoAtivo={
                                isConsultor ? estadoBadgeAtivo : "todos"
                            }
                            mostrarEstado={isConsultor}
                            onBadgeClick={handleOpenDetalheBadge}
                            emptyMessage={mensagemGaleriaVazia}
                        />
                    )}
                </div>
            </div>

            <BadgeDetalheModal
                isOpen={isDetalheBadgeOpen}
                onClose={handleCloseDetalheBadge}
                modo={isConsultor ? "consultor" : "catalogo"}
                detalhe={detalheBadge}
                isLoading={isLoadingDetalheBadge}
                onSelecionarFicheiroRequisito={
                    isConsultor ? handleSelecionarFicheiroRequisito : undefined
                }
                onSubmeterCandidatura={
                    isConsultor ? handleSubmeterCandidatura : undefined
                }
                onVerPaginaPublica={handleVerPaginaPublicaBadge}
                onCopiarLinkPublico={handleCopiarLinkPublicoBadge}
                onPartilharLinkedIn={
                    isConsultor ? handlePartilharLinkedIn : undefined
                }
            />

            <ModalConfirmacao
                isOpen={isConsultor && avisoPermissaoLinkedIn}
                onClose={() => setAvisoPermissaoLinkedIn(false)}
                onConfirm={() => setAvisoPermissaoLinkedIn(false)}
                titulo="Sem autorização"
                mensagem="Não tens autorização para partilhar badges no LinkedIn. Esta permissão pode ser ativada nas definições pelo Administrador."
                textoConfirmar="Compreendido"
                textoCancelar="Fechar"
                isDanger={false}
            />

            <ModalConfirmacao
                isOpen={isConsultor && !!anexoPendente}
                onClose={() => setAnexoPendente(null)}
                onConfirm={handleConfirmarAnexoRequisito}
                titulo="Anexar requisito"
                mensagem={criarMensagemConfirmacaoAnexo(
                    anexoPendente,
                    detalheBadge
                )}
                textoConfirmar="Anexar requisito"
                textoCancelar="Cancelar"
                isDanger={false}
            />
        </main>
    );
}

export default GaleriaBadges;
