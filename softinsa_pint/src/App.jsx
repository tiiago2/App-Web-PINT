import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {menu_lateral} from './defs/barra_lateral.jsx';
import {iconesNotificacao } from './defs/dicionario.jsx';
import './i18n';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
//paginas
import HomeTalent from './pages/home_talent.jsx';
//imagens
import softinsa_logo from './assets/logotipo_softinsa.png';
import user_logo from './assets/utilizador.png';

function App() {

  const { t, i18n } = useTranslation();

  const [user, setUser] = useState({ //-------------trocar para base dados
    nome: "Tiago",
    cargo: "talent",
    foto: user_logo, // a imagem que importaste no topo
    ultimoLoginlogin: '11/11/2025'
  });

  const [paginaAtiva, setPaginaAtiva] = useState('home');

  const [menuItems, setMenuItems] = useState([]);

  const [menuLinguaAberto, setMenuLinguaAberto] = useState(false);

  const [menuNotificacoesAberto, setMenuNotificacoesAberto] = useState(false);

  const [notificacoes, setNotificacoes] = useState([ //-----------------------------------trocar para base dados
    { id: 1, texto: "Submeteu uma nova candidatura para React Developer.", tipo: "Badge", data: "21/08/2025 19:40", remetente: "Ana Silva", lida: false },
    { id: 2, texto: "A reunião de planeamento foi alterada para a sala 3.", tipo: "Aceite", data: "21/08/2025 19:40", remetente: "Carlos Santos", lida: false },
    { id: 3, texto: "O relatório de horas de março foi aprovado.", tipo: "Rejeitada", data: "21/08/2025 19:40", remetente: "Recursos Humanos", lida: false },
    { id: 4, texto: "Novo comentário no teu post de atividade.", tipo: "Sistema", data: "21/08/2025 19:40", remetente: "Rui Costa", lida: false },
    { id: 5, texto: "Bem-vindo à nova plataforma da Softinsa!", tipo: "Candidatura", data: "21/08/2025 19:40", remetente: "João Silva", lida: false },
    { id: 6, texto: "Bem-vindo à nova plataforma da Softinsa!", tipo: "Candidatura", data: "21/08/2025 19:40", remetente: "João Silva", lida: false },
    { id: 7, texto: "Bem-vindo à nova plataforma da Softinsa!", tipo: "Candidatura", data: "21/08/2025 19:40", remetente: "João Silva", lida: false },
    { id: 8, texto: "Bem-vindo à nova plataforma da Softinsa!", tipo: "Candidatura", data: "21/08/2025 19:40", remetente: "João Silva", lida: false },
    { id: 9, texto: "Bem-vindo à nova plataforma da Softinsa!", tipo: "Candidatura", data: "21/08/2025 19:40", remetente: "João Silva", lida: false },
    { id: 10, texto: "Bem-vindo à nova plataforma da Softinsa!", tipo: "Candidatura", data: "21/08/2025 19:40", remetente: "João Silva", lida: false },
    ]);

  // 1. Conta apenas as que não foram lidas (para mostrar no sino)
  const notificacoesNaoLidas = notificacoes.filter(n => !n.lida).length;

  // 2. Pega nas primeiras 50 notificações (assumindo que a base de dados as envia ordenadas das mais recentes para as mais antigas)
  const notificacoesRecentes = notificacoes.slice(0, 30);

  const escolherLingua = (novaLingua) => {
    i18n.changeLanguage(novaLingua); // Faz a magia da tradução acontecer

    setUser((userAnterior) => ({
      ...userAnterior,
      lingua: novaLingua
    }));
    setMenuLinguaAberto(false); 
  };

  const CliqueSino = () => {
    
    setMenuNotificacoesAberto(!menuNotificacoesAberto);

    if (!menuNotificacoesAberto && notificacoesNaoLidas > 0) {
      
      const notificacoesAtualizadas = notificacoes.map((notif) => {
        return { ...notif, lida: true };
      });
      
      setNotificacoes(notificacoesAtualizadas);
    }
  };

  useEffect(() => {
    const itensFiltrados = menu_lateral.filter(item => {
      return item.permissao.includes(user.cargo);
    });

    setMenuItems(itensFiltrados);
  }, [user.cargo]);

  const Saudacao = () => {

        if(!user.ultimoLogin){
            return(t('saudacao_1'));
        }
        else{
            const data_atual = new Date();
            const data_ultimo_login = new Date(user.ultimoLogin);
            const hora_atual = data_atual.getHours();

            const diferencaEmMilissegundos = Math.abs(data_atual - data_ultimo_login);
            const milissegundosNumDia = 1000 * 60 * 60 * 24;

            const diasPassados = diferencaEmMilissegundos / milissegundosNumDia;

            if(diasPassados >= 15){
                return(t('saudacao_15'));
            }
            else if(hora_atual < 6 || hora_atual > 19){
                return(t('saudacao_noite'));
            }
            else if(hora_atual < 12){
                return(t('saudacao_dia'));
            }
            else{
                return(t('saudacao_tarde'));
            }
        }  
    }

    const renderPagina = () =>{
      if(user.cargo === "consultor"){

      }
      if(user.cargo === "talent"){
        if(paginaAtiva === "home"){
          return <HomeTalent user={user} saudacao={Saudacao()}/>
        }
        else if(paginaAtiva === "galeria"){

        }
        else if(paginaAtiva === "estatisticas"){

        }
        else if(paginaAtiva === "candidaturas"){

        }
        else if(paginaAtiva === "utilizadores"){

        }
        else if(paginaAtiva === "atividade"){

        }
      }
      if(user.cargo === "service"){

      }
      if(user.cargo === "admin"){

      }
    }

  return (
    <div className="vh-100 d-flex flex-column" id="layout">
      <header className="d-flex justify-content-between align-items-center px-2 py-1 position-relative z-3" id="barra_horizontal">
        <div id="image_esquerda">
          <img id="softinsa_logo" className="px-2" src={softinsa_logo}  alt="Softinsa Logo"/>
        </div>
        <div className="d-flex align-items-center pe-2" id="info_direita">
          <div className="position-relative">
            <i id="bell_icon" className="fi fi-br-bell pt-1 mx-2" onClick={CliqueSino}></i>
            {!menuNotificacoesAberto && notificacoesNaoLidas > 0 && (
              <span className="d-flex position-absolute translate-middle badge rounded-pill align-items-center justify-content-center" id="bolinha_sino">
                {notificacoesNaoLidas > 9 ? '9+' : notificacoesNaoLidas}
              </span>
            )}
          </div>
          {menuNotificacoesAberto && (
            <div className="position-absolute bg-white shadow-sm p-2 rounded-4" id="pop_up_notification" >

              <h5 className="ms-2 mt-1 mb-2 user-select-none">{t('notificacao_titulo')}</h5>
              <hr className="mt-0 mb-3" style={{ opacity: 0.15 }} />

              <div className="d-flex flex-column gap-1" id="notification_list">
                
                {notificacoesRecentes.length === 0 ? (
                  <p className="text-center my-3">{t('notificacao_vazia')}</p>
                ) : (
                  notificacoesRecentes.map((notif) => (
                    <div key={notif.id} className="d-flex justify-content-between align-items-center p-2 bg-white" id="notification_option">
                      <div className="m-0 pe-2" id="notification_esquerda">
                        <span id="nome_notificacao"><b>{notif.remetente}</b></span>{/*teremos de colocar links para perfil--------------- */}
                        <span id="nome_notificacao">{notif.texto}</span>
                      </div>

                      <div className="d-flex flex-column align-items-center justify-content-center" id="notification_direita">
                        <i className={`${iconesNotificacao[notif.tipo].desenho}`}
                        style={{ color: iconesNotificacao[notif.tipo].cor}}></i>
                        <span>{notif.data}</span>{/*resolver o prooblema da data----------------------*/}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          <span id="flag_icon" className={`flag-icon flag-icon-${user.lingua} flag-icon-squared rounded-circle fs-5 mx-2 `}
          onClick={() => setMenuLinguaAberto(!menuLinguaAberto)}></span>
          {menuLinguaAberto && (
            <div className="position-absolute p-2 rounded-4" id="pop_up_lingua">

              <h5 className="mb-2 ms-2 user-select-none">{t('lingua')}</h5>
              <hr className="mt-0 mb-2" style={{ opacity: 0.15 }} />

              <div className="position-relative d-flex justify-content-center align-items-center mb-1 p-2 user-select-none"
                  onClick={() => escolherLingua('pt')}
                id="pop_up_option"
              >
                <span className="position-absolute start-0 ms-2 flag-icon flag-icon-pt flag-icon-squared rounded-circle fs-4"></span>
                <span>{t('portugues')}</span>
              </div>

              <div className="position-relative d-flex justify-content-center align-items-center mb-1 p-2 user-select-none"
                onClick={() => escolherLingua('es')}
                id="pop_up_option"
              >
                <span className="position-absolute start-0 ms-2 flag-icon flag-icon-es flag-icon-squared rounded-circle fs-4"></span>
                <span>{t('espanhol')}</span>
              </div>

              <div className="position-relative d-flex justify-content-center align-items-center p-2 user-select-none"
                onClick={() => escolherLingua('gb')}
                id="pop_up_option"
              >
                <span className="position-absolute start-0 ms-2 flag-icon flag-icon-gb flag-icon-squared rounded-circle fs-4"></span>
                <span>{t('ingles')}</span>
              </div>
            </div>
          )}
          <div id="name_cargo" className="d-flex flex-column align-items-center mx-2 d-none d-md-flex text-dark">
            <span><b>{user.nome}</b></span>
            <span style={{ fontSize: '0.8rem' }}>{t(user.cargo)}</span>
          </div>
          <img id="user_image" className="mx-3 rounded-2" src={user_logo} width="30" height="30" alt="Utilizador"/>
        </div>
      </header>
      <div className="row m-0 flex-grow-1">
        <div className="col-2" id="barra_lateral">
          <div className="mt-3 justify-content-center">
            {menuItems.map((item) => (
              <div key={item.slug} className={`d-flex align-items-center justify-content-center justify-content-xl-start my-2 ${paginaAtiva === item.slug ? 'pag_ativa' : ''}`}
                onClick={() => setPaginaAtiva(item.slug)} id="item_lateral">
                <i className={`fi ${item.icon} mx-2 fs-5`}></i>
                <span className="ms-2 d-none d-xl-block fs-5">{t(item.label)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="col-10" id="Container">
            {renderPagina()}
        </div>
      </div>
    </div>
  );
}

export default App;