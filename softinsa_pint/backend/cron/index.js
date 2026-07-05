const cron = require('node-cron');
const checkObjetivos = require('./checkObjetivos');
const checkBadgesExpirados = require('./checkBadgesExpirados');
const checkSubmissoesSla = require('./checkSubmissoesSLA');

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
};

module.exports = iniciarCronJobs;