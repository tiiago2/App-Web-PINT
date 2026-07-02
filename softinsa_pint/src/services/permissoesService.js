import api from "./api";

export async function verificarPermissaoPartilhaLinkedIn() {
    try {
        const response = await api.get("/permissoes/partilha-linkedin");

        return response.data?.autorizado === true;
    } catch (error) {
        console.error("Erro ao verificar permissão LinkedIn:", error);

        return false;
    }
}