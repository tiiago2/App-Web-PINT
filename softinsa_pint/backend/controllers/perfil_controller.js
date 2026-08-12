const { Utilizador } = require('../models');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary using env variables if not already initialized
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

exports.atualizarFotoPerfil = async (req, res) => {
  try {
    // 1. Validar se o ficheiro foi recebido
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'O ficheiro de imagem não foi recebido corretamente ou está em falta.'
      });
    }

    // 2. Upload para o Cloudinary com um timeout de 12 segundos
    const uploadPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('CloudinaryTimeout'));
      }, 12000); // 12 segundos

      const stream = cloudinary.uploader.upload_stream(
        { folder: 'perfis' },
        (error, result) => {
          clearTimeout(timeout);
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const uploadResult = await uploadPromise;

    // 3. Obter o ID do utilizador autenticado
    const idUtilizador = req.mobileAuth?.id_utilizador || req.user?.id_utilizador || req.utilizadorLogado?.id_utilizador;
    if (!idUtilizador) {
      return res.status(401).json({
        success: false,
        message: 'Utilizador não autenticado ou sessão inválida.'
      });
    }

    // 4. Atualizar no PostgreSQL
    await Utilizador.update(
      { imagem_perfil: uploadResult.secure_url },
      { where: { id_utilizador: idUtilizador } }
    );

    return res.status(200).json({
      success: true,
      message: 'Foto de perfil updated successfully.',
      url: uploadResult.secure_url,
    });

  } catch (error) {
    console.error('❌ Erro no Upload de Foto:', error);

    if (error.message === 'CloudinaryTimeout') {
      return res.status(504).json({
        success: false,
        message: 'O servidor do Cloudinary expirou (timeout). Tente novamente.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar upload da foto.',
      error: error.message,
    });
  }
};
