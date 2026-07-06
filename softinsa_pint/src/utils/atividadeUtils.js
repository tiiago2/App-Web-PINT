/**
 * Converte um item de atividade devolvido pelo backend
 * ({ id, type, user, item, timestamp }) para o formato esperado
 * pelo componente AtividadeModal/AtividadeRecente.
 */
export function mapearAtividadeParaModal(item) {
    if (!item || !item.type) return null;

    switch (item.type) {
        case 'received':
            return {
                icone: 'fi-br-check',
                cor: 'text-success',
                texto: `${item.item || 'Badge'} concluído`,
                tempo: item.timestamp,
                expirado: false
            };
        case 'rejected':
            return {
                icone: 'fi-br-cross',
                cor: 'text-danger',
                texto: `${item.item || 'Badge'} rejeitado`,
                tempo: item.timestamp,
                expirado: false
            };
        case 'updated':
            return {
                icone: 'fi-br-badge',
                cor: 'text-warning',
                textoNegrito: item.user || 'Sistema',
                texto: item.item || '',
                tempo: item.timestamp,
                expirado: false
            };
        case 'policy':
            return {
                icone: 'fi-br-document',
                cor: 'text-primary',
                textoNegrito: item.user || 'Políticas RGPD',
                texto: item.item || 'foram atualizadas',
                tempo: item.timestamp,
                expirado: false
            };
        default:
            return {
                icone: 'fi-br-info',
                cor: 'text-muted',
                texto: `${item.user || 'Sistema'} - ${item.item || ''}`,
                tempo: item.timestamp,
                expirado: false
            };
    }
}
