const { MOBILE_SYNC_CONTRACT_VERSION } = require('../config/mobile_sync_contract');
const mobilePushOutboxService = require('./mobile_push_outbox_service');

function emptySummary() {
  return { enviados: 0, falhados: 0, tokens_desativados: 0, enfileirados: 0 };
}

function uniquePositiveIds(values) {
  return [...new Set((values || [])
    .map((value) => Number(value))
    .filter((value) => Number.isSafeInteger(value) && value > 0))];
}

async function notifyUsersDataChanged({ userIds, entity }) {
  const ids = uniquePositiveIds(userIds);
  const summary = emptySummary();

  for (const idUtilizador of ids) {
    try {
      await mobilePushOutboxService.enqueueDataChanged({
        idUtilizador,
        entity,
        version: MOBILE_SYNC_CONTRACT_VERSION
      });
      summary.enfileirados += 1;
    } catch (_) {
      // A fila e best-effort: uma falha nunca afeta a operacao web concluida.
      summary.falhados += 1;
    }
  }
  return summary;
}

async function notifyAllActiveConsultantsDataChanged() {
  // Eventos globais nao fazem fan-out sincrono. O sync continua a ser a fonte
  // de verdade e uma estrategia agregada pode ser adicionada futuramente.
  return emptySummary();
}

function scheduleUsersDataChanged({ userIds, entity }) {
  setImmediate(() => {
    void notifyUsersDataChanged({ userIds, entity });
  });
}

function scheduleAllActiveConsultantsDataChanged({ entity }) {
  setImmediate(() => {
    void notifyAllActiveConsultantsDataChanged({ entity });
  });
}

module.exports = {
  notifyUsersDataChanged,
  notifyAllActiveConsultantsDataChanged,
  scheduleUsersDataChanged,
  scheduleAllActiveConsultantsDataChanged
};
