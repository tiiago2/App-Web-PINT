const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,              
    secure: false,          
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

/**
 * Envia um email usando a configuração do Nodemailer já existente no projeto.
 *
 * @param {Object} options
 * @param {string} options.to      Email do destinatário
 * @param {string} options.subject Assunto do email
 * @param {string} [options.html]  Corpo em HTML
 * @param {string} [options.text]  Corpo em texto plano (fallback)
 * @returns {Promise<Object>}      Resultado do sendMail
 */
async function enviarEmail({ to, subject, html, text }) {
    try {
        const resultado = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            html,
            text
        });
        return { sucesso: true, resultado };
    } catch (erro) {
        console.error(`Erro ao enviar email para ${to}:`, erro.message);
        return { sucesso: false, erro };
    }
}

module.exports = { enviarEmail };
