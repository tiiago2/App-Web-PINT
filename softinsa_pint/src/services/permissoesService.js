import api from "./api";

function obterRoleAtiva() {
    const roleGuardada = localStorage.getItem("role_softinsa");

    if (!roleGuardada) {
        return null;
    }

    try {
        const role = JSON.parse(roleGuardada);
        return typeof role === "string" ? role : role?.nome ?? null;
    } catch {
        return roleGuardada;
    }
}

async function verificarToggle(endpoint, descricaoPermissao) {
    try {
        const response = await api.get(endpoint);
        return response.data?.toggle === true;
    } catch (error) {
        console.error(
            `Erro ao verificar permissão ${descricaoPermissao}:`,
            error
        );
        return false;
    }
}

export async function verificarPermissaoPartilhaLinkedIn() {
    try {
        const response = await api.get("/permissoes/partilha-linkedin");
        return response.data?.autorizado === true;
    } catch (error) {
        console.error("Erro ao verificar permissão LinkedIn:", error);
        return false;
    }
}

export async function verificarPermissaoExportacaoBadges({
    modo = "consultor",
} = {}) {
    if (modo === "admin") {
        return true;
    }

    if (modo === "consultor") {
        return verificarToggle(
            "/estatisticasconsultor/permissons",
            "Download de PDFs"
        );
    }

    const role = obterRoleAtiva();

    if (role === "Talent Manager") {
        return verificarToggle(
            "/estatisticastalent/permissons",
            "Exportação de Dados"
        );
    }

    if (role === "Service Line Leader") {
        return verificarToggle(
            "/estatisticasservice/permissons",
            "Gerar Relatórios de Área"
        );
    }

    return false;
}

export function obterRoleAutenticada() {
    return obterRoleAtiva();
}

export async function obterUtilizadorAutenticadoBasico() {
    const idUtilizador = localStorage.getItem("utilizador_id");

    if (!idUtilizador) {
        return {
            id: null,
            nome: "Consultor",
            email: "",
        };
    }

    try {
        const response = await api.get("/getuser", {
            params: { id: idUtilizador },
        });

        return {
            id: Number(idUtilizador),
            nome:
                response.data?.nome_user ??
                response.data?.nome ??
                "Consultor",
            email:
                response.data?.email_user ?? response.data?.email ?? "",
        };
    } catch (error) {
        console.error(
            "Erro ao obter o utilizador autenticado para exportação:",
            error
        );

        return {
            id: Number(idUtilizador),
            nome: "Consultor",
            email: "",
        };
    }
}
