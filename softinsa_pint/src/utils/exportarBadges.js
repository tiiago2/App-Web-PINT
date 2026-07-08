const ERRO_LISTA_VAZIA = "sem_badges_para_exportar";

let dependenciasExportacaoPromise = null;

async function carregarDependenciasExportacao() {
    if (!dependenciasExportacaoPromise) {
        dependenciasExportacaoPromise = Promise.all([
            import("jspdf"),
            import("jspdf-autotable"),
            import("xlsx"),
        ]).then(([jspdfModulo, autoTableModulo, xlsxModulo]) => ({
            jsPDF:
                jspdfModulo.jsPDF ??
                jspdfModulo.default?.jsPDF ??
                jspdfModulo.default,
            autoTable:
                autoTableModulo.default ??
                autoTableModulo.autoTable ??
                autoTableModulo,
            XLSX: xlsxModulo,
        }));
    }

    return dependenciasExportacaoPromise;
}

function obterPrimeiroValor(...valores) {
    return valores.find(
        (valor) => valor !== undefined && valor !== null && valor !== ""
    );
}

function obterTextoDeObjeto(valor, campos = []) {
    if (valor === undefined || valor === null || valor === "") {
        return null;
    }

    if (typeof valor !== "object") {
        return valor;
    }

    for (const campo of campos) {
        if (valor[campo] !== undefined && valor[campo] !== null) {
            return valor[campo];
        }
    }

    return null;
}

function normalizarTexto(valor, fallback = "—") {
    const texto = obterPrimeiroValor(valor, fallback);
    return String(texto ?? fallback);
}

function normalizarNumero(valor, fallback = 0) {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : fallback;
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
    if (
        badge.especial === true ||
        String(badge.tipo ?? badge.tipo_badge ?? "").toLowerCase() ===
            "especial"
    ) {
        return "Especial";
    }

    return "Normal";
}

function normalizarEstadoLegivel(estado) {
    const chave = String(estado ?? "")
        .trim()
        .toLowerCase();

    const mapa = {
        conquistados: "Conquistado",
        conquistado: "Conquistado",
        emprogresso: "Em progresso",
        em_progresso: "Em progresso",
        pendentes: "Pendente",
        pendente: "Pendente",
        recusados: "Recusado",
        recusada: "Recusado",
        recusado: "Recusado",
        expirados: "Expirado",
        expirado: "Expirado",
        bloqueados: "Bloqueado",
        bloqueado: "Bloqueado",
    };

    return mapa[chave] ?? normalizarTexto(estado);
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

function criarNomeFicheiro(prefixo, extensao) {
    const data = new Date().toISOString().slice(0, 10);
    const nomeSeguro = String(prefixo || "Galeria_Badges")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]+/g, "_")
        .replace(/^_+|_+$/g, "");

    return `${nomeSeguro || "Galeria_Badges"}_${data}.${extensao}`;
}

function obterDadosHierarquia(badge = {}) {
    const areaObjeto =
        badge.area && typeof badge.area === "object" ? badge.area : null;
    const serviceLineObjeto =
        areaObjeto?.service_line && typeof areaObjeto.service_line === "object"
            ? areaObjeto.service_line
            : badge.service_line && typeof badge.service_line === "object"
              ? badge.service_line
              : null;
    const learningPathObjeto =
        serviceLineObjeto?.learning_path &&
        typeof serviceLineObjeto.learning_path === "object"
            ? serviceLineObjeto.learning_path
            : badge.learning_path && typeof badge.learning_path === "object"
              ? badge.learning_path
              : null;
    const nivelObjeto =
        badge.nivel && typeof badge.nivel === "object" ? badge.nivel : null;

    return {
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
            ]),
            typeof badge.service_line === "string"
                ? badge.service_line
                : null
        ),
        learningPath: obterPrimeiroValor(
            badge.learningPath,
            badge.nome_learning_path,
            obterTextoDeObjeto(learningPathObjeto, [
                "nome_learning_path",
                "nome",
            ]),
            typeof badge.learning_path === "string"
                ? badge.learning_path
                : null
        ),
        nivel: obterPrimeiroValor(
            badge.nome_nivel,
            obterTextoDeObjeto(nivelObjeto, ["nome_nivel", "nome"]),
            typeof badge.nivel === "string" ? badge.nivel : null
        ),
    };
}

function normalizarBadgeParaExportacao(badge = {}) {
    const hierarquia = obterDadosHierarquia(badge);
    const datas = badge.datas ?? {};
    const registo = badge.registo ?? {};

    return {
        nome: normalizarTexto(
            obterPrimeiroValor(
                badge.nome_badge,
                badge.nomeBadge,
                badge.nome,
                badge.nome_badge_sugerido
            ),
            "Badge sem nome"
        ),
        area: normalizarTexto(hierarquia.area),
        serviceLine: normalizarTexto(hierarquia.serviceLine),
        learningPath: normalizarTexto(hierarquia.learningPath),
        nivel: normalizarTexto(hierarquia.nivel),
        pontos: normalizarNumero(
            obterPrimeiroValor(badge.pontos_badge, badge.pontos)
        ),
        validade: normalizarValidade(
            obterPrimeiroValor(
                badge.validade,
                badge.validade_badge,
                badge.validadeFormatada
            )
        ),
        tipo: normalizarTipo(badge),
        estado: normalizarEstadoLegivel(
            obterPrimeiroValor(badge.estado, badge.estadoLabel)
        ),
        progresso: `${normalizarNumero(badge.progresso)}%`,
        dataCandidatura: formatarData(
            obterPrimeiroValor(badge.data_candidatura, datas.candidatura)
        ),
        dataObtencao: formatarData(
            obterPrimeiroValor(
                badge.data_obtencao,
                datas.obtencao,
                registo.data_obtencao
            )
        ),
        dataExpiracao: formatarData(
            obterPrimeiroValor(
                badge.data_expiracao,
                datas.expiracao,
                registo.data_expiracao
            )
        ),
        renovacao:
            obterPrimeiroValor(
                badge.renovacao,
                badge.isRenovacao,
                badge.submissao?.renovacao
            ) === true
                ? "Sim"
                : "Não",
    };
}

function obterLinhasCatalogo(badges) {
    return badges.map((badge) => {
        const item = normalizarBadgeParaExportacao(badge);

        return {
            Badge: item.nome,
            Área: item.area,
            "Service Line": item.serviceLine,
            "Learning Path": item.learningPath,
            Nível: item.nivel,
            Pontos: item.pontos,
            Validade: item.validade,
            Tipo: item.tipo,
        };
    });
}

function obterLinhasConsultor(badges) {
    return badges.map((badge) => {
        const item = normalizarBadgeParaExportacao(badge);

        return {
            Badge: item.nome,
            Área: item.area,
            "Service Line": item.serviceLine,
            "Learning Path": item.learningPath,
            Nível: item.nivel,
            Pontos: item.pontos,
            Validade: item.validade,
            Tipo: item.tipo,
            Estado: item.estado,
            Progresso: item.progresso,
            "Data da candidatura": item.dataCandidatura,
            "Data de obtenção": item.dataObtencao,
            "Data de expiração": item.dataExpiracao,
            Renovação: item.renovacao,
        };
    });
}

function validarListaBadges(badges) {
    if (!Array.isArray(badges) || badges.length === 0) {
        const erro = new Error("Não existem badges para exportar.");
        erro.codigo = ERRO_LISTA_VAZIA;
        throw erro;
    }
}

function criarMetadados({ titulo, contexto, total }) {
    return [
        ["Relatório", titulo],
        ["Contexto", contexto],
        ["Total", total],
        ["Gerado em", new Date().toLocaleString("pt-PT")],
    ];
}

export function isErroListaVazia(error) {
    return error?.codigo === ERRO_LISTA_VAZIA;
}

export async function exportarBadgesExcel({
    badges = [],
    titulo = "Galeria de Badges",
    contexto = "Galeria",
    tipo = "catalogo",
    nomeFicheiro = "Galeria_Badges",
} = {}) {
    validarListaBadges(badges);

    const { XLSX } = await carregarDependenciasExportacao();
    const linhas =
        tipo === "consultor"
            ? obterLinhasConsultor(badges)
            : obterLinhasCatalogo(badges);

    const livro = XLSX.utils.book_new();
    const folhaResumo = XLSX.utils.aoa_to_sheet(
        criarMetadados({ titulo, contexto, total: linhas.length })
    );
    const folhaBadges = XLSX.utils.json_to_sheet(linhas);

    folhaBadges["!cols"] = Object.keys(linhas[0]).map((coluna) => ({
        wch: Math.max(14, Math.min(28, coluna.length + 6)),
    }));

    XLSX.utils.book_append_sheet(livro, folhaResumo, "Resumo");
    XLSX.utils.book_append_sheet(livro, folhaBadges, "Badges");
    XLSX.writeFile(livro, criarNomeFicheiro(nomeFicheiro, "xlsx"));
}

export async function exportarBadgesPdf({
    badges = [],
    titulo = "Galeria de Badges",
    contexto = "Galeria",
    tipo = "catalogo",
    nomeFicheiro = "Galeria_Badges",
} = {}) {
    validarListaBadges(badges);

    const { jsPDF, autoTable } = await carregarDependenciasExportacao();

    if (typeof jsPDF !== "function" || typeof autoTable !== "function") {
        throw new Error("Dependências de PDF indisponíveis.");
    }

    const linhas =
        tipo === "consultor"
            ? obterLinhasConsultor(badges)
            : obterLinhasCatalogo(badges);
    const colunas = Object.keys(linhas[0]);
    const corpo = linhas.map((linha) =>
        colunas.map((coluna) => linha[coluna])
    );

    const doc = new jsPDF("landscape", "pt", "a4");
    const larguraPagina = doc.internal.pageSize.getWidth();
    const alturaPagina = doc.internal.pageSize.getHeight();

    doc.setFontSize(18);
    doc.setTextColor(0, 86, 179);
    doc.text(titulo, 40, 42);

    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(contexto, 40, 64);
    doc.text(`Total de badges: ${linhas.length}`, 40, 82);
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-PT")}`, 40, 100);

    autoTable(doc, {
        startY: 122,
        head: [colunas],
        body: corpo,
        theme: "striped",
        headStyles: { fillColor: [0, 86, 179] },
        styles: {
            fontSize: tipo === "consultor" ? 7 : 8,
            cellPadding: 4,
            overflow: "linebreak",
        },
        margin: { left: 40, right: 40 },
        didDrawPage: () => {
            doc.setFontSize(8);
            doc.setTextColor(110);
            doc.text(
                `Página ${doc.internal.getNumberOfPages()}`,
                larguraPagina - 40,
                alturaPagina - 20,
                { align: "right" }
            );
        },
    });

    doc.save(criarNomeFicheiro(nomeFicheiro, "pdf"));
}
