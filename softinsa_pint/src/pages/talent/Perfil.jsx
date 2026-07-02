import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../App.css';
import './Perfil.css';
import api from '../../services/api.js';
import { handleLogout } from '../../functions/log_out.js';

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
                <i className="fi fi-br-plus" style={{ fontSize: '10px' }}></i>
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
      {badges.map((badge) => (
        <div key={badge.id} className='assinatura_badge d-flex align-items-center flex-column justify-content-center position-relative'>
          <img src={badge.Imagem} alt={badge.nome} />
          {edicao && (
            <div className="position-absolute top-0 end-0 bg-danger text-white rounded-circle d-flex align-items-center justify-content-center shadow"
              style={{ width: '24px', height: '24px', cursor: 'pointer', transform: 'translate(25%, -25%)' }}
              onClick={() => onRemove(badge)}>
              <i className="fi fi-br-cross" style={{ fontSize: '10px' }}></i>
            </div>
          )}
        </div>
      ))}
      {edicao && badges.length < 4 && (
        <div className='assinatura_badge d-flex align-items-center flex-column justify-content-center bg-light text-muted' style={{ border: '2px dashed #ccc', borderRadius: '50%', cursor: 'default' }}>
          <i className="fi fi-br-plus" style={{ fontSize: '24px' }}></i>
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

const BotaoLogout_Concluir = ({ edicao, setEdicao }) => {

  const { t } = useTranslation();
  const navigate = useNavigate();

  return edicao === false ? (
    <button className='btn btn_logout d-flex align-items-center gap-2 px-3 py-2 shadow-sm' onClick={() => handleLogout(navigate)}>
      <span>{t('terminar_sessao')}</span>
      <i className="fi fi-br-exit"></i>
    </button>
  ) : (
    <button className='btn btn_logout d-flex align-items-center gap-2 px-3 py-2 shadow-sm' onClick={() => setEdicao(!edicao)}>
      <span>{t('concluir')}</span>
    </button>
  );
};

const PerfilPessoal = () => {

  const navigate = useNavigate();
  const { t } = useTranslation();
  const [edicao, setEdicao] = useState(false);

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
        <BotaoLogout_Concluir edicao={edicao} setEdicao={setEdicao} />
      </div>

      <div className='row g-4'>
        {/* Informação Pessoal */}
        <div className='col-lg-6 col-12 d-flex flex-column'>
          <h2 className='subtitulo_perfil mb-3'>{t('info_pessoal')}</h2>
          <div className='d-flex align-items-center gap-4 flex-grow-1'>
            <div className='avatar_wrapper flex-shrink-0'>
              <img src={profileData.foto} alt={profileData.nome} className="avatar_img" />
              {edicao && (
                <div className="imagem_overlay">
                  <i className="fi fi-br-camera"></i>
                </div>
              )}
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
          <div className='perfil-card d-flex flex-column align-items-center justify-content-center flex-grow-1'>
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