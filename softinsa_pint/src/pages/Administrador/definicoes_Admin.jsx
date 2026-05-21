import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './definicoes_Admin.css';

function DefinicoesAdmin() {
  const { t } = useTranslation();
  
  // Estado para controlar qual aba está ativa (por defeito: 'utilizadores')
  const [abaAtiva, setAbaAtiva] = useState('utilizadores');

  // Dados das roles e permissões para renderizar a lista dinamicamente
  const rolesPermissoes = [
    { id: 'admin', titulo: t('admin'), descricao: t('acesso_total') },
    { id: 'talent', titulo: t('talent'), descricao: t('acesso_total') },
    { id: 'service', titulo: t('service'), descricao: t('acesso_total') },
    { id: 'consultor', titulo: t('consultor'), descricao: t('acesso_total') }
  ];

  return (
    <div className="definicoes-container w-100">
      <h1 className="definicoes-title">{t('definicoes')}</h1>

      {/* Tabs de navegação */}
      <div className="tabs-container">
        <button 
          className={`btn tab-btn ${abaAtiva === 'utilizadores' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('utilizadores')}
        >
          {t('utilizadores')}
        </button>
        <button 
          className={`btn tab-btn ${abaAtiva === 'notificacoes' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('notificacoes')}
        >
          {t('notificacoes')}
        </button>
        <button 
          className={`btn tab-btn ${abaAtiva === 'rgpd' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('rgpd')}
        >
          {t('politicas_rgpd')}
        </button>
        <button 
          className={`btn tab-btn ${abaAtiva === 'sla' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('sla')}
        >
          {t('sla')}
        </button>
      </div>

      {/* Conteúdo da aba ativa */}
      <div className="content-card">
        {abaAtiva === 'utilizadores' && (
          <>
            <h3 className="section-title">{t('niveis_permissoes')}</h3>
            <p className="section-subtitle">{t('gerir_roles')}</p>

            <div className="roles-list mt-4">
              {rolesPermissoes.map((role) => (
                <div key={role.id} className="role-card">
                  <div className="role-info">
                    <h5>{role.titulo}</h5>
                    <p>{role.descricao}</p>
                  </div>
                  <button className="btn btn-editar">
                    {t('editar')}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {abaAtiva === 'notificacoes' && (
          <div>
            <h3 className="section-title">{t('notificacoes')}</h3>
            <p className="section-subtitle">Configurações de notificações (em desenvolvimento...)</p>
          </div>
        )}

        {abaAtiva === 'rgpd' && (
          <div>
            <h3 className="section-title">{t('politicas_rgpd')}</h3>
            <p className="section-subtitle">Configurações de políticas RGPD (em desenvolvimento...)</p>
          </div>
        )}

        {abaAtiva === 'sla' && (
          <div>
            <h3 className="section-title">{t('sla')}</h3>
            <p className="section-subtitle">Configurações de SLA (em desenvolvimento...)</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DefinicoesAdmin;
