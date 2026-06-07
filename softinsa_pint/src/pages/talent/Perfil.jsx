import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../App.css';
import './Perfil.css';

import user_logo from "../../assets/utilizador.png";
import badge_logo from '../../assets/teste_badge.png';

const User = {
  id: 1,
  nome: "Tiago Lourenço",
  email: "tiagolourenco@gmail.com",
  telefone: "+351 999 999 999",
  pontos: 14600,
  cargo: "Talent Manager",
  foto: user_logo
};

const Assinatura_Pessoal = [
  {
    id: 1,
    nome: "Low Code 1",
    Imagem: badge_logo,
  },
  {
    id: 2, // Nota: Convém que os IDs sejam diferentes
    nome: "Low Code 2",
    Imagem: badge_logo,
  },
  {
    id: 3,
    nome: "Low Code 3",
    Imagem: badge_logo,
  },
  {
    id: 4,
    nome: "Low Code 4",
    Imagem: badge_logo,
  }
];

const Badges_Obtidos = [
  {
    id: 1,
    nome: "Low Code 1",
    Imagem: badge_logo,
  },
  {
    id: 1,
    nome: "Low Code 1",
    Imagem: badge_logo,
  },
  {
    id: 1,
    nome: "Low Code 1",
    Imagem: badge_logo,
  },
  {
    id: 1,
    nome: "Low Code 1",
    Imagem: badge_logo,
  },
  {
    id: 1,
    nome: "Low Code 1",
    Imagem: badge_logo,
  },
  {
    id: 1,
    nome: "Low Code 1",
    Imagem: badge_logo,
  },
  {
    id: 1,
    nome: "Low Code 1",
    Imagem: badge_logo,
  },
  {
    id: 1,
    nome: "Low Code 1",
    Imagem: badge_logo,
  },
  {
    id: 1,
    nome: "Low Code 1",
    Imagem: badge_logo,
  },
  {
    id: 1,
    nome: "Low Code 1",
    Imagem: badge_logo,
  },
  {
    id: 1,
    nome: "Low Code 1",
    Imagem: badge_logo,
  },
  {
    id: 1,
    nome: "Ole Ole",
    Imagem: badge_logo,
  },
];

const Render_Badges = () => {
  return(
    <>
    {Badges_Obtidos.map((badge, index) => (
      <div key={index} className='badge_item d-flex flex-column align-items-center text-center'>
        <img src={badge.Imagem} alt={badge.nome} />
        <span className='badge_nome'>{badge.nome}</span>
      </div>
    ))}
    </>
  )
}

const Assinatura = () => {
  return(
    <>
      {Assinatura_Pessoal.map((badge) => (
        <div key={badge.id} className='assinatura_badge d-flex align-items-center flex-column justify-content-center'>
          <img src={badge.Imagem} alt={badge.nome} />
        </div>
      ))}
    </>
  )}

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

  const {t} = useTranslation();

  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/home ');
  };

  return edicao === false ? (
    <button className='btn btn_logout d-flex align-items-center gap-2 px-3 py-2 shadow-sm' onClick={handleLogout}>
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

  const {t} = useTranslation();

  const [edicao, setEdicao] = useState(false);
  const [profileData, setProfileData] = useState({
    nome: User.nome,
    email: User.email,
    telefone: User.telefone,
    cargo: User.cargo,
    pontos: User.pontos,
    foto: User.foto
  });

  return (
    <div className='container_perfil'>
      {/* Cabeçalho Superior */}
      <div className='header_perfil d-flex justify-content-between align-items-center mb-4'>
        <div className='d-flex'>
          <h1 className='titulo_perfil pe-3'>{t('perfil_pessoal')}</h1>
          <button className='btn_edit_assinatura p-1 border-0 bg-transparent d-flex align-items-center justify-content-center'>
            {edicao === false ? (
              <i className="fi fi-br-pencil edit_icon" onClick={() => setEdicao(!edicao)}></i>
            ) : null}
          </button>
        </div>
        <BotaoLogout_Concluir edicao={edicao} setEdicao={setEdicao} />
      </div>

      <div className='row content_row g-4 mb-4'>
        <div className='col-lg-6 col-12 d-flex flex-column'>
          <h2 className='subtitulo_perfil mb-3'>{t('info_pessoal')}</h2>
          <div className='info_pessoal_wrapper d-flex align-items-center gap-5 flex-grow-1 p-3'>
            <div className='avatar_wrapper d-flex align-items-center justify-content-center'>
              {edicao === false ? (
                <img src={profileData.foto} alt={profileData.nome} className="avatar_img" />
              ) : (
                <>
                <img src={profileData.foto} alt={profileData.nome} className="avatar_img" />
                <div className="imagem_overlay d-flex align-items-center justify-content-center">
                  <i className="fi fi-br-plus"></i>
                </div>
                </>
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
                 edicao={edicao}/>
              </p>
              <p className='info_dado_item m-0'>
                <span className='info_label'>{t('email_dots')}</span>
                <Componente_Editavel value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  edicao={edicao}/>
              </p>
              <p className='info_dado_item m-0'>
                <span className='info_label'>{t('telefone_dots')}</span>
                <Componente_Editavel value={profileData.telefone} onChange={(e) => setProfileData({ ...profileData, telefone: e.target.value })}
                  edicao={edicao}/>
              </p>
            </div>
          </div>
        </div>

        {/* Secção de Assinatura Pessoal */}
        <div className='col-lg-6 col-12 d-flex flex-column'>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <h2 className='subtitulo_perfil m-0'>{t('assinatura_pessoal')}</h2>
          </div>
          <div className='assinatura_card d-flex flex-column align-items-center justify-content-center flex-grow-1'>
            <div className='assinatura_texto text-center mb-3'>
              <h4 className='assinatura_nome m-0'>{profileData.nome} | {profileData.cargo}</h4>
              <p className='assinatura_contacto m-0 mt-1'>{profileData.email} | {profileData.telefone}</p>
            </div>
            <div className='assinatura_badges d-flex gap-3 justify-content-center w-100 flex-wrap'>
              <Assinatura />
            </div>
          </div>
        </div>
      </div>

      {/* Secção Inferior: Badges Pessoais */}
      <div className='row badges_row'>
        <div className='col-12'>
          <div className='badges_container_full'>
            <h2 className='subtitulo_perfil mb-4'>{t('badges_pessoais')}</h2>
            <div className='badges_scroll_box position-relative'>
              <div className='badges_scroll_container d-flex gap-3 overflow-x-auto'>
                <Render_Badges/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerfilPessoal;