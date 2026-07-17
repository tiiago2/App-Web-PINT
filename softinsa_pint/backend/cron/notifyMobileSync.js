const {
  notifyAllActiveConsultantsDataChanged
} = require('../services/sync_push_service');

module.exports = async function notifyMobileSync() {
  return notifyAllActiveConsultantsDataChanged({ entity: 'time_based' });
};
