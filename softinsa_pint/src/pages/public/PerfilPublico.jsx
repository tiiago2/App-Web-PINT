import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../services/api.js";
import useToast from "../../hooks/useToast.js";
import softinsaLogo from "../../assets/logotipo_softinsa.png";
import userLogo from "../../assets/utilizador.png";
import badgeLogoDefault from "../../assets/teste_badge.png";
import BadgeItem from "../../components/Galeria/BadgeItem/BadgeItem.jsx";
import PageLoader from "../../components/ui/Loading/PageLoader.jsx";
import "./PerfilPublico.css";

function PerfilPublico() {
    const { idUtilizador } = useParams();
    const navigate = useNavigate();
    const { mostrarToast } = useToast();
    const { t } = useTranslation();

    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        let ativo = true;

        async function carregarPerfilPublico() {
            try {
                setIsLoading(true);
                setErro(null);

                const response = await api.get(`/profile/public/${idUtilizador}`);

                if (!ativo) return;

                if (!response.data) {
                    setErro({
                        titulo: "Utilizador não encontrado",
                        mensagem: "O perfil de utilizador pedido não existe ou não está disponível publicamente.",
                    });
                    return;
                }

                setProfile(response.data);
            } catch (error) {
                console.error("Erro ao carregar página pública do perfil:", error);

                if (ativo) {
                    const status = error?.response?.status;
                    if (status === 404) {
                        setErro({
                            titulo: "Utilizador não encontrado",
                            mensagem: "O perfil do utilizador pedido não foi encontrado ou não existe.",
                        });
                    } else {
                        setErro({
                            titulo: "Não foi possível carregar o perfil",
                            mensagem: "Ocorreu um problema ao carregar esta página. Tenta novamente mais tarde.",
                        });
                    }
                }
            } finally {
                if (ativo) {
                    setIsLoading(false);
                }
            }
        }

        carregarPerfilPublico();

        return () => {
            ativo = false;
        };
    }, [idUtilizador]);

    const handleCopiarLink = async () => {
        const urlAtual = window.location.href;

        try {
            await navigator.clipboard.writeText(urlAtual);
            mostrarToast("Link do perfil público copiado.", "sucesso");
        } catch (error) {
            console.error("Erro ao copiar link público:", error);
            window.prompt("Copia o link público:", urlAtual);
        }
    };

    const handleBadgeClick = (badgeId) => {
        navigate(`/badges/${badgeId}`);
    };

    if (isLoading) {
        return <PageLoader texto="A carregar perfil público..." />;
    }

    // Obter assinatura de badges
    const badgesAssinatura = profile?.badges.filter(b => profile.assinaturas_ids.includes(b.id)) || [];

    return (
        <main className="perfil-publico-page">
            <header className="perfil-publico-header">
                <div className="perfil-publico-header-conteudo">
                    <button
                        type="button"
                        className="perfil-publico-logo-botao"
                        onClick={() => navigate("/login")}
                        aria-label="Ir para login"
                    >
                        <img
                            src={softinsaLogo}
                            alt="Softinsa"
                            className="perfil-publico-logo"
                        />
                    </button>

                    <div className="perfil-publico-header-acoes">
                        <button
                            type="button"
                            className="perfil-publico-botao perfil-publico-botao--secundario"
                            onClick={handleCopiarLink}
                        >
                            <i className="fi fi-br-copy"></i>
                            Copiar link
                        </button>

                        <button
                            type="button"
                            className="perfil-publico-botao perfil-publico-botao--primario"
                            onClick={() => navigate("/login")}
                        >
                            Entrar na plataforma
                        </button>
                    </div>
                </div>
            </header>

            {erro ? (
                <section className="perfil-publico-conteudo-erro">
                    <div className="perfil-publico-erro">
                        <i className="fi fi-br-exclamation"></i>
                        <h2>{erro.titulo}</h2>
                        <p>{erro.mensagem}</p>

                        <button
                            type="button"
                            className="perfil-publico-botao perfil-publico-botao--primario"
                            onClick={() => navigate("/login")}
                        >
                            Voltar à plataforma
                        </button>
                    </div>
                </section>
            ) : (
                <>
                    <section className="perfil-publico-hero">
                        <div className="perfil-publico-hero-conteudo">
                            <p className="perfil-publico-eyebrow">
                                Página pública de consultor
                            </p>

                            <h1>
                                {profile?.nome || "Utilizador"}
                            </h1>

                            <p className="perfil-publico-cargo-sub">
                                {profile?.cargo || "Consultor"} {profile?.area ? `| ${profile.area}` : ""}
                            </p>
                        </div>
                    </section>

                    <section className="perfil-publico-conteudo">
                        <div className="row g-4">
                            {/* Ficha Pessoal Pública */}
                            <div className="col-lg-6 col-12">
                                <div className="perfil-publico-card perfil-publico-card--pessoal">
                                    <h2 className="perfil-publico-card-titulo">Informações Gerais</h2>
                                    <div className="d-flex align-items-center gap-4 flex-wrap mt-3">
                                        <div className="perfil-publico-avatar-wrapper">
                                            <img 
                                                src={profile?.foto || userLogo} 
                                                alt={profile?.nome} 
                                                className="perfil-publico-avatar-img" 
                                            />
                                        </div>
                                        <div className="perfil-publico-dados d-flex flex-column gap-2">
                                            <p className="m-0">
                                                <span className="perfil-publico-label">Pontos Totais:</span>
                                                <span className="perfil-publico-valor perfil-publico-valor--pontos">{profile?.pontos || 0} pts</span>
                                            </p>
                                            <p className="m-0">
                                                <span className="perfil-publico-label">Email:</span>
                                                <span className="perfil-publico-valor">{profile?.email || "Não especificado"}</span>
                                            </p>
                                            <p className="m-0">
                                                <span className="perfil-publico-label">Telefone:</span>
                                                <span className="perfil-publico-valor">{profile?.telefone || "Não especificado"}</span>
                                            </p>
                                            {profile?.area && (
                                                <p className="m-0">
                                                    <span className="perfil-publico-label">Área:</span>
                                                    <span className="perfil-publico-valor">{profile?.area}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Assinatura Pessoal Pública */}
                            <div className="col-lg-6 col-12">
                                <div className="perfil-publico-card perfil-publico-card--assinatura">
                                    <h2 className="perfil-publico-card-titulo">Assinatura de Badges</h2>
                                    <div className="perfil-publico-assinatura-box mt-3 d-flex flex-column align-items-center justify-content-center p-4">
                                        <div className="perfil-publico-assinatura-texto text-center mb-3">
                                            <h4 className="m-0 fw-bold">{profile?.nome} | {profile?.cargo || "Consultor"}</h4>
                                            <p className="m-0 mt-1 text-muted" style={{ fontSize: "0.85rem" }}>
                                                {profile?.email} {profile?.telefone ? `| ${profile.telefone}` : ""}
                                            </p>
                                        </div>
                                        <div className="perfil-publico-assinatura-badges d-flex gap-3 justify-content-center w-100 flex-wrap">
                                            {badgesAssinatura.map(badge => (
                                                <div 
                                                    key={badge.id} 
                                                    className="perfil-publico-assinatura-badge-item"
                                                    onClick={() => handleBadgeClick(badge.id)}
                                                    style={{ cursor: 'pointer' }}
                                                    title={`Ver badge publicamente: ${badge.nome}`}
                                                >
                                                    <img src={badge.imagem || badgeLogoDefault} alt={badge.nome} />
                                                </div>
                                            ))}
                                            {badgesAssinatura.length === 0 && (
                                                <span className="text-muted" style={{ fontSize: "0.85rem" }}>
                                                    Sem badges em destaque na assinatura.
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Badges Pessoais Públicos */}
                        <div className="row mt-4">
                            <div className="col-12">
                                <div className="perfil-publico-card perfil-publico-card--badges">
                                    <h2 className="perfil-publico-card-titulo mb-4">Badges Conquistados</h2>
                                    {profile?.badges && profile.badges.length > 0 ? (
                                        <div className="perfil-publico-badges-grelha">
                                            {profile.badges.map((badge) => (
                                                <div key={badge.id} className="perfil-publico-badge-wrapper">
                                                    <BadgeItem
                                                        badge={{
                                                            idBadge: badge.id,
                                                            nomeBadge: badge.nome,
                                                            imagemBadge: badge.imagem || badgeLogoDefault,
                                                        }}
                                                        mostrarEstado={false}
                                                        onBadgeClick={() => handleBadgeClick(badge.id)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="perfil-publico-badges-vazio text-center py-5">
                                            <i className="fi fi-br-award mb-3" style={{ fontSize: "2rem", color: "var(--fontes)", opacity: 0.3 }}></i>
                                            <p className="text-muted mb-0">Este consultor ainda não conquistou badges públicos.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                </>
            )}
        </main>
    );
}

export default PerfilPublico;
