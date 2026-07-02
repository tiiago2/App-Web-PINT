import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BadgeDetalheConteudo from "../../components/BadgeDetalhe/BadgeDetalheConteudo";
import { obterBadgeDetalheCatalogo } from "../../services/badgeDetalheService";
import softinsaLogo from "../../assets/logotipo_softinsa.png";
import "./BadgePublico.css";

function BadgePublico() {
    const { idBadge } = useParams();
    const navigate = useNavigate();

    const [detalheBadge, setDetalheBadge] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [erro, setErro] = useState(false);

    useEffect(() => {
        let ativo = true;

        async function carregarBadgePublico() {
            try {
                setIsLoading(true);
                setErro(false);

                const detalhe = await obterBadgeDetalheCatalogo(idBadge);

                if (!ativo) {
                    return;
                }

                if (!detalhe) {
                    setErro(true);
                    setDetalheBadge(null);
                    return;
                }

                setDetalheBadge(detalhe);
            } catch (error) {
                console.error("Erro ao carregar página pública do badge:", error);

                if (ativo) {
                    setErro(true);
                    setDetalheBadge(null);
                }
            } finally {
                if (ativo) {
                    setIsLoading(false);
                }
            }
        }

        carregarBadgePublico();

        return () => {
            ativo = false;
        };
    }, [idBadge]);

    const handleCopiarLink = async () => {
        const urlAtual = window.location.href;

        try {
            await navigator.clipboard.writeText(urlAtual);
            alert("Link público copiado.");
        } catch (error) {
            console.error("Erro ao copiar link público:", error);
            window.prompt("Copia o link público:", urlAtual);
        }
    };

    return (
        <main className="badge-publico-page">
            <header className="badge-publico-header">
                <div className="badge-publico-header-conteudo">
                    <button
                        type="button"
                        className="badge-publico-logo-botao"
                        onClick={() => navigate("/login")}
                        aria-label="Ir para login"
                    >
                        <img
                            src={softinsaLogo}
                            alt="Softinsa"
                            className="badge-publico-logo"
                        />
                    </button>

                    <div className="badge-publico-header-acoes">
                        <button
                            type="button"
                            className="badge-publico-botao badge-publico-botao--secundario"
                            onClick={handleCopiarLink}
                        >
                            <i className="fi fi-br-copy"></i>
                            Copiar link
                        </button>

                        <button
                            type="button"
                            className="badge-publico-botao badge-publico-botao--primario"
                            onClick={() => navigate("/login")}
                        >
                            Entrar na plataforma
                        </button>
                    </div>
                </div>
            </header>

            <section className="badge-publico-hero">
                <div className="badge-publico-hero-conteudo">
                    <p className="badge-publico-eyebrow">
                        Página pública de badge
                    </p>

                    <h1>
                        {detalheBadge?.nome_badge ??
                            detalheBadge?.nome ??
                            "Badge"}
                    </h1>

                    <p>
                        Esta página apresenta apenas informação pública do
                        badge. Não inclui dados pessoais, candidaturas,
                        submissões ou estado individual de qualquer consultor.
                    </p>
                </div>
            </section>

            <section className="badge-publico-conteudo">
                {erro && !isLoading ? (
                    <div className="badge-publico-erro">
                        <i className="fi fi-br-exclamation"></i>
                        <h2>Badge não encontrado</h2>
                        <p>
                            O badge pedido não existe ou não está disponível
                            publicamente.
                        </p>

                        <button
                            type="button"
                            className="badge-publico-botao badge-publico-botao--primario"
                            onClick={() => navigate("/login")}
                        >
                            Voltar à plataforma
                        </button>
                    </div>
                ) : (
                    <BadgeDetalheConteudo
                        modo="publico"
                        detalhe={detalheBadge}
                        isLoading={isLoading}
                    />
                )}
            </section>
        </main>
    );
}

export default BadgePublico;