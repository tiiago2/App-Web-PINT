import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './home_talent.css';

import badge_logo from '../../assets/teste_badge.png';
import {BotaoVerMais, BotaoAceitar, BotaoRejeitar} from '../../components/components.jsx'

const users = [
    { id: 1, nome: "João Silva", area: "Hybrid Systems" },
    { id: 2, nome: "Maria Ana", area: "Mobile Solutions" }
];

const badges = [
    { id: 1, titulo: "Low Code", imagem: badge_logo, pontos: 100, descricao:"blablablablablablablabla"},
    { id: 2, titulo: "React Native", imagem: badge_logo, pontos: 85, descricao:"blablablablablablablabla"}
];

const candidaturas = [
    { id: 1, user_id: 1, badge_id: 1, data: "2026-04-10T09:15:00" },
    { id: 2, user_id: 2, badge_id: 2, data: "2026-04-09T14:30:00" },
    { id: 3, user_id: 1, badge_id: 2, data: "2026-04-08T10:00:00" }
];

const HomeTalent = ({ user, saudacao }) => {

    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const RenderCandidaturas = () => {
        return candidaturas.map((candidatura) => {
            
            const badge_escolhido = badges.find((search_badge) => search_badge.id === candidatura.badge_id);
            
            const user_escolhido = users.find((search_user) => search_user.id === candidatura.user_id);

            if (!badge_escolhido || !user_escolhido) {
                console.warn(`Erro na BD: Dados em falta na candidatura ID ${candidatura.id}`);
                return null; 
            }

            return(
                <div className="col-4">
                    <div className="card text-center border-0 p-1">
                        <div className="mx-auto mt-2 rounded-circle d-flex align-items-center justify-content-center">
                            <img className="rounded-circle badge_logo_candidaturas" src={badge_escolhido.imagem}/>
                        </div>
                                        
                        <h6 className="mt-2 mb-0">{badge_escolhido.titulo}</h6>
                                        
                        <div className="d-flex align-items-center justify-content-center my-1">
                            <div>
                                <img className="mx-3 rounded-1 user_image_candidaturas" src={user.foto}/>
                            </div>
                            <div className="text-start">
                                <div className="fw-medium nome_candidatura" style={{ fontSize: '0.8rem', lineHeight: '0.8' }}>{user_escolhido.nome}</div>
                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>{user_escolhido.area}</div>
                            </div>
                        </div>
                                        
                        <div className="text-muted mb-2" style={{ fontSize: '0.7rem' }}>{candidatura.data}</div>
                                        
                                        
                        <div className="d-flex justify-content-center gap-1">
                            <BotaoVerMais onClick={() => navigate('/candidaturas')} tamanho={0.7}/>
                            <BotaoAceitar onClick={() => navigate('/candidaturas')} tamanho={0.7}/>
                            <BotaoRejeitar onClick={() => navigate('/candidaturas')} tamanho={0.7}/>
                        </div>
                    </div>
                </div>
            )
        });
    };

  return(
    <div className="m-4">
        <div className="row">
            <h1>{saudacao}</h1>
        </div>
        <div className="row mt-3">
            <div className="col-8 mx-2" style={{ maxHeight: '35vh', overflowY: 'auto', overflowX: 'hidden' }} id="candidaturas_container">
                <div className="d-flex justify-content-between align-items-center">
                    <div className="ms-2">
                        <h4 className="m-0">{t('candidaturas_recentes')}</h4>
                    </div>
                    <div>
                        <BotaoVerMais onClick={() => navigate('/candidaturas')}  tamanho={0.7} />
                    </div>
                </div>
                <div className="row">
                    {RenderCandidaturas()}       
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