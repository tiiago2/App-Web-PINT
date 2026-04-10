import React from 'react';
import { useTranslation } from 'react-i18next';

export function BotaoVerMais({onClick}) {

    const { t } = useTranslation();

    return (
        <button onClick={onClick} className={`btn btn-sm btn-outline-secondary rounded-3 d-flex align-items-center justify-content-center gap-1`}>
            <i className="fi fi-br-eye d-flex align-items-center"></i>
            <span className="d-flex align-items-center">{t('ver_mais')}</span>
        </button>
    );
};