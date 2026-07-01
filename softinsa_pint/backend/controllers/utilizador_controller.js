const { Utilizador } = require('../models');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary inline
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

module.exports = {
  async getUtilizadores(req, res) {
    try {
      const utilizadores = await Utilizador.findAll();
      return res.status(200).json(utilizadores);
    } catch (error) {
      console.error("Erro ao obter utilizadores:", error);
      return res.status(500).json({ error: "Erro ao obter utilizadores." });
    }
  },

  async updateUtilizador(req, res) {
    try {
      const { id } = req.params;
      const { nome_user, email, telefone } = req.body;

      const user = await Utilizador.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: "Utilizador não encontrado." });
      }

      let imagem_perfil = user.imagem_perfil;

      if (req.file) {
        // Converter o buffer do ficheiro numa data URI base64
        const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        
        // Fazer upload para o Cloudinary na pasta 'avatars' com otimizações automáticas
        const uploadResult = await cloudinary.uploader.upload(fileBase64, {
          folder: 'avatars',
          transformation: [
            { width: 150, height: 150, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        });
        imagem_perfil = uploadResult.secure_url;
      }

      await user.update({
        nome_user: nome_user || user.nome_user,
        email: email || user.email,
        telefone: telefone || user.telefone,
        imagem_perfil,
        update_user: new Date()
      });

      return res.status(200).json(user);
    } catch (error) {
      console.error("Erro ao atualizar utilizador:", error);
      return res.status(500).json({ error: "Erro ao atualizar utilizador." });
    }
  }
};
