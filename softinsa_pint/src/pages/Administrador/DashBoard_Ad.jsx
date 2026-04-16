import React from 'react';
import { useTranslation } from 'react-i18next';

const DashBoard_Ad = (user, saudacao) => {
    const { t } = useTranslation();
    return(
        <>
        <div>
            <h1>{saudacao}</h1>
            <div classname="mb-4"></div>
            <span classname="ms-2 mb-2 dlock" style={{ fontSize: '0.9rem', color: '#666' }}>Ações Rápidas</span>
            <div classname='d-flex gap-3 flex-wrap'>
                <BotaoRapido cor="#00b4d8" icone="fi-br-user-add" texto="Adicionar Utilizador" />
                <BotaoRapido cor="#ffb703" icone="fi-br-badge" texto="Adicionar Badge" />
                <BotaoRapido cor="#3a5a92" icone="fi-br-users" texto="Consultar Equipa" />
                <BotaoRapido cor="#2dc653" icone="fi-br-apps" texto="Editar Service Lines" />
                <BotaoRapido cor="#f48c06" icone="fi-br-road" texto="Editar Learning Paths" />
                <BotaoRapido cor="#dc2f02" icone="fi-br-crosshair" texto="Editar Áreas" />
            </div>
        </div>

        <div classname='row mb-4 g-3'>
            <div classname='col-4'>
                <Estatisticas titulo="Total de Utilizadores" valor="345" icone="fi-br-users" cor="#3a5a92" />
            </div>
            <div classname='col-4'>
                <Estatisticas titulo="Total de Badges" valor="120" icone="fi-br-badge" cor="#ffb703" />
            </div>
            <div classname='col-4'>
                <Estatisticas titulo="Total de Candidaturas" valor="45" icone="fi-br-document" cor="#00b4d8" />
            </div>
        </div>
        </>
    );
};