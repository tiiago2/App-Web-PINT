const { Documentos } = require("../models");
const https = require("https");
const http = require("http");

module.exports = {
  // GET /api/documentos/:id/download
  async downloadDocumento(req, res) {
    try {
      const { id } = req.params;

      const documento = await Documentos.findOne({ where: { id_ficheiro: id } });

      if (!documento) {
        return res.status(404).json({ error: "Documento não encontrado." });
      }

      if (documento.deleted_file) {
        return res.status(410).json({ error: "Este documento foi eliminado." });
      }

      const fileUrl = documento.ficheiro;

      // Determinar o nome do ficheiro (ex: documento_1.pdf)
      let extensao = "pdf";
      try {
        const urlObj = new URL(fileUrl);
        const parts = urlObj.pathname.split(".");
        if (parts.length > 1) {
          extensao = parts[parts.length - 1];
        }
      } catch (e) {
        // Ignorar se não for um URL válido
      }

      const nomeFicheiro = `anexo_${id}.${extensao}`;

      // Vamos usar fetch para todos os URLs remotos (incluindo Cloudinary)
      // O fetch transfere o ficheiro exato, com a versão correta, evitando problemas de cache do Cloudinary.
      if (fileUrl.startsWith("http")) {
        try {
          const fetchResponse = await fetch(fileUrl);
          
          if (!fetchResponse.ok) {
            console.error(`Erro ao descarregar. Status: ${fetchResponse.status}`);
            return res.status(fetchResponse.status).json({ error: "Falha ao obter ficheiro do repositório remoto." });
          }

          const arrayBuffer = await fetchResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          // Configurar cabeçalhos
          res.setHeader("Content-Disposition", `attachment; filename="${nomeFicheiro}"`);
          res.setHeader("Content-Type", "application/octet-stream");
          return res.send(buffer);
        } catch (fetchErr) {
          console.error("Erro no fetch:", fetchErr);
          return res.status(500).json({ error: "Erro de comunicação ao transferir ficheiro." });
        }
      } else {
        res.setHeader("Content-Disposition", `attachment; filename="${nomeFicheiro}"`);
        res.setHeader("Content-Type", "application/octet-stream");
        return res.download(fileUrl, nomeFicheiro);
      }
    } catch (error) {
      console.error("Erro no download de documento:", error);
      res.status(500).json({ error: "Erro interno no servidor ao transferir documento." });
    }
  }
};
