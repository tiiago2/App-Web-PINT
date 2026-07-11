import { useContext } from "react";
import { ToastContext } from "../contexts/ToastContext.jsx";

export default function useToast() {
  const contexto = useContext(ToastContext);
  if (!contexto) {
    throw new Error("useToast deve ser usado dentro de um ToastProvider");
  }
  return contexto;
}
