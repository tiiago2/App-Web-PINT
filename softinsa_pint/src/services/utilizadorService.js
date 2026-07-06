import api from "./api";

export async function obterUtilizadores(filtros = {}) {
  try {
    const res = await api.get("/utilizadores", { params: filtros });
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error("Erro ao obter utilizadores:", error);
    throw error;
  }
}

export async function obterEstatisticasUtilizadores() {
  try {
    const res = await api.get("/utilizadores/estatisticas");
    return res.data || { total: 0, ativos: 0, inativos: 0, administradores: 0 };
  } catch (error) {
    console.error("Erro ao obter estatísticas:", error);
    return { total: 0, ativos: 0, inativos: 0, administradores: 0 };
  }
}

export async function obterRoles() {
  try {
    const res = await api.get("/utilizadores/roles");
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error("Erro ao obter roles:", error);
    throw error;
  }
}

export async function criarUtilizador(dados) {
  try {
    const formData = new FormData();

    Object.keys(dados).forEach((key) => {
      const value = dados[key];
      if (value === undefined || value === null) return;

      if (key === "roles" && Array.isArray(value)) {
        formData.append("roles", JSON.stringify(value));
      } else if (key === "imagem" && value instanceof File) {
        formData.append("imagem", value);
      } else {
        formData.append(key, value);
      }
    });

    const res = await api.post("/utilizadores", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error) {
    console.error("Erro ao criar utilizador:", error);
    throw error;
  }
}

export async function atualizarUtilizador(id, dados) {
  try {
    const formData = new FormData();

    Object.keys(dados).forEach((key) => {
      const value = dados[key];
      if (value === undefined || value === null) return;

      if (key === "roles" && Array.isArray(value)) {
        formData.append("roles", JSON.stringify(value));
      } else if (key === "imagem" && value instanceof File) {
        formData.append("imagem", value);
      } else {
        formData.append(key, value);
      }
    });

    const res = await api.put(`/utilizadores/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error) {
    console.error("Erro ao atualizar utilizador:", error);
    throw error;
  }
}


