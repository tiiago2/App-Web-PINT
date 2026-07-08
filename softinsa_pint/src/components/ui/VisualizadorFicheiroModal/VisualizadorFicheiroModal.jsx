import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./VisualizadorFicheiroModal.css";

export default function VisualizadorFicheiroModal({
    isOpen,
    onClose,
    fileUrl,
    fileName = "Documento Anexado"
}) {
    const { t } = useTranslation();

    // Bloquear scroll do body quando o modal está aberto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen || !fileUrl) return null;

    // Função utilitária para obter a extensão real de um URL
    const getExtension = (url) => {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const parts = pathname.split('.');
            if (parts.length > 1) {
                return parts[parts.length - 1].toLowerCase();
            }
            return "";
        } catch {
            // Fallback caso não seja um URL válido (embora deva ser)
            const parts = url.split('.');
            if (parts.length > 1) {
                return parts[parts.length - 1].toLowerCase();
            }
            return "";
        }
    };

    // Função para gerar link de download forçado via Cloudinary se possível
    const getDownloadUrl = (url) => {
        try {
            const urlObj = new URL(url);
            // Se for Cloudinary, podemos forçar o download inserindo 'fl_attachment'
            if (urlObj.hostname.includes('cloudinary.com')) {
                // Cloudinary URLs têm formato: /.../upload/v1234/public_id.ext
                // Substituir '/upload/' por '/upload/fl_attachment/'
                if (urlObj.pathname.includes('/upload/') && !urlObj.pathname.includes('fl_attachment')) {
                    urlObj.pathname = urlObj.pathname.replace('/upload/', '/upload/fl_attachment/');
                    return urlObj.toString();
                }
            }
            return url;
        } catch {
            return url;
        }
    };

    const ext = getExtension(fileUrl);
    const downloadUrl = getDownloadUrl(fileUrl);

    // Tipos suportados nativamente pelo browser
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
    const isPdf = ext === 'pdf';
    
    // Cloudinary por vezes não envia o content-type ideal para raw documents na visualização sem extensão correta
    const isSupported = isImage || isPdf;

    return (
        <div className="visualizador-modal-overlay" onClick={onClose}>
            <div className="visualizador-modal-container" onClick={(e) => e.stopPropagation()}>
                
                {/* Header */}
                <div className="visualizador-modal-header">
                    <h4>
                        <i className={`fi ${isImage ? 'fi-br-picture' : isPdf ? 'fi-br-document' : 'fi-br-file'}`}></i>
                        <span className="truncate" style={{ maxWidth: '400px' }} title={fileName}>{fileName}</span>
                    </h4>
                    
                    <div className="visualizador-modal-actions">
                        <a 
                            href={downloadUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="visualizador-btn-download"
                            title={t("download_comprovativo", "Fazer Download")}
                            download
                        >
                            <i className="fi fi-br-download"></i>
                            <span className="d-none d-sm-inline">{t("download", "Download")}</span>
                        </a>
                        <button 
                            className="visualizador-modal-close-btn" 
                            onClick={onClose}
                            aria-label="Fechar"
                        >
                            <i className="fi fi-br-cross"></i>
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="visualizador-modal-body">
                    {isImage && (
                        <img 
                            src={fileUrl} 
                            alt={fileName} 
                            className="visualizador-modal-body-img" 
                        />
                    )}

                    {isPdf && (
                        <div className="visualizador-modal-body-pdf">
                            <iframe 
                                src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                                title={fileName}
                                className="visualizador-iframe"
                            ></iframe>
                        </div>
                    )}

                    {!isSupported && (
                        <div className="visualizador-unsupported">
                            <i className="fi fi-br-file-dashed visualizador-unsupported-icon"></i>
                            <h5>{t("pre_visualizacao_indisponivel", "Pré-visualização Indisponível")}</h5>
                            <p>
                                {t("tipo_ficheiro_nao_suportado", "Não é possível apresentar este formato nativamente no navegador. Por favor, faz o download do ficheiro para o visualizar no teu dispositivo.")}
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
