import React, { useState, useCallback } from "react";
import { ToastContext } from "./ToastContext.jsx";
import ToastNotificacao from "../components/ui/ToastNotificacao/ToastNotificacao";

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({
    visivel: false,
    mensagem: "",
    tipo: "sucesso",
    duracao: 4000,
  });

  const mostrarToast = useCallback((mensagem, tipo = "sucesso", duracao = 4000) => {
    setToast({ visivel: true, mensagem, tipo, duracao });
  }, []);

  const fecharToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visivel: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ mostrarToast, fecharToast }}>
      {children}
      <ToastNotificacao
        visivel={toast.visivel}
        mensagem={toast.mensagem}
        tipo={toast.tipo}
        duracao={toast.duracao}
        onFechar={fecharToast}
      />
    </ToastContext.Provider>
  );
}
