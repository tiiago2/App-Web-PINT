import { useEffect, useRef, useState } from "react";
import BotaoAcao from "../BotaoAcao/BotaoAcao";
import "./BotaoExportar.css";

function BotaoExportar({
    onExportarExcel,
    onExportarPDF,
    className = "",
}) {
    const [aberto, setAberto] = useState(false);
    const [isExportando, setIsExportando] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setAberto(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const alternarMenu = () => {
        if (!isExportando) {
            setAberto((valorAtual) => !valorAtual);
        }
    };

    const executarExportacao = async (callback) => {
        if (isExportando || typeof callback !== "function") {
            return;
        }

        setIsExportando(true);

        try {
            await callback();
            setAberto(false);
        } finally {
            setIsExportando(false);
        }
    };

    return (
        <div
            ref={wrapperRef}
            className={`botao-exportar-wrapper ${className}`.trim()}
        >
            <BotaoAcao
                variante="primario"
                icone="fi-br-download"
                onClick={alternarMenu}
            >
                {isExportando ? "A exportar..." : "Exportar"}
            </BotaoAcao>

            {aberto && (
                <div className="botao-exportar-menu">
                    <button
                        type="button"
                        className="botao-exportar-opcao"
                        onClick={() => executarExportacao(onExportarExcel)}
                    >
                        Excel
                    </button>

                    <button
                        type="button"
                        className="botao-exportar-opcao"
                        onClick={() => executarExportacao(onExportarPDF)}
                    >
                        PDF
                    </button>
                </div>
            )}
        </div>
    );
}

export default BotaoExportar;
