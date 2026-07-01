export const calcularTempoRestante = (dataString) => {
  const dataFim = new Date(dataString);
  const agora = new Date();

  const diferencaMs = dataFim - agora;
  const isExpirado = diferencaMs <= 0;
  const absMs = Math.abs(diferencaMs);

  const dias = Math.floor(absMs / (1000 * 60 * 60 * 24));
  const horas = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (isExpirado) {
      if (dias > 0) {
          return `Expirado há ${dias} dias`;
      } else {
          return `Expirado há ${horas} horas`;
      }
  } else {
      if (dias > 0) {
          return `Expira em ${dias} dias`;
      } else {
          return `Expira em ${horas} horas`;
      }
  }
};
