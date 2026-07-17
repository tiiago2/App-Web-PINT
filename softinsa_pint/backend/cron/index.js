const cron = require('node-cron');
const checkObjetivos = require('./checkObjetivos');
const checkBadgesExpirados = require('./checkBadgesExpirados');
const checkSubmissoesSla = require('./checkSubmissoesSLA');
const notifyMobileSync = require('./notifyMobileSync');
const mobilePushOutboxService = require('../services/mobile_push_outbox_service');

let mobilePushWorkerRunning = false;

const iniciarCronJobs = () => {
    console.log('⏰ Cron Jobs configurados e prontos.');

    // Executa de minuto a minuto (Apenas para testes!)
    cron.schedule('*/10 * * * *', async () => {
        console.log('A executar rotinas automáticas...');
        
        try {
            await checkObjetivos();
            await checkBadgesExpirados();
            await checkSubmissoesSla();
            console.log('✅ Rotinas concluídas.');
        } catch (error) {
            console.error('❌ Erro nos cron jobs:', error);
        }
    });

    const timezone = process.env.SYNC_CRON_TIMEZONE?.trim();
    cron.schedule('15 3 * * *', async () => {
        try {
            await notifyMobileSync();
        } catch (_) {
            console.error('Erro no trigger diário de sincronização mobile.');
        }
    }, timezone ? { timezone } : {});

    cron.schedule('* * * * *', async () => {
        if (mobilePushWorkerRunning) return;
        mobilePushWorkerRunning = true;
        try {
            await mobilePushOutboxService.processBatch();
        } catch (_) {
            console.error('Erro controlado no worker da push outbox mobile.');
        } finally {
            mobilePushWorkerRunning = false;
        }
    }, timezone ? { timezone } : {});
};

module.exports = iniciarCronJobs;
