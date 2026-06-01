import React from 'react';
import { useNavigate } from 'react-router-dom';
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
    nome: "Low Code 1",
    Imagem: badge_logo,
  },
];

const Render_Badges = () => {
  return(
    <>
    {Badges_Obtidos.map((badge, index) => (
      <div className='badge_item d-flex flex-column align-items-center text-center'>
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
      {Assinatura_Pessoal.map((badge, index) => (
        <div key={badge.id} className='assinatura_badge d-flex align-items-center flex-column justify-content-center'>
          <img src={badge.Imagem} alt={badge.nome} />
        </div>
      ))}
    </>
  )}

const PerfilPessoal = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Redireciona para a página home elegantemente
    navigate('/home ');
  };

  return (
    <div className='container_perfil'>
      {/* Cabeçalho Superior */}
      <div className='header_perfil d-flex justify-content-between align-items-center mb-4'>
        <h1 className='titulo_perfil'>Perfil Pessoal</h1>
        <button className='btn btn_logout d-flex align-items-center gap-2 px-3 py-2 shadow-sm' onClick={handleLogout}>
          <span>Terminar sessão</span>
          <i className="fi fi-br-exit"></i>
        </button>
      </div>

      <div className='row content_row g-4 mb-4'>
        <div className='col-lg-6 col-12 d-flex flex-column'>
          <h2 className='subtitulo_perfil mb-3'>Informação Pessoal</h2>
          <div className='info_pessoal_wrapper d-flex align-items-center gap-5 flex-grow-1 p-3'>
            <div className='avatar_wrapper d-flex align-items-center justify-content-center'>
              {User.foto ? (
                <img src={User.foto} alt={User.nome} className="avatar_img" />
              ) : (
                <i className="fi fi-br-user avatar_icon"></i>
              )}
            </div>
            <div className='info_dados d-flex flex-column gap-2'>
              <p className='info_dado_item m-0'>
                <span className='info_label'>Pontos: </span>
                <span className='info_valor'>{User.pontos.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}</span>
              </p>
              <p className='info_dado_item m-0'>
                <span className='info_label'>Nome: </span>
                <span className='info_valor'>{User.nome}</span>
              </p>
              <p className='info_dado_item m-0'>
                <span className='info_label'>Email: </span>
                <span className='info_valor'>{User.email}</span>
              </p>
              <p className='info_dado_item m-0'>
                <span className='info_label'>Telefone: </span>
                <span className='info_valor'>{User.telefone}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Secção de Assinatura Pessoal */}
        <div className='col-lg-6 col-12 d-flex flex-column'>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <h2 className='subtitulo_perfil m-0'>Assinatura Pessoal</h2>
            <button className='btn_edit_assinatura p-1 border-0 bg-transparent d-flex align-items-center justify-content-center'>
              <i className="fi fi-br-pencil edit_icon"></i>
            </button>
          </div>
          <div className='assinatura_card d-flex flex-column align-items-center justify-content-center flex-grow-1'>
            <div className='assinatura_texto text-center mb-3'>
              <h4 className='assinatura_nome m-0'>{User.nome} | {User.cargo}</h4>
              <p className='assinatura_contacto m-0 mt-1'>{User.email} | {User.telefone}</p>
            </div>
            <div className='assinatura_badges d-flex gap-3 justify-content-center w-100 flex-wrap'>
              <Assinatura/>
            </div>
          </div>
        </div>
      </div>

      {/* Secção Inferior: Badges Pessoais */}
      <div className='row badges_row'>
        <div className='col-12'>
          <div className='badges_container_full'>
            <h2 className='subtitulo_perfil mb-4'>Badges Pessoais</h2>
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