import logoSoftinsa from "../assets/logotipo_softinsa.png";

function obterPrimeiroValor(...valores) {
    return valores.find(
        (valor) => valor !== undefined && valor !== null && valor !== ""
    );
}

function obterTextoDeObjeto(valor, campos = []) {
    if (!valor || typeof valor !== "object") {
        return null;
    }

    for (const campo of campos) {
        if (valor[campo] !== undefined && valor[campo] !== null) {
            return valor[campo];
        }
    }

    return null;
}

function normalizarTexto(valor, fallback = "—") {
    return String(obterPrimeiroValor(valor, fallback));
}

function formatarData(valor) {
    if (!valor) {
        return "—";
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
        return "—";
    }

    return data.toLocaleDateString("pt-PT");
}

function obterIdBadge(badge = {}) {
    return badge.id_badge ?? badge.idBadge ?? badge.id;
}

function obterNomeBadge(badge = {}) {
    return normalizarTexto(
        obterPrimeiroValor(
            badge.nome_badge,
            badge.nomeBadge,
            badge.nome,
            badge.badge?.nome_badge
        ),
        "Badge"
    );
}

function obterDescricaoBadge(badge = {}) {
    return normalizarTexto(
        obterPrimeiroValor(
            badge.descricao_badge,
            badge.descricaoBadge,
            badge.descricao,
            badge.badge?.descricao_badge
        ),
        "Sem descrição disponível."
    );
}

function obterHierarquia(badge = {}) {
    const areaObjeto =
        badge.area && typeof badge.area === "object" ? badge.area : null;
    const serviceLineObjeto = areaObjeto?.service_line;
    const learningPathObjeto = serviceLineObjeto?.learning_path;
    const nivelObjeto =
        badge.nivel && typeof badge.nivel === "object" ? badge.nivel : null;

    return {
        nivel: obterPrimeiroValor(
            badge.nome_nivel,
            obterTextoDeObjeto(nivelObjeto, ["nome_nivel", "nome"]),
            typeof badge.nivel === "string" ? badge.nivel : null
        ),
        area: obterPrimeiroValor(
            badge.nomeArea,
            badge.nome_area,
            obterTextoDeObjeto(areaObjeto, ["nome_area", "nome"]),
            typeof badge.area === "string" ? badge.area : null
        ),
        serviceLine: obterPrimeiroValor(
            badge.serviceLine,
            badge.nome_service_line,
            obterTextoDeObjeto(serviceLineObjeto, [
                "nome_service_line",
                "nome",
            ])
        ),
        learningPath: obterPrimeiroValor(
            badge.learningPath,
            badge.nome_learning_path,
            obterTextoDeObjeto(learningPathObjeto, [
                "nome_learning_path",
                "nome",
            ])
        ),
    };
}

function normalizarValidade(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return "Sem expiração";
    }

    const texto = String(valor).trim();

    if (/^\d+$/.test(texto)) {
        return `${Number(texto)} dias`;
    }

    return texto;
}

function normalizarTipo(badge = {}) {
    return badge.especial === true ? "Especial" : "Normal";
}

function criarSlug(valor) {
    return (
        String(valor ?? "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") || "certificado"
    );
}

function obterDataObtencao(badge = {}) {
    return obterPrimeiroValor(
        badge.data_obtencao,
        badge.datas?.obtencao,
        badge.registo?.data_obtencao
    );
}

function obterDataExpiracao(badge = {}) {
    return obterPrimeiroValor(
        badge.data_expiracao,
        badge.datas?.expiracao,
        badge.registo?.data_expiracao
    );
}

function obterIdRegisto(badge = {}) {
    return obterPrimeiroValor(
        badge.registo?.id_registo,
        badge.registo?.id_registo_badge,
        badge.registo?.id,
        badge.id_registo
    );
}

async function urlParaDataUrl(url) {
    if (!url) {
        return null;
    }

    const resposta = await fetch(url);

    if (!resposta.ok) {
        throw new Error("Não foi possível carregar a imagem.");
    }

    const blob = await resposta.blob();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function obterFormatoImagem(dataUrl) {
    if (typeof dataUrl === "string" && dataUrl.startsWith("data:image/jpeg")) {
        return "JPEG";
    }

    if (typeof dataUrl === "string" && dataUrl.startsWith("data:image/webp")) {
        return "WEBP";
    }

    return "PNG";
}

async function carregarJsPdf() {
    const modulo = await import("jspdf");
    return modulo.jsPDF ?? modulo.default?.jsPDF ?? modulo.default;
}

export async function gerarCertificadoBadgePdf({
    badge,
    consultor = {},
    urlPublica,
} = {}) {
    if (!badge?.registo) {
        throw new Error("Badge sem registo de conquista.");
    }

    const jsPDF = await carregarJsPdf();

    if (typeof jsPDF !== "function") {
        throw new Error("Gerador de PDF indisponível.");
    }

    const doc = new jsPDF("landscape", "pt", "a4");
    const larguraPagina = doc.internal.pageSize.getWidth();
    const alturaPagina = doc.internal.pageSize.getHeight();
    const nomeBadge = obterNomeBadge(badge);
    const nomeConsultor = normalizarTexto(
        obterPrimeiroValor(
            consultor.nome,
            consultor.nome_user,
            consultor.nomeUtilizador
        ),
        "Consultor"
    );
    const idBadge = obterIdBadge(badge);
    const hierarquia = obterHierarquia(badge);
    const dataExpiracao = obterDataExpiracao(badge);
    const urlPublicaFinal =
        urlPublica ?? `${window.location.origin}/badges/${idBadge}`;

    doc.setFillColor(245, 249, 255);
    doc.rect(0, 0, larguraPagina, alturaPagina, "F");
    doc.setDrawColor(0, 86, 179);
    doc.setLineWidth(3);
    doc.rect(26, 26, larguraPagina - 52, alturaPagina - 52);

    try {
        const logoDataUrl = await urlParaDataUrl(logoSoftinsa);
        if (logoDataUrl) {
            doc.addImage(
                logoDataUrl,
                obterFormatoImagem(logoDataUrl),
                52,
                44,
                132,
                50
            );
        }
    } catch (error) {
        console.warn("Não foi possível incluir o logótipo no certificado:", error);
    }

    doc.setTextColor(0, 86, 179);
    doc.setFontSize(25);
    doc.text("Certificado de Conquista de Badge", larguraPagina / 2, 92, {
        align: "center",
    });

    doc.setTextColor(35);
    doc.setFontSize(14);
    doc.text("Certifica-se que", larguraPagina / 2, 132, {
        align: "center",
    });

    doc.setFontSize(24);
    doc.setTextColor(20);
    doc.text(nomeConsultor, larguraPagina / 2, 170, { align: "center" });

    doc.setFontSize(14);
    doc.setTextColor(35);
    doc.text("conquistou o badge", larguraPagina / 2, 202, {
        align: "center",
    });

    doc.setFontSize(22);
    doc.setTextColor(0, 86, 179);
    doc.text(nomeBadge, larguraPagina / 2, 236, { align: "center" });

    const imagemBadge = obterPrimeiroValor(
        badge.imagem,
        badge.imagem_badge,
        badge.badge?.imagem
    );

    try {
        const imagemDataUrl = await urlParaDataUrl(imagemBadge);
        if (imagemDataUrl) {
            doc.addImage(
                imagemDataUrl,
                obterFormatoImagem(imagemDataUrl),
                larguraPagina / 2 - 58,
                258,
                116,
                116
            );
        }
    } catch (error) {
        console.warn("Não foi possível incluir a imagem do badge:", error);
        doc.setDrawColor(0, 86, 179);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(larguraPagina / 2 - 58, 258, 116, 116, 8, 8, "FD");
        doc.setFontSize(40);
        doc.setTextColor(0, 86, 179);
        doc.text("B", larguraPagina / 2, 330, { align: "center" });
    }

    const descricao = doc.splitTextToSize(
        `Descrição: ${obterDescricaoBadge(badge)}`,
        larguraPagina - 160
    );

    doc.setFontSize(10);
    doc.setTextColor(70);
    doc.text(descricao, 80, 406);

    doc.text(`Nível: ${normalizarTexto(hierarquia.nivel)}`, 80, 462);
    doc.text(`Área: ${normalizarTexto(hierarquia.area)}`, 80, 484);
    doc.text(
        `Service Line: ${normalizarTexto(hierarquia.serviceLine)}`,
        80,
        506
    );
    doc.text(
        `Learning Path: ${normalizarTexto(hierarquia.learningPath)}`,
        80,
        528
    );

    doc.text(
        `Pontos: ${normalizarTexto(
            obterPrimeiroValor(badge.pontos_badge, badge.pontos),
            "0"
        )}`,
        larguraPagina - 80,
        440,
        { align: "right" }
    );
    doc.text(`Tipo: ${normalizarTipo(badge)}`, larguraPagina - 80, 462, {
        align: "right",
    });
    doc.text(
        `Validade: ${normalizarValidade(
            obterPrimeiroValor(
                badge.validade,
                badge.validade_badge,
                badge.validadeFormatada
            )
        )}`,
        larguraPagina - 80,
        484,
        { align: "right" }
    );
    doc.text(
        `Data de obtenção: ${formatarData(obterDataObtencao(badge))}`,
        larguraPagina - 80,
        506,
        { align: "right" }
    );
    doc.text(
        `Data de expiração: ${
            dataExpiracao ? formatarData(dataExpiracao) : "Sem expiração"
        }`,
        larguraPagina - 80,
        528,
        { align: "right" }
    );
    doc.text(
        `Registo: ${normalizarTexto(obterIdRegisto(badge))}`,
        larguraPagina - 80,
        550,
        { align: "right" }
    );

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
        `Emitido em: ${new Date().toLocaleString("pt-PT")}`,
        80,
        alturaPagina - 66
    );
    doc.text(
        `Página pública: ${urlPublicaFinal}`,
        80,
        alturaPagina - 48
    );
    doc.text(
        "Plataforma de Badges Softinsa",
        larguraPagina / 2,
        alturaPagina - 28,
        { align: "center" }
    );

    doc.save(
        `certificado-badge-${criarSlug(nomeBadge)}-${criarSlug(
            nomeConsultor
        )}.pdf`
    );
}
