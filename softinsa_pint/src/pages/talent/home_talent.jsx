import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './home_talent.css';
import ClassificacaoGeral from '../../components/ClassificacaoModal.jsx';
import AtividadeRecente from '../../components/AtividadeModal.jsx';
import LoadingSpinner from '../../components/ui/Loading/LoadingSpinner';
import { mapearAtividadeParaModal } from '../../utils/atividadeUtils.js';
import { formatarTempo } from '../../utils/dateUtils.js';
import badge_logo from '../../assets/teste_badge.png';
import { BotaoVerMais, BotaoAceitar, BotaoRejeitar, GraficoCandidaturas } from '../../components/components.jsx'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Label, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const HomeTalent = ({ user, saudacao }) => {

    const idGuardado = localStorage.getItem("utilizador_id");
    const roleGuardada = localStorage.getItem("role_softinsa");

    const { t } = useTranslation();
    const navigate = useNavigate();

    const [loadingGraficos, setLoadingGraficos] = useState(true);
    const [infoCandidaturas, setInfoCandidaturas] = useState();
    const [dados_grafico_candidaturas, setDados_grafico_candidaturas] = useState([
        { nome: 'aceites', quantidade: null, cor: '#3bb413' },
        { nome: 'rejeitadas', quantidade: null, cor: '#de2121' }
    ]);
    const [dados_linhas, setDados_linhas] = useState([
        { periodo: null, media_badges: null, pontos: null, atribuicoes: null },
        { periodo: null, media_badges: null, pontos: null, atribuicoes: null },
        { periodo: null, media_badges: null, pontos: null, atribuicoes: null },
        { periodo: null, media_badges: null, pontos: null, atribuicoes: null }
    ]);
    const [classificacao, setClassificacao] = useState([]);
    const [atividadeRecente, setAtividadeRecente] = useState([]);
    const [carregandoAtividade, setCarregandoAtividade] = useState(true);

    useEffect(() => {
        const buscarCandidaturas = async () => {
            if (!localStorage.getItem('token_softinsa')) {
                setInfoCandidaturas([]);
                return;
            }

            try {
                const res = await api.get('/hometalent/candidaturas');

                setInfoCandidaturas(Array.isArray(res.data) ? res.data : []);
                console.log('Dados recebidos com sucesso:', res.data);
            } catch (erro) {
                console.error('Erro ao buscar candidaturas:', erro);
                setInfoCandidaturas([]);
            }
        };

        const getGrafCandidaturas = async () => {
            if (!localStorage.getItem('token_softinsa')) {
                setDados_grafico_candidaturas(prev => prev.map(item => ({ ...item, quantidade: 0 })));
                return;
            }

            try {
                const res = await api.get(`/commun/candidaturasweek/${idGuardado}`);

                setDados_grafico_candidaturas(prevDados =>
                    prevDados.map(item => {
                        if (item.nome === 'aceites') {
                            return { ...item, quantidade: res.data.aceites };
                        }
                        if (item.nome === 'rejeitadas') {
                            return { ...item, quantidade: res.data.rejeitadas };
                        }
                        return item;
                    })
                );

            } catch (erro) {
                console.error('Erro ao buscar dados do gráfico:', erro);
                setDados_grafico_candidaturas(prev => prev.map(item => ({ ...item, quantidade: null })));
            }
        }

        const getDados_Linhas = async () => {
            // 1. Verificação de segurança (Token)
            if (!localStorage.getItem('token_softinsa')) {
                // Se não houver token, esvaziamos o gráfico
                setDados_linhas([]);
                return;
            }

            try {
                const res = await api.get('/hometalent/dados4month');

                setDados_linhas(res.data);
                console.log('DADOS LINHAS:', dados_linhas);

            } catch (erro) {
                console.error('Erro ao buscar dados do gráfico de linhas:', erro);

                setDados_linhas([]);
            }
        }

        const carregarRanking = async () => {
            if (!localStorage.getItem('token_softinsa')) {
                setClassificacao([]);
                return;
            }

            try {
                const res = await api.get('/hometalent/ranking');
                setClassificacao(Array.isArray(res.data) ? res.data : []);
            } catch (erro) {
                console.error('Erro ao buscar ranking do talent:', erro);
                setClassificacao([]);
            }
        }

        const carregarAtividade = async () => {
            if (!localStorage.getItem('token_softinsa')) {
                setAtividadeRecente([]);
                setCarregandoAtividade(false);
                return;
            }

            try {
                setCarregandoAtividade(true);
                const res = await api.get('/atividade/get', {
                    params: { perfil: 'Talent Manager', limit: 20 }
                });
                const atividades = res.data.data || [];
                setAtividadeRecente(atividades.map(mapearAtividadeParaModal).filter(Boolean));
            } catch (erro) {
                console.error('Erro ao buscar atividade recente do talent:', erro);
                setAtividadeRecente([]);
            } finally {
                setCarregandoAtividade(false);
            }
        }

        const carregarDados = async () => {
            setLoadingGraficos(true);
            await Promise.all([
                buscarCandidaturas(),
                getGrafCandidaturas(),
                getDados_Linhas(),
                carregarRanking(),
                carregarAtividade()
            ]);
            setLoadingGraficos(false);
        };
        carregarDados();
    }, []);

    const GraficoEstatistica = () => {

        const { t } = useTranslation();

        const dados_traduzidos = dados_linhas.map((dado) => {
            return {
                ...dado,
                nome: t(dado.periodo)
            };
        });

        const isVazio = !dados_linhas || dados_linhas.length === 0 || dados_linhas.every(d => d.media_badges == null && d.pontos == null && d.atribuicoes == null);

        return (
            <div className="border border-2 rounded-4 p-2 d-flex flex-column h-100">
                <h5 className="ms-1 mb-2">{t('evo_users')}</h5>

                <div className="flex-grow-1 d-flex justify-content-center align-items-center" style={{ width: '100%', minHeight: '200px' }}>
                    {loadingGraficos ? (
                        <LoadingSpinner tamanho="md" />
                    ) : isVazio ? (
                        <div className="text-muted text-center w-100">
                            <i className="fi fi-br-info text-muted fs-4 mb-2 d-block"></i>
                            <span>{t('sem_dados')}</span>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dados_traduzidos} margin={{ top: 12, right: 25, left: -20, bottom: 0 }}>

                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />

                                <XAxis dataKey="nome" tick={{ fontSize: 11 }} tickMargin={10} />

                                <YAxis tick={{ fontSize: 11 }} />

                                <Tooltip isAnimationActive={false} />
                                <Legend
                                    verticalAlign="bottom"
                                    iconType="circle"
                                    formatter={(value) => <span style={{ fontSize: '12px' }}>{value}</span>}
                                    wrapperStyle={{
                                        paddingLeft: '7vh',
                                        paddingBottom: '1vh',
                                        width: '100%',
                                        display: 'flex',
                                        justifyContent: 'center'
                                    }} />

                                <Line
                                    type="monotone"
                                    dataKey="media_badges"
                                    name={t('media_badges')}
                                    stroke="#009966"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="pontos"
                                    name={t('pontos')}
                                    stroke="#39639C"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="atribuicoes"
                                    name={t('atribuicoes')}
                                    stroke="#C40003"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        );
    }

    const RenderCandidaturas = () => {
        if (!Array.isArray(infoCandidaturas) || infoCandidaturas.length === 0) {
            return <div className="col-12 text-muted">Sem candidaturas</div>;
        }

        return infoCandidaturas.slice(0, 3).map((candidatura, index) => {
            const badge = candidatura?.Badges || candidatura?.Badge || null;
            const utilizador = candidatura?.Utilizador || null;
            const area = badge?.Area?.nome_area || badge?.nome_area || '—';
            const nomeBadge = badge?.nome_badge || 'Badge';
            const nomeUser = utilizador?.nome_user || 'Utilizador';
            const imagemUser = utilizador?.imagem_perfil || '';
            const imagemBadge = badge?.imagem || badge_logo;

            return (
                <div key={candidatura?.id_submissao || index} className="col-12 col-sm-6 col-xl-4">
                    <div className="card text-center border-0 p-1 card-candidatura" style={{ height: '100%' }}>
                        <div className="mx-auto mt-2 rounded-circle d-flex align-items-center justify-content-center">
                            <img className="rounded-circle badge_logo_candidaturas" src={imagemBadge} alt={nomeBadge} />
                        </div>

                        <h6 className="mt-2 mb-0">{nomeBadge}</h6>

                        <div className="d-flex align-items-center justify-content-center my-1">
                            <div>
                                <img className="mx-3 rounded-1 user_image_candidaturas" src={imagemUser} alt={nomeUser} />
                            </div>
                            <div className="text-start">
                                <div className="fw-medium nome_candidatura" style={{ fontSize: '0.8rem', lineHeight: '0.8' }}>{nomeUser}</div>
                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>{area}</div>
                            </div>
                        </div>

                        <div className="text-muted mb-2" style={{ fontSize: '0.7rem' }}>{formatarTempo(candidatura?.data_submissao) || '—'}</div>

                        <div className="d-flex justify-content-center gap-1 mt-auto">
                            <BotaoVerMais onClick={() => navigate('/candidaturas', { state: { selectedCandidaturaId: candidatura?.id_submissao } })} tamanho={0.7} />
                            <BotaoAceitar onClick={() => navigate('/candidaturas', { state: { selectedCandidaturaId: candidatura?.id_submissao } })} tamanho={0.7} />
                            <BotaoRejeitar onClick={() => navigate('/candidaturas', { state: { selectedCandidaturaId: candidatura?.id_submissao } })} tamanho={0.7} />
                        </div>
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="home-talent-container">
            <div className="flex-shrink-0">
                <h1 className="texto-titulo-principal m-0">{saudacao}</h1>
            </div>

            {/* Primeira linha: Candidaturas e Gráfico Estatísticas */}
            <div className="row primeira-linha-home" style={{ rowGap: 'var(--gap-default-seccoes)' }}>
                <div className="col-12 col-xl-8 candidaturas-column">
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h5 className="m-0" style={{ fontSize: 'clamp(0.9rem, 2vw, 1.1rem)' }}>{t('candidaturas_recentes')}</h5>
                            {infoCandidaturas !== null && infoCandidaturas !== undefined && (
                                <BotaoVerMais onClick={() => navigate('/candidaturas')} tamanho={0.6} />
                            )}
                        </div>
                        <div className="row g-2 g-md-3">
                            {RenderCandidaturas()}
                        </div>
                    </div>
                </div>
                <div className="col-12 col-xl-4" style={{ minHeight: 0 }}>
                    <div className="grafico-estatistica-container" style={{ overflow: 'hidden' }}>
                        <GraficoEstatistica />
                    </div>
                </div>
            </div>

            {/* Segunda linha: Atividade, Classificação e Gráfico Candidaturas */}
            <div className="row segunda-linha-home" style={{ minHeight: 0, rowGap: 'var(--gap-default-seccoes)' }}>
                <div className="col-12 col-sm-6 col-xl-4" style={{ minHeight: 0 }}>
                    <div style={{ height: '100%', overflow: 'hidden' }}>
                        <AtividadeRecente atividades={atividadeRecente} fullHeight={true} isLoading={carregandoAtividade} />
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-xl-4" style={{ minHeight: 0 }}>
                    <div style={{ height: '100%', overflow: 'hidden' }}>
                        <ClassificacaoGeral user={user} classificacao={classificacao} fullHeight={true} />
                    </div>
                </div>
                <div className="col-12 col-xl-4" style={{ minHeight: 0 }}>
                    <div className="grafico-wrapper" style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <GraficoCandidaturas dados_grafico_candidaturas={dados_grafico_candidaturas} loading={loadingGraficos} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeTalent;