import "./BadgeDetalheEstadoConsultor.css";
import {
    ESTADOS_BADGE_CONSULTOR,
    LABEL_ESTADO_BADGE_CONSULTOR,
} from "../../utils/badgeDetalheNormalizadores";

function formatarData(data) {
    if (!data) {
        return null;
    }

    return new Intl.DateTimeFormat("pt-PT").format(new Date(data));
}

function BadgeDetalheEstadoConsultor({ detalhe }) {
    const estado = detalhe?.estado ?? ESTADOS_BADGE_CONSULTOR.BLOQUEADO;
    const estadoLabel =
        detalhe?.estadoLabel ??
        LABEL_ESTADO_BADGE_CONSULTOR[estado] ??
        "Estado";

    const progresso = Number(detalhe?.progresso ?? 0);

    const dataCandidatura = formatarData(detalhe?.datas?.candidatura);
    const dataObtencao = formatarData(detalhe?.datas?.obtencao);
    const dataExpiracao = formatarData(detalhe?.datas?.expiracao);
    const dataAvaliacao = formatarData(detalhe?.datas?.avaliacao);

    if (estado === ESTADOS_BADGE_CONSULTOR.EM_PROGRESSO) {
        return (
            <section className="badge-detalhe-estado badge-detalhe-estado--progresso">
                <div className="badge-detalhe-estado-topo">
                    <div>
                        <span className="badge-detalhe-estado-label">
                            {estadoLabel}
                        </span>
                        <h4>Continua a anexar os requisitos necessários.</h4>
                    </div>

                    <strong>{progresso}%</strong>
                </div>

                <div className="badge-detalhe-progressbar">
                    <span style={{ width: `${Math.min(progresso, 100)}%` }} />
                </div>
            </section>
        );
    }

    if (estado === ESTADOS_BADGE_CONSULTOR.BLOQUEADO) {
        return (
            <section className="badge-detalhe-estado badge-detalhe-estado--bloqueado">
                <i className="fi fi-br-lock"></i>
                <div>
                    <span className="badge-detalhe-estado-label">
                        Badge por desbloquear
                    </span>
                    <h4>Ainda não iniciaste este badge.</h4>
                    <p>
                        Começa por anexar um ficheiro a um dos requisitos.
                        Depois do primeiro anexo, o badge passa para Em
                        Progresso.
                    </p>
                </div>
            </section>
        );
    }

    if (estado === ESTADOS_BADGE_CONSULTOR.PENDENTE) {
        return (
            <section className="badge-detalhe-estado badge-detalhe-estado--pendente">
                <i className="fi fi-br-clock"></i>
                <div>
                    <span className="badge-detalhe-estado-label">
                        Aprovação pendente
                    </span>
                    <h4>A tua candidatura foi submetida.</h4>
                    <p>
                        {dataCandidatura
                            ? `Submetida em ${dataCandidatura}. `
                            : ""}
                        O Talent Manager e o Service Line irão analisar a candidatura e dar
                        feedback em breve.
                    </p>
                </div>
            </section>
        );
    }

    if (estado === ESTADOS_BADGE_CONSULTOR.CONQUISTADO) {
        return (
            <section className="badge-detalhe-estado badge-detalhe-estado--conquistado">
                <i className="fi fi-br-check-circle"></i>
                <div>
                    <span className="badge-detalhe-estado-label">
                        Badge conquistado
                    </span>
                    <h4>Parabéns! Este badge foi aprovado.</h4>
                    <p>
                        {dataObtencao
                            ? `Conquistado em ${dataObtencao}. `
                            : ""}
                        {dataExpiracao
                            ? `Expira em ${dataExpiracao}.`
                            : "Podes consultar e partilhar a página pública deste badge."}
                    </p>
                </div>
            </section>
        );
    }

    if (estado === ESTADOS_BADGE_CONSULTOR.EXPIRADO) {
        return (
            <section className="badge-detalhe-estado badge-detalhe-estado--expirado">
                <i className="fi fi-br-time-past"></i>
                <div>
                    <span className="badge-detalhe-estado-label">
                        Badge expirado
                    </span>
                    <h4>Este badge perdeu a validade.</h4>
                    <p>
                        {dataExpiracao
                            ? `Expirou em ${dataExpiracao}. `
                            : ""}
                        Para manteres a competência atualizada, podes renovar
                        este badge.
                    </p>
                </div>
            </section>
        );
    }

    if (estado === ESTADOS_BADGE_CONSULTOR.RECUSADO) {
        return (
            <section className="badge-detalhe-estado badge-detalhe-estado--recusado">
                <i className="fi fi-br-cross-circle"></i>
                <div>
                    <span className="badge-detalhe-estado-label">
                        Candidatura recusada
                    </span>
                    <h4>A tua candidatura não foi aprovada.</h4>
                    <p>
                        {dataAvaliacao
                            ? `Avaliada em ${dataAvaliacao}. `
                            : ""}
                        Revê o feedback antes de submeter
                        novamente.
                    </p>

                    {detalhe?.feedback && (
                        <div className="badge-detalhe-feedback">
                            <strong>Feedback:</strong>
                            <p>{detalhe.feedback}</p>
                        </div>
                    )}
                </div>
            </section>
        );
    }

    return null;
}

export default BadgeDetalheEstadoConsultor;