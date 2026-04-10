import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {BotaoVerMais} from '../../components/components.jsx'

const HomeTalent = ({ user, saudacao }) => {

    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

  return(
    <div className="m-4">
        <div className="row">
            <h1>{saudacao}</h1>
        </div>
        <div className="row mt-3">
            <div className="col-8 mx-2" id="candidaturas_container">
                <div className="d-flex justify-content-between align-items-center">
                            <div className="ms-2">
                                <h4 className="m-0">{t('candidaturas_recentes')}</h4>
                            </div>
                            <div>
                                <BotaoVerMais onClick={() => navigate('/candidaturas')}/>
                            </div>
                        </div>
                        
                        <div className="row">
                            
                            {/* CARTÃO 1 -----------------------------------colocar vetor---------------------------------*/}
                            <div className="col-4">
                                <div className="card text-center border-0 shadow-sm rounded-4 p-3">
                                    {/* Ícone Circular (Azul) */}
                                    <div className="mx-auto mt-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', backgroundColor: '#aaccff', color: '#0055ff' }}>
                                        <i className="fi fi-br-bolt fs-4"></i>
                                    </div>
                                    
                                    <h6 className="mt-3 fw-bold mb-0">Low Code</h6>
                                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>100%</span>
                                    
                                    {/* Barra de Progresso */}
                                    <div className="progress my-2" style={{ height: '5px' }}>
                                        <div className="progress-bar bg-success" style={{ width: '100%' }}></div>
                                    </div>
                                    
                                    {/* Info do Utilizador */}
                                    <div className="d-flex align-items-center justify-content-center my-2">
                                        {/* Se tiveres a imagem importada podes usar: <img src={user_logo} ... /> */}
                                        <div className="bg-secondary bg-opacity-25 rounded-circle me-2 d-flex justify-content-center align-items-center" style={{ width: '30px', height: '30px' }}>
                                            <i className="fi fi-sr-user text-secondary" style={{ fontSize: '0.8rem' }}></i>
                                        </div>
                                        <div className="text-start">
                                            <div className="fw-bold text-dark" style={{ fontSize: '0.8rem', lineHeight: '1' }}>João Silva</div>
                                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>Hybrid Systems</div>
                                        </div>
                                    </div>
                                    
                                    <div className="text-muted mb-3" style={{ fontSize: '0.7rem' }}>Há 2 horas</div>
                                    
                                    {/* Botões de Ação */}
                                    <div className="d-flex justify-content-center gap-1">
                                        <BotaoVerMais onClick={() => navigate('/candidaturas')}/>
                                        <button className="btn btn-success btn-sm px-2 rounded-3" style={{ fontSize: '0.7rem' }}>
                                            <i className="fi fi-br-check"></i> Aceitar
                                        </button>
                                        <button className="btn btn-danger btn-sm px-2 rounded-3" style={{ fontSize: '0.7rem' }}>
                                            <i className="fi fi-br-cross"></i> Rejeitar
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* CARTÃO 2 */}
                            <div className="col-4">
                                <div className="card text-center border-0 shadow-sm rounded-4 p-3">
                                    {/* Ícone Circular (Verde) */}
                                    <div className="mx-auto mt-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', backgroundColor: '#cceebb', color: '#55aa22' }}>
                                        <i className="fi fi-br-cpu fs-4"></i>
                                    </div>
                                    <h6 className="mt-3 fw-bold mb-0">Low Code</h6>
                                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>100%</span>
                                    <div className="progress my-2" style={{ height: '5px' }}>
                                        <div className="progress-bar bg-success" style={{ width: '100%' }}></div>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-center my-2">
                                        <div className="bg-secondary bg-opacity-25 rounded-circle me-2 d-flex justify-content-center align-items-center" style={{ width: '30px', height: '30px' }}>
                                            <i className="fi fi-sr-user text-secondary" style={{ fontSize: '0.8rem' }}></i>
                                        </div>
                                        <div className="text-start">
                                            <div className="fw-bold text-dark" style={{ fontSize: '0.8rem', lineHeight: '1' }}>João Silva</div>
                                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>Hybrid Systems</div>
                                        </div>
                                    </div>
                                    <div className="text-muted mb-3" style={{ fontSize: '0.7rem' }}>Há 2 horas</div>
                                    <div className="d-flex justify-content-center gap-1">
                                        <BotaoVerMais onClick={() => navigate('/candidaturas')}/>
                                        <button className="btn btn-success btn-sm px-2 rounded-3" style={{ fontSize: '0.7rem' }}><i className="fi fi-br-check"></i> Aceitar</button>
                                        <button className="btn btn-danger btn-sm px-2 rounded-3" style={{ fontSize: '0.7rem' }}><i className="fi fi-br-cross"></i> Rejeitar</button>
                                    </div>
                                </div>
                            </div>

                            {/* CARTÃO 3 */}
                            <div className="col-4">
                                <div className="card text-center border-0 shadow-sm rounded-4 p-3">
                                    {/* Ícone Circular (Amarelo) */}
                                    <div className="mx-auto mt-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', backgroundColor: '#ffeeaa', color: '#dd9900' }}>
                                        <i className="fi fi-br-target fs-4"></i>
                                    </div>
                                    <h6 className="mt-3 fw-bold mb-0">Low Code</h6>
                                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>100%</span>
                                    <div className="progress my-2" style={{ height: '5px' }}>
                                        <div className="progress-bar bg-success" style={{ width: '100%' }}></div>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-center my-2">
                                        <div className="bg-secondary bg-opacity-25 rounded-circle me-2 d-flex justify-content-center align-items-center" style={{ width: '30px', height: '30px' }}>
                                            <i className="fi fi-sr-user text-secondary" style={{ fontSize: '0.8rem' }}></i>
                                        </div>
                                        <div className="text-start">
                                            <div className="fw-bold text-dark" style={{ fontSize: '0.8rem', lineHeight: '1' }}>João Silva</div>
                                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>Hybrid Systems</div>
                                        </div>
                                    </div>
                                    <div className="text-muted mb-3" style={{ fontSize: '0.7rem' }}>Há 2 horas</div>
                                    <div className="d-flex justify-content-center gap-1">
                                        <BotaoVerMais onClick={() => navigate('/candidaturas')}/>
                                        <button className="btn btn-success btn-sm px-2 rounded-3" style={{ fontSize: '0.7rem' }}><i className="fi fi-br-check"></i> Aceitar</button>
                                        <button className="btn btn-danger btn-sm px-2 rounded-3" style={{ fontSize: '0.7rem' }}><i className="fi fi-br-cross"></i> Rejeitar</button>
                                    </div>
                                </div>
                            </div>
                </div>
                
                <div className="">
                    <h1>ola</h1>
                </div>
                <div className="">
                    <h1>ola</h1>
                </div>
            </div>
            <div className="col-4" id="grafico1_container">

            </div>
        </div>
        <div className="row">
            <div className="col-4" id="atividade_container">

            </div>
            <div className="col-4" id="classificacao_container">

            </div>
            <div className="col-4" id="grafico2_container">

            </div>
        </div>
    </div>
  );
};

export default HomeTalent;