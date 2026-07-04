import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../App.css';
import './Perfil.css';
import api from '../../services/api.js';
import { handleLogout } from '../../functions/log_out.js';
import { obterUrlPublicaBadge } from '../../utils/badgeDetalheNormalizadores';

import user_logo from "../../assets/utilizador.png";
import badge_logo from '../../assets/teste_badge.png';

const Render_Badges = ({ badges, edicao, onAdd, assinaturaBadges }) => {
  return (
    <>
      {badges.map((badge) => {
        const isSelected = assinaturaBadges.some(b => b.id === badge.id);
        return (
          <div key={badge.id}
            className='badge_item d-flex flex-column align-items-center text-center position-relative'
            style={{ cursor: edicao && !isSelected ? 'pointer' : 'default', opacity: isSelected ? 0.5 : 1 }}
            onClick={() => { if (edicao && !isSelected) onAdd(badge) }}>
            <img src={badge.Imagem} alt={badge.nome} />
            <span className='badge_nome'>{badge.nome}</span>
            {edicao && !isSelected && (
              <div className="position-absolute top-0 end-0 bg-success text-white rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: '24px', height: '24px', transform: 'translate(25%, -25%)' }}>
                <i className="fi fi-br-plus" style={{ fontSize: '10px', display: 'flex', lineHeight: 1 }}></i>
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

const Assinatura = ({ badges, edicao, onRemove }) => {
  return (
    <>
      {badges.map((badge) => {
        const urlAbsoluta = `${window.location.origin}${obterUrlPublicaBadge(badge.id)}`;
        
        return (
          <div key={badge.id} className='assinatura_badge d-flex align-items-center flex-column justify-content-center position-relative'>
            <a href={urlAbsoluta} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img src={badge.Imagem} alt={badge.nome} />
            </a>
            {edicao && (
              <div className="position-absolute top-0 end-0 bg-danger text-white rounded-circle d-flex align-items-center justify-content-center shadow"
                style={{ width: '24px', height: '24px', cursor: 'pointer', transform: 'translate(25%, -25%)', zIndex: 10 }}
                onClick={() => onRemove(badge)}>
                <i className="fi fi-br-cross" style={{ fontSize: '10px', display: 'flex', lineHeight: 1 }}></i>
              </div>
            )}
          </div>
        );
      })}
      {edicao && badges.length < 4 && (
        <div className='assinatura_badge d-flex align-items-center flex-column justify-content-center'>
          <div className='assinatura_badge_placeholder'>
            <i className="fi fi-br-plus"></i>
          </div>
        </div>
      )}
    </>
  )
}

const Componente_Editavel = ({ value, onChange, tipo = "text", edicao }) => {
  return edicao === false ? (
    <span className='info_valor'>{value}</span>
  ) : (
    <input
      type={tipo}
      value={value}
      onChange={onChange}
      className="edit_input"
    />
  );
};

const BotaoLogout_Concluir = ({ edicao, onConcluir, isSaving }) => {

  const { t } = useTranslation();
  const navigate = useNavigate();

  return edicao === false ? (
    <button className='btn btn_logout d-flex align-items-center gap-2 px-3 py-2 shadow-sm' onClick={() => handleLogout(navigate)}>
      <span>{t('terminar_sessao')}</span>
      <i className="fi fi-br-exit"></i>
    </button>
  ) : (
    <button className='btn btn_logout d-flex align-items-center gap-2 px-3 py-2 shadow-sm' onClick={onConcluir} disabled={isSaving}>
      <span>{isSaving ? "A guardar..." : t('concluir')}</span>
    </button>
  );
};

const PerfilPessoal = () => {

  const navigate = useNavigate();
  const { t } = useTranslation();
  const [edicao, setEdicao] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);
  const assinaturaRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const copiarAssinatura = async () => {
    if (!assinaturaRef.current) return;

    try {
      const htmlParaCopiar = assinaturaRef.current.innerHTML;
      const blobHtml = new Blob([htmlParaCopiar], { type: "text/html" });
      const clipboardItem = new ClipboardItem({ "text/html": blobHtml });

      await navigator.clipboard.write([clipboardItem]);
      alert("Assinatura copiada com sucesso! Faça Ctrl+V no seu email.");
    } catch (erro) {
      console.error("Erro ao copiar:", erro);
      alert("O seu navegador bloqueou a cópia. Tente novamente.");
    }
  };

  // Estados com valores por defeito vazios (à espera da API)
  const [profileData, setProfileData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cargo: "",
    pontos: 0,
    foto: user_logo
  });
  const [assinaturaBadges, setAssinaturaBadges] = useState([]);
  const [badgesObtidos, setBadgesObtidos] = useState([]); // Adicionado novo estado para os badges totais

  // A função que faz a magia acontecer
  const carregarDados = async () => {
    try {
      // Vai buscar o ID que guardaste no login
      const idGuardado = localStorage.getItem('utilizador_id');

      if (!idGuardado) return;

      const roleString = localStorage.getItem('role_softinsa');

      let cargoGuardado = "";

      // 2. Descodificar o JSON do cargo, se ele existir
      if (roleString) {
        try {
          // Transforma a string '{"nome":"Talent...", "icone..."}' num objeto JavaScript
          const roleObjeto = JSON.parse(roleString);
          // Agora já podemos extrair apenas o nome!
          cargoGuardado = roleObjeto.nome || "";
        } catch (error) {
          console.error("Erro ao descodificar o cargo do localStorage:", error);
          // Se der erro, o cargoGuardado continua a ser a string vazia
        }
      }

      // Usa a tua instância 'api' configurada (não precisa de axios solto)
      const res = await api.get('/profile/getuser', {
        params: { id: idGuardado, cargo: cargoGuardado }
      });

      const data = res.data;

      // 1. Atualizar Perfil
      setProfileData({
        nome: data.nome || "Nome não definido",
        email: data.email || "",
        telefone: data.telefone || "",
        cargo: data.cargo || "",
        pontos: data.pontos || 0,
        foto: data.foto || user_logo // Fallback de segurança da foto
      });

      // 2. Formatar e guardar todos os Badges obtidos
      const badgesFormatados = data.badges.map(b => ({
        id: b.id,
        nome: b.nome,
        // Traduzimos 'imagem' da API para o 'Imagem' que os teus componentes usam
        Imagem: b.imagem || badge_logo,
        data_obtencao: b.data_obtencao
      }));
      setBadgesObtidos(badgesFormatados);

      // 3. Montar a Assinatura com base nos IDs devolvidos
      if (data.assinaturas_ids && data.assinaturas_ids.length > 0) {
        // Filtra a lista de badges para encontrar apenas os que estão na assinatura
        const badgesDaAssinatura = badgesFormatados.filter(badge =>
          data.assinaturas_ids.includes(badge.id)
        );
        setAssinaturaBadges(badgesDaAssinatura);
      }

    } catch (error) {
      console.error("Erro ao carregar dados do perfil:", error);
    }
  };

  // O useEffect chama a função carregarDados mal a página arranca!
  useEffect(() => {
    carregarDados();
  }, []);


  const handleAddBadge = (badge) => {
    if (assinaturaBadges.length < 4) {
      setAssinaturaBadges([...assinaturaBadges, badge]);
    }
  };

  const handleRemoveBadge = (badgeToRemove) => {
    setAssinaturaBadges(assinaturaBadges.filter(b => b.id !== badgeToRemove.id));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleConcluir = async () => {
    try {
      setIsSaving(true);
      const idGuardado = localStorage.getItem('utilizador_id');
      if (!idGuardado) {
        setIsSaving(false);
        return;
      }

      // 1. Fazer upload da foto de perfil se houver uma nova (via endpoint de utilizadores)
      if (selectedFile) {
        const formData = new FormData();
        formData.append("nome_user", profileData.nome);
        formData.append("email", profileData.email);
        formData.append("telefone", profileData.telefone);
        formData.append("imagem", selectedFile);
        
        await api.put(`/utilizadores/${idGuardado}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        setProfileData(prev => ({ ...prev, foto: previewUrl }));
        setSelectedFile(null);
      }

      // 2. Atualizar perfil e assinatura (via endpoint de profile)
      const badgesParaEnviar = assinaturaBadges.map(b => ({ id_badge: b.id }));

      await api.post('/profile/updateassinatura', {
        id_utilizador: parseInt(idGuardado),
        nome: profileData.nome,
        email: profileData.email,
        telefone: profileData.telefone,
        badges: badgesParaEnviar
      });

      setEdicao(false);
      window.location.reload();
    } catch (error) {
      console.error('Erro ao guardar perfil:', error);
      alert("Houve um erro ao tentar guardar as tuas alterações.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='perfil-container w-100'>
      {/* Cabeçalho Superior */}
      <div className='d-flex justify-content-between align-items-center'>
        <div className='d-flex align-items-center gap-3'>
          <h1 className='texto-titulo-principal mb-0'>{t('perfil_pessoal')}</h1>
          <button className='btn_edit_assinatura p-1 border-0 bg-transparent d-flex align-items-center justify-content-center'>
            {edicao === false ? (
              <i className="fi fi-br-pencil edit_icon" onClick={() => setEdicao(!edicao)}></i>
            ) : null}
          </button>
        </div>
        <BotaoLogout_Concluir edicao={edicao} onConcluir={handleConcluir} isSaving={isSaving} />
      </div>

      <div className='row g-4'>
        {/* Informação Pessoal */}
        <div className='col-lg-6 col-12 d-flex flex-column'>
          <h2 className='subtitulo_perfil mb-3'>{t('info_pessoal')}</h2>
          <div className='d-flex align-items-center gap-4 flex-grow-1'>
            <div className='avatar_wrapper flex-shrink-0'>
              <img src={previewUrl || profileData.foto} alt={profileData.nome} className="avatar_img" />
              {edicao && (
                <div className="imagem_overlay" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                  <i className="fi fi-br-camera"></i>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
              />
            </div>
            <div className='info_dados d-flex flex-column gap-3'>
              <p className='info_dado_item m-0'>
                <span className='info_label'>{t('pontos_dots')}</span>
                <span className='info_valor'>{profileData.pontos}</span>
              </p>
              <p className='info_dado_item m-0'>
                <span className='info_label'>{t('nome_dots')}</span>
                <Componente_Editavel value={profileData.nome} onChange={(e) => setProfileData({ ...profileData, nome: e.target.value })}
                  edicao={edicao} />
              </p>
              <p className='info_dado_item m-0'>
                <span className='info_label'>{t('email_dots')}</span>
                <Componente_Editavel value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  edicao={edicao} />
              </p>
              <p className='info_dado_item m-0'>
                <span className='info_label'>{t('telefone_dots')}</span>
                <Componente_Editavel value={profileData.telefone} onChange={(e) => setProfileData({ ...profileData, telefone: e.target.value })}
                  edicao={edicao} />
              </p>
            </div>
          </div>
        </div>

        {/* Assinatura Pessoal */}
        <div className='col-lg-6 col-12 d-flex flex-column'>
          <h2 className='subtitulo_perfil mb-3'>{t('assinatura_pessoal')}</h2>
          <div className='perfil-card d-flex flex-column align-items-center justify-content-center flex-grow-1 position-relative'>
            <button className='btn_copiar_assinatura' onClick={copiarAssinatura} title={t('copiar')}>
              <i className="fi fi-br-copy"></i>
            </button>
            <div ref={assinaturaRef}>
              <div className='assinatura_texto text-center mb-2'>
                <h4 className='assinatura_nome m-0'>{profileData.nome} | {profileData.cargo}</h4>
                <p className='assinatura_contacto m-0 mt-1'>{profileData.email} | {profileData.telefone}</p>
              </div>
              <div className='assinatura_badges d-flex gap-3 justify-content-center w-100 flex-wrap'>
                <Assinatura badges={assinaturaBadges} edicao={edicao} onRemove={handleRemoveBadge} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Pessoais */}
      <div className='row'>
        <div className='col-12'>
          <div className='perfil-card'>
            <h2 className='subtitulo_perfil mb-4'>{t('badges_pessoais')}</h2>
            <div className='badges_scroll_box'>
              <div className='badges_scroll_container'>
                <Render_Badges badges={badgesObtidos} edicao={edicao} onAdd={handleAddBadge} assinaturaBadges={assinaturaBadges} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerfilPessoal;