import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import defaultAvatar from "../../../assets/utilizador.png";
import "./EditarUtilizadorModal.css";

export default function EditarUtilizadorModal({
  isOpen,
  onClose,
  utilizador,
  rolesDisponiveis,
  areas = [],
  serviceLines = [],
  onGuardar,
  saving = false,
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [password, setPassword] = useState("");
  const [rolesSelecionadas, setRolesSelecionadas] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [idArea, setIdArea] = useState("");
  const [idServiceLineConsultor, setIdServiceLineConsultor] = useState("");
  const [idServiceLineLider, setIdServiceLineLider] = useState("");

  useEffect(() => {
    if (isOpen && utilizador) {
      setNome(utilizador.nome_user || "");
      setEmail(utilizador.email || "");
      setTelefone(utilizador.telefone || "");
      setAtivo(utilizador.ativo ?? true);
      setPassword("");
      setSelectedFile(null);
      setPreviewUrl("");
      setRolesSelecionadas(
        utilizador.roles?.map((r) =>
          typeof r === "object" ? r.id_role : Number(r)
        ) || []
      );

      const areaAtual = utilizador.consultor?.id_area;
      const serviceLineLiderAtual = serviceLines.find(
        (sl) => sl.id_lider === utilizador.id_utilizador
      )?.id_service_line;

      setIdArea(areaAtual ? String(areaAtual) : "");
      setIdServiceLineLider(serviceLineLiderAtual ? String(serviceLineLiderAtual) : "");

      if (areaAtual) {
        const area = areas.find((a) => a.id_area === Number(areaAtual));
        setIdServiceLineConsultor(area ? String(area.id_service_line) : "");
      } else {
        setIdServiceLineConsultor("");
      }
    }
  }, [isOpen, utilizador, areas, serviceLines]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !utilizador) return null;

  const getFotoUrl = (imagem) => {
    if (!imagem) return defaultAvatar;
    if (imagem.startsWith("http://") || imagem.startsWith("https://")) {
      return imagem;
    }
    return defaultAvatar;
  };

  const getIniciais = (nome) => {
    if (!nome) return "?";
    return nome
      .split(" ")
      .filter((p) => p)
      .map((p) => p[0].toUpperCase())
      .slice(0, 2)
      .join("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const toggleRole = (idRole) => {
    setRolesSelecionadas((prev) =>
      prev.includes(idRole)
        ? prev.filter((r) => r !== idRole)
        : [...prev, idRole]
    );
  };

  const formatarNomeRole = (nome) => {
    if (!nome) return "";
    return nome
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getRoleByNome = (nome) =>
    rolesDisponiveis.find((r) => r.nome_role?.toLowerCase() === nome);

  const isConsultorSelecionado = () =>
    rolesSelecionadas.includes(getRoleByNome("consultor")?.id_role);

  const isServiceLineLeaderSelecionado = () =>
    rolesSelecionadas.includes(getRoleByNome("service line leader")?.id_role);

  const areasFiltradas = idServiceLineConsultor
    ? areas.filter(
        (a) => String(a.id_service_line) === String(idServiceLineConsultor)
      )
    : areas;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      id_utilizador: utilizador.id_utilizador,
      nome_user: nome,
      email,
      telefone,
      ativo,
      roles: rolesSelecionadas,
      password,
      imagem: selectedFile,
    };

    if (isConsultorSelecionado() && idArea) {
      payload.id_area = Number(idArea);
    }

    if (isServiceLineLeaderSelecionado() && idServiceLineLider) {
      payload.id_service_line = Number(idServiceLineLider);
    }

    onGuardar(payload);
  };

  return ReactDOM.createPortal(
    <div className="editar-user-modal-overlay" onClick={onClose}>
      <div
        className="editar-user-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="editar-user-modal-header">
          <div className="editar-user-modal-header-content">
            {utilizador.imagem_perfil &&
            (utilizador.imagem_perfil.startsWith("http://") ||
              utilizador.imagem_perfil.startsWith("https://")) ? (
              <img
                src={getFotoUrl(utilizador.imagem_perfil)}
                alt={utilizador.nome_user}
                className="editar-user-modal-avatar"
              />
            ) : (
              <div className="editar-user-modal-avatar-iniciais">
                {getIniciais(utilizador.nome_user)}
              </div>
            )}
            <div>
              <h5 className="editar-user-modal-title">Editar Utilizador</h5>
              <p className="editar-user-modal-subtitle">
                Atualize os dados e permissões.
              </p>
            </div>
          </div>
          <button className="editar-user-modal-close" onClick={onClose}>
            <i className="fi fi-br-cross"></i>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="editar-user-modal-body">
          {/* Foto */}
          <div className="editar-user-modal-field">
            <label>Foto de Perfil</label>
            <div className="d-flex align-items-center gap-3">
              <img
                src={previewUrl || getFotoUrl(utilizador.imagem_perfil)}
                alt="Preview"
                className="rounded-circle object-fit-cover"
                width="64"
                height="64"
              />
              <label className="editar-user-modal-file-btn">
                Escolher ficheiro
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </label>
              <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                {selectedFile ? selectedFile.name : "Nenhum ficheiro selecionado"}
              </span>
            </div>
          </div>

          <div className="editar-user-modal-field">
            <label>Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="editar-user-modal-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="editar-user-modal-field">
            <label>Telefone</label>
            <input
              type="number"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              required
            />
          </div>

          <div className="editar-user-modal-field">
            <label>
              Nova Password{" "}
              <span className="text-muted fw-normal">(deixar vazio para não alterar)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="editar-user-modal-toggle">
            <div>
              <label className="editar-user-modal-toggle-label">
                Conta Ativa
              </label>
              <p className="editar-user-modal-toggle-desc">
                Permite o acesso à plataforma.
              </p>
            </div>
            <div className="form-check form-switch m-0">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
              />
            </div>
          </div>

          <div className="editar-user-modal-roles">
            <label className="editar-user-modal-roles-label">Roles</label>
            <div className="editar-user-modal-roles-list">
              {rolesDisponiveis.map((role) => (
                <div
                  key={role.id_role}
                  onClick={() => toggleRole(role.id_role)}
                  className={`editar-user-modal-role-chip ${
                    rolesSelecionadas.includes(role.id_role) ? "active" : ""
                  }`}
                >
                  {formatarNomeRole(role.nome_role)}
                </div>
              ))}
            </div>
          </div>

          {isConsultorSelecionado() && (
            <div className="editar-user-modal-roles">
              <label className="editar-user-modal-roles-label">
                Área do Consultor
              </label>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="editar-user-modal-field-label">Service Line</label>
                  <select
                    className="form-select"
                    value={idServiceLineConsultor}
                    onChange={(e) => {
                      setIdServiceLineConsultor(e.target.value);
                      setIdArea("");
                    }}
                    style={{ borderRadius: "10px" }}
                  >
                    <option value="">Todas as Service Lines</option>
                    {serviceLines.map((sl) => (
                      <option key={sl.id_service_line} value={sl.id_service_line}>
                        {sl.nome_service_line}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-6">
                  <label className="editar-user-modal-field-label">Área *</label>
                  <select
                    className="form-select"
                    value={idArea}
                    onChange={(e) => setIdArea(e.target.value)}
                    required={isConsultorSelecionado()}
                    style={{ borderRadius: "10px" }}
                  >
                    <option value="">Seleciona uma área</option>
                    {areasFiltradas.map((area) => (
                      <option key={area.id_area} value={area.id_area}>
                        {area.nome_area}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {isServiceLineLeaderSelecionado() && (
            <div className="editar-user-modal-roles">
              <label className="editar-user-modal-roles-label">
                Service Line a Liderar
              </label>
              <div className="editar-user-modal-field">
                <label>Service Line *</label>
                <select
                  className="form-select"
                  value={idServiceLineLider}
                  onChange={(e) => setIdServiceLineLider(e.target.value)}
                  required={isServiceLineLeaderSelecionado()}
                  style={{ borderRadius: "10px" }}
                >
                  <option value="">Seleciona uma service line</option>
                  {serviceLines.map((sl) => (
                    <option key={sl.id_service_line} value={sl.id_service_line}>
                      {sl.nome_service_line}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="editar-user-modal-footer">
          <button
            type="button"
            className="editar-user-modal-btn-cancelar"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="editar-user-modal-btn-guardar"
            onClick={handleSubmit}
            disabled={saving}
          >
            <i className="fi fi-br-disk"></i>
            {saving ? "A guardar..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
