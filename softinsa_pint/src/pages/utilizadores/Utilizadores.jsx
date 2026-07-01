import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import defaultAvatar from "../../assets/utilizador.png";
import "./utilizadores.css";

export default function Utilizadores({ userRole }) {
  const { t } = useTranslation();
  const [utilizadores, setUtilizadores] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pesquisa, setPesquisa] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Campos do formulário
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const isAdmin = userRole === "administrador";

  useEffect(() => {
    carregarUtilizadores();
  }, []);

  const carregarUtilizadores = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/utilizadores");
      setUtilizadores(res.data);
    } catch (error) {
      console.error("Erro ao carregar utilizadores:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setNome(user.nome_user);
    setEmail(user.email);
    setTelefone(user.telefone);
    setSelectedFile(null);
    setPreviewUrl("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser || !isAdmin) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("nome_user", nome);
      formData.append("email", email);
      formData.append("telefone", telefone);
      if (selectedFile) {
        formData.append("imagem", selectedFile);
      }

      const res = await axios.put(
        `http://localhost:5000/api/utilizadores/${selectedUser.id_utilizador}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Atualizar lista local
      setUtilizadores((prev) =>
        prev.map((u) => (u.id_utilizador === selectedUser.id_utilizador ? res.data : u))
      );
      
      // Atualizar utilizador selecionado
      setSelectedUser(res.data);
      setSelectedFile(null);
      setPreviewUrl("");
      alert("Utilizador atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao guardar utilizador:", error);
      alert("Erro ao guardar utilizador.");
    } finally {
      setSaving(false);
    }
  };

  const getFotoUrl = (imagem) => {
    if (!imagem) return defaultAvatar;
    if (imagem.startsWith("http://") || imagem.startsWith("https://")) {
      return imagem;
    }
    return defaultAvatar;
  };

  const filtrados = utilizadores.filter(
    (u) =>
      u.nome_user.toLowerCase().includes(pesquisa.toLowerCase()) ||
      u.email.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <main className="utilizadores-page">
      <div className="utilizadores-topo d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0" style={{ fontSize: "1.75rem", color: "var(--fontes)" }}>
            Gestão de Utilizadores
          </h2>
          <p className="text-muted m-0" style={{ fontSize: "0.9rem" }}>
            {isAdmin 
              ? "Edite perfis e faça upload de imagens de perfil alojadas diretamente no Cloudinary."
              : "Visualize perfis e informações de utilizadores registados."}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center flex-grow-1 py-5 text-secondary">
          A carregar utilizadores...
        </div>
      ) : (
        <div className="utilizadores-conteudo row flex-grow-1 overflow-hidden" style={{ minHeight: 0 }}>
          {/* Coluna da Esquerda: Lista de Utilizadores */}
          <div className="col-12 col-md-6 d-flex flex-column overflow-hidden utilizadores-col-lista" style={{ minHeight: 0 }}>
            <div className="rounded-4 p-3 flex-grow-1 d-flex flex-column overflow-hidden shadow-xs" style={{ minHeight: 0, backgroundColor: "var(--fundo)", border: "var(--borda-principal) solid var(--contorno)" }}>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Pesquisar utilizador por nome ou email..."
                  value={pesquisa}
                  onChange={(e) => setPesquisa(e.target.value)}
                  style={{ borderRadius: "8px", borderColor: "var(--contorno)" }}
                />
              </div>

              <div className="flex-grow-1 overflow-auto custom-scrollbar pe-1 d-flex flex-column gap-2">
                {filtrados.length === 0 ? (
                  <div className="text-center py-5 text-secondary">
                    Nenhum utilizador encontrado.
                  </div>
                ) : (
                  filtrados.map((u) => (
                    <div
                      key={u.id_utilizador}
                      onClick={() => handleSelectUser(u)}
                      className={`user-row-card p-3 rounded-3 d-flex align-items-center justify-content-between cursor-pointer border ${
                        selectedUser?.id_utilizador === u.id_utilizador ? "active-row" : ""
                      }`}
                      style={{ transition: "all 0.2s" }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={getFotoUrl(u.imagem_perfil)}
                          alt={u.nome_user}
                          className="rounded-circle object-fit-cover border"
                          width="48"
                          height="48"
                        />
                        <div>
                          <h6 className="m-0 fw-bold" style={{ color: "var(--fontes)" }}>
                            {u.nome_user}
                          </h6>
                          <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                            {u.email}
                          </span>
                        </div>
                      </div>
                      <div className="d-flex flex-column align-items-end">
                        <span className="badge bg-light text-secondary border px-2 py-1" style={{ fontSize: "0.75rem" }}>
                          Tlf: {u.telefone}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Coluna da Direita: Painel de Edição */}
          <div className="col-12 col-md-6 d-flex flex-column overflow-hidden utilizadores-col-detalhes" style={{ minHeight: 0 }}>
            <div className="utilizadores-detalhes-panel rounded-4 p-4 d-flex flex-column overflow-hidden shadow-xs" style={{ minHeight: 0, backgroundColor: "var(--fundo)", border: "var(--borda-principal) solid var(--contorno)", height: "100%" }}>
              {selectedUser ? (
                <form onSubmit={handleSubmit} className="d-flex flex-column h-100 justify-content-between overflow-auto custom-scrollbar">
                  <div className="d-flex flex-column gap-3">
                    <h4 className="fw-bold mb-1" style={{ color: "var(--fontes)" }}>
                      {isAdmin ? "Editar Perfil" : "Visualizar Perfil"}
                    </h4>
                    <p className="text-muted m-0" style={{ fontSize: "0.85rem" }}>
                      {isAdmin
                        ? "Modifique as credenciais do utilizador e a respetiva foto de perfil."
                        : "Consulte as credenciais do utilizador e a respetiva foto de perfil."}
                    </p>
                    <hr className="my-1" style={{ color: "var(--contorno)" }} />

                    {/* Foto de Perfil Preview */}
                    <div className="d-flex align-items-center gap-4 py-2">
                      <img
                        src={previewUrl || getFotoUrl(selectedUser.imagem_perfil)}
                        alt="Avatar Preview"
                        className="rounded-circle object-fit-cover border"
                        width="80"
                        height="80"
                      />
                      <div className="flex-grow-1">
                        <label className="form-label fw-bold mb-1" style={{ fontSize: "0.85rem", color: "var(--fontes)" }}>
                          Foto de Perfil
                        </label>
                        {!isAdmin ? (
                          <div className="text-muted" style={{ fontSize: "0.85rem" }}>
                            Apenas editável por administradores.
                          </div>
                        ) : (
                          <input
                            type="file"
                            className="form-control"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ fontSize: "0.8rem", borderRadius: "6px" }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Input Nome */}
                    <div className="form-group">
                      <label className="fw-semibold mb-1" style={{ fontSize: "0.85rem", color: "var(--fontes)" }}>
                        Nome do Utilizador
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                        disabled={!isAdmin}
                        style={{ borderRadius: "6px", borderColor: "var(--contorno)" }}
                      />
                    </div>

                    {/* Input Email */}
                    <div className="form-group">
                      <label className="fw-semibold mb-1" style={{ fontSize: "0.85rem", color: "var(--fontes)" }}>
                        Email
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={!isAdmin}
                        style={{ borderRadius: "6px", borderColor: "var(--contorno)" }}
                      />
                    </div>

                    {/* Input Telefone */}
                    <div className="form-group">
                      <label className="fw-semibold mb-1" style={{ fontSize: "0.85rem", color: "var(--fontes)" }}>
                        Telefone
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        required
                        disabled={!isAdmin}
                        style={{ borderRadius: "6px", borderColor: "var(--contorno)" }}
                      />
                    </div>
                  </div>

                  <div className="d-flex gap-3 justify-content-end mt-4 pt-3 border-top" style={{ borderColor: "var(--contorno)" }}>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="btn btn-light px-4"
                      style={{ height: "42px", fontWeight: 500, fontSize: "0.9rem", borderRadius: "8px" }}
                    >
                      {isAdmin ? "Cancelar" : "Fechar"}
                    </button>
                    {isAdmin && (
                      <button
                        type="submit"
                        disabled={saving}
                        className="btn text-white px-4"
                        style={{
                          backgroundColor: "var(--barra_lateral)",
                          height: "42px",
                          fontWeight: 500,
                          fontSize: "0.9rem",
                          borderRadius: "8px",
                        }}
                      >
                        {saving ? "A guardar..." : "Guardar Alterações"}
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 p-4 text-center">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle mb-3"
                    style={{
                      width: "80px",
                      height: "80px",
                      backgroundColor: "var(--fundo_submenu_hover)",
                      border: "var(--borda-principal) solid var(--contorno)",
                    }}
                  >
                    <i className="fi fi-br-users" style={{ fontSize: "2rem", color: "var(--barra_lateral)" }}></i>
                  </div>
                  <h5 className="fw-bold mb-1" style={{ fontSize: "1.1rem", color: "var(--fontes)" }}>
                    {isAdmin ? "Editar Utilizadores" : "Visualizar Utilizadores"}
                  </h5>
                  <p className="m-0 text-muted" style={{ maxWidth: "320px", fontSize: "0.85rem" }}>
                    {isAdmin 
                      ? "Selecione um utilizador da lista na esquerda para começar a editar as suas informações e foto."
                      : "Selecione um utilizador da lista na esquerda para consultar as suas informações."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
