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

export const formatarTempo = (dataString) => {
  if (!dataString) return '';
  // Se já vier como texto relativo ("Há 2 horas"), retornar tal como está
  if (typeof dataString === 'string' && dataString.toLowerCase().startsWith('há')) return dataString;

  const data = new Date(dataString);
  if (isNaN(data.getTime())) return dataString; // fallback se não for uma data válida

  const agora = new Date();
  const diffEmSegundos = Math.floor((agora - data) / 1000);

  if (diffEmSegundos < 60) return 'Agora mesmo';
  
  const diffEmMinutos = Math.floor(diffEmSegundos / 60);
  if (diffEmMinutos < 60) return `Há ${diffEmMinutos} ${diffEmMinutos === 1 ? 'minuto' : 'minutos'}`;
  
  const diffEmHoras = Math.floor(diffEmMinutos / 60);
  if (diffEmHoras < 24) return `Há ${diffEmHoras} ${diffEmHoras === 1 ? 'hora' : 'horas'}`;
  
  const diffEmDias = Math.floor(diffEmHoras / 24);
  if (diffEmDias < 30) return `Há ${diffEmDias} ${diffEmDias === 1 ? 'dia' : 'dias'}`;
  
  const diffEmMeses = Math.floor(diffEmDias / 30);
  if (diffEmMeses < 12) return `Há ${diffEmMeses} ${diffEmMeses === 1 ? 'mês' : 'meses'}`;
  
  const diffEmAnos = Math.floor(diffEmMeses / 12);
  return `Há ${diffEmAnos} ${diffEmAnos === 1 ? 'ano' : 'anos'}`;
};

