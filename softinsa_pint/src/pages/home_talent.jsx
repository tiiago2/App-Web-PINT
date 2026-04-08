import React from 'react';
import { useTranslation } from 'react-i18next';

const HomeTalent = ({ user, saudacao }) => {

  return(
    <div className="m-4">
        <div className="row">
            <h1>{saudacao}</h1>
        </div>
        <div className="row">
            <div className="col-8" id="candidaturas_container">

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