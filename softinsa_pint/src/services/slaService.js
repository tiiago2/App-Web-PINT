import api from './api';

/**
 * Obter a configuração completa de SLA + métricas em tempo real.
 * GET /api/sla
 */
export async function obterConfigSla() {
    const response = await api.get('/sla');
    return response.data;
}

/**
 * Guardar a configuração de prazos SLA e toggle de notificações.
 * PUT /api/sla
 */
export async function guardarConfigSla(config) {
    const response = await api.put('/sla', config);
    return response.data;
}
