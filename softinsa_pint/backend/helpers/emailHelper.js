const { Resend } = require('resend');

// Inicializa com a chave que vamos colocar no .env
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envia um email usando a API HTTP do Resend
 */
async function enviarEmail({ to, subject, html, text }) {
    try {
        const { data, error } = await resend.emails.send({
            // No plano gratuito, o email de origem tem de ser este:
            from: 'onboarding@resend.dev', 
            to: to,
            subject: subject,
            html: html || `<p>${text}</p>`,
            text: text
        });

        if (error) {
            console.error(`Erro da API do Resend ao enviar para ${to}:`, error.message);
            return { sucesso: false, erro: error };
        }

        return { sucesso: true, resultado: data };

    } catch (erro) {
        console.error(`Erro ao tentar enviar email para ${to}:`, erro.message);
        return { sucesso: false, erro };
    }
}

module.exports = { enviarEmail };
