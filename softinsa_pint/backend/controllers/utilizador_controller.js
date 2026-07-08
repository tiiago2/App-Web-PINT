const { Utilizador, Consultor, Role, UtilizadorRoles, Area, ServiceLine } = require('../models');
const { Op, Sequelize } = require('sequelize');
const sequelize = require('../config/db.config');
const cloudinary = require('cloudinary').v2;
const bcrypt = require('bcrypt');
const { enviarEmail } = require('../helpers/emailHelper');

// Configure Cloudinary inline
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Helper para fazer upload de imagem para o Cloudinary
async function uploadImagemCloudinary(file) {
  const fileBase64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  const uploadResult = await cloudinary.uploader.upload(fileBase64, {
    folder: 'avatars',
    transformation: [
      { width: 150, height: 150, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  });
  return uploadResult.secure_url;
}

module.exports = {
  async getUtilizadores(req, res) {
    try {
      const {
        ativo,
        role,
        id_area,
        id_service_line,
        ordenar = 'nome'
      } = req.query;

      const where = {};
      if (ativo !== undefined && ativo !== '') {
        where.ativo = String(ativo).toLowerCase() === 'true';
      }

      const include = [
        {
          model: Role,
          attributes: ['id_role', 'nome_role', 'icone_role'],
          through: { attributes: [] }
        },
        {
          model: Consultor,
          attributes: ['id_area'],
          required: false
        }
      ];

      // Filtro por área via tabela Consultor
      if (id_area) {
        const consultorInclude = include.find(i => i.model === Consultor);
        consultorInclude.where = { id_area: Number(id_area) };
        consultorInclude.required = true;
      }

      // Filtro por service line via Consultor -> Area
      if (id_service_line) {
        const areaIds = await Area.findAll({
          where: { id_service_line: Number(id_service_line) },
          attributes: ['id_area'],
          raw: true
        });
        const ids = areaIds.map(a => a.id_area);
        if (ids.length > 0) {
          const consultorInclude = include.find(i => i.model === Consultor);
          consultorInclude.where = { id_area: { [Op.in]: ids } };
          consultorInclude.required = true;
        }
      }

      let order = [['nome_user', 'ASC']];
      if (ordenar === 'recente') {
        order = [['id_utilizador', 'DESC']];
      } else if (ordenar === 'nome') {
        order = [['nome_user', 'ASC']];
      }

      const utilizadores = await Utilizador.findAll({
        where,
        include,
        order
      });

      let resultado = utilizadores.map(u => ({
        ...u.toJSON(),
        roles: u.Roles || [],
        consultor: u.Consultor || null
      }));

      // Filtro por role no backend (garantir match exato)
      if (role) {
        const roleId = Number(role);
        resultado = resultado.filter(u =>
          u.roles.some(r => r.id_role === roleId)
        );
      }

      return res.status(200).json(resultado);
    } catch (error) {
      console.error("Erro ao obter utilizadores:", error);
      return res.status(500).json({ error: "Erro ao obter utilizadores." });
    }
  },

  async getEstatisticas(req, res) {
    try {
      const total = await Utilizador.count();
      const ativos = await Utilizador.count({ where: { ativo: true } });
      const inativos = await Utilizador.count({ where: { ativo: false } });

      const roleAdmin = await Role.findOne({ where: { nome_role: { [Op.iLike]: '%admin%' } } });
      let administradores = 0;
      if (roleAdmin) {
        administradores = await UtilizadorRoles.count({
          where: { id_role: roleAdmin.id_role }
        });
      }

      return res.status(200).json({ total, ativos, inativos, administradores });
    } catch (error) {
      console.error("Erro ao obter estatísticas:", error);
      return res.status(500).json({ error: "Erro ao obter estatísticas." });
    }
  },

  async getRoles(req, res) {
    try {
      const roles = await Role.findAll({
        attributes: ['id_role', 'nome_role', 'icone_role'],
        order: [['nome_role', 'ASC']]
      });
      return res.status(200).json(roles);
    } catch (error) {
      console.error("Erro ao obter roles:", error);
      return res.status(500).json({ error: "Erro ao obter roles." });
    }
  },

  async createUtilizador(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const {
        nome_user,
        email,
        telefone,
        password,
        roles,
        id_area,
        lingua = 'pt'
      } = req.body;

      if (!nome_user || !email || !telefone) {
        await transaction.rollback();
        return res.status(400).json({ error: "Nome, email e telefone são obrigatórios." });
      }

      const passwordFinal = password || "123";

      const existente = await Utilizador.findOne({ where: { email } });
      if (existente) {
        await transaction.rollback();
        return res.status(409).json({ error: "Já existe um utilizador com este email." });
      }

      let imagem_perfil = 'utilizador.png';
      if (req.file) {
        imagem_perfil = await uploadImagemCloudinary(req.file);
      }

      const hashedPassword = await bcrypt.hash(passwordFinal, 10);
      const agora = new Date();

      const novoUtilizador = await Utilizador.create({
        nome_user,
        email,
        telefone,
        password: hashedPassword,
        lingua,
        last_login: agora,
        update_user: agora,
        aceitacao_politicas: false,
        aceitacao_sla: false,
        ativo: true,
        imagem_perfil,
        primeiro_login: true
      }, { transaction });

      let rolesArray = [];
      try {
        rolesArray = roles ? JSON.parse(roles) : [];
      } catch {
        rolesArray = roles ? [roles] : [];
      }
      rolesArray = rolesArray.map(r => Number(r));

      if (rolesArray.length > 0) {
        const utilizadorRoles = rolesArray.map(id_role => ({
          id_utilizador: novoUtilizador.id_utilizador,
          id_role
        }));
        await UtilizadorRoles.bulkCreate(utilizadorRoles, { transaction });
      }

      const roleConsultor = await Role.findOne({
        where: { nome_role: { [Op.iLike]: '%consultor%' } },
        transaction
      });

      if (id_area && roleConsultor && rolesArray.includes(roleConsultor.id_role)) {
        await Consultor.create({
          id_utilizador: novoUtilizador.id_utilizador,
          id_area: Number(id_area),
          nome_user,
          email,
          telefone,
          password: hashedPassword,
          lingua,
          last_login: agora,
          update_user: agora,
          aceitacao_politicas: false,
          aceitacao_sla: false,
          ativo: true,
          imagem_perfil,
          pontos_totais: 0,
          primeiro_login: true
        }, { transaction });
      }

      // Se for Service Line Leader, associar à service line escolhida
      const { id_service_line } = req.body;
      const roleServiceLineLeader = await Role.findOne({
        where: { nome_role: { [Op.iLike]: '%service line leader%' } },
        transaction
      });

      if (id_service_line && roleServiceLineLeader && rolesArray.includes(roleServiceLineLeader.id_role)) {
        await ServiceLine.update(
          { id_lider: novoUtilizador.id_utilizador, updated_service: new Date() },
          { where: { id_service_line: Number(id_service_line) }, transaction }
        );
      }

      await transaction.commit();

      // Enviar email de boas-vindas com as credenciais (assíncrono, não bloqueia a resposta)
      if (email) {
        enviarEmail({
          to: email,
          subject: 'Bem-vindo à plataforma Softinsa',
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <h2 style="color: #39639C;">Bem-vindo, ${nome_user}!</h2>
              <p>A tua conta na plataforma Softinsa foi criada com sucesso.</p>
              <p>Estas são as tuas credenciais de acesso:</p>
              <ul>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Palavra-passe temporária:</strong> ${passwordFinal}</li>
              </ul>
              <p>Recomendamos que alteres a palavra-passe no teu primeiro acesso.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 0.9em; color: #666;">Se não solicitaste a criação desta conta, por favor contacta o administrador.</p>
            </div>
          `,
          text: `Bem-vindo, ${nome_user}!\n\nA tua conta na plataforma Softinsa foi criada com sucesso.\n\nCredenciais de acesso:\nEmail: ${email}\nPalavra-passe temporária: ${passwordFinal}\n\nRecomendamos que alteres a palavra-passe no teu primeiro acesso.\n\nSe não solicitaste a criação desta conta, por favor contacta o administrador.`
        });
      }

      const utilizadorCompleto = await Utilizador.findByPk(novoUtilizador.id_utilizador, {
        include: [
          {
            model: Role,
            attributes: ['id_role', 'nome_role', 'icone_role'],
            through: { attributes: [] }
          }
        ]
      });

      return res.status(201).json({
        ...utilizadorCompleto.toJSON(),
        roles: utilizadorCompleto.Roles || []
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Erro ao criar utilizador:", error);
      return res.status(500).json({ error: "Erro ao criar utilizador." });
    }
  },

  async updateUtilizador(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const {
        nome_user,
        email,
        telefone,
        ativo,
        password,
        roles,
        id_area,
        id_service_line
      } = req.body;

      const user = await Utilizador.findByPk(id);
      if (!user) {
        await transaction.rollback();
        return res.status(404).json({ error: "Utilizador não encontrado." });
      }

      const rolesAtuais = await user.getRoles({ transaction });
      const idsRolesAtuais = rolesAtuais.map(r => r.id_role);

      if (email && email !== user.email) {
        const existente = await Utilizador.findOne({
          where: { email, id_utilizador: { [Op.ne]: id } }
        });
        if (existente) {
          await transaction.rollback();
          return res.status(409).json({ error: "Já existe outro utilizador com este email." });
        }
      }

      let imagem_perfil = user.imagem_perfil;
      if (req.file) {
        imagem_perfil = await uploadImagemCloudinary(req.file);
      }

      const updateData = {
        nome_user: nome_user ?? user.nome_user,
        email: email ?? user.email,
        telefone: telefone ?? user.telefone,
        imagem_perfil,
        update_user: new Date()
      };

      if (ativo !== undefined) {
        updateData.ativo = String(ativo).toLowerCase() === 'true' || ativo === true || ativo === 1;
      }

      if (password) {
        const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#^~_\-+=])[A-Za-z\d@$!%*?&.#^~_\-+=]{8,}$/;
        if (!regexPassword.test(password)) {
          await transaction.rollback();
          return res.status(400).json({ error: "A palavra-passe não cumpre os requisitos mínimos." });
        }
        updateData.password = await bcrypt.hash(password, 10);
        updateData.primeiro_login = true;
      }

      await user.update(updateData, { transaction });

      let rolesArray = idsRolesAtuais;
      if (roles !== undefined) {
        try {
          rolesArray = roles ? JSON.parse(roles) : [];
        } catch {
          rolesArray = roles ? [roles] : [];
        }
        rolesArray = rolesArray.map(r => Number(r));

        await UtilizadorRoles.destroy({
          where: { id_utilizador: id },
          transaction
        });

        if (rolesArray.length > 0) {
          await UtilizadorRoles.bulkCreate(
            rolesArray.map(id_role => ({
              id_utilizador: Number(id),
              id_role
            })),
            { transaction }
          );
        }
      }

      const roleConsultor = await Role.findOne({
        where: { nome_role: { [Op.iLike]: '%consultor%' } },
        transaction
      });
      const roleServiceLineLeader = await Role.findOne({
        where: { nome_role: { [Op.iLike]: '%service line leader%' } },
        transaction
      });

      const temRoleConsultor = roleConsultor && rolesArray.includes(roleConsultor.id_role);
      const temRoleServiceLineLeader = roleServiceLineLeader && rolesArray.includes(roleServiceLineLeader.id_role);

      if (temRoleConsultor) {
        const areaId = id_area ? Number(id_area) : null;
        const consultorExistente = await Consultor.findOne({ where: { id_utilizador: id }, transaction });

        if (consultorExistente) {
          const updateConsultor = {
            nome_user: updateData.nome_user,
            email: updateData.email,
            telefone: updateData.telefone,
            imagem_perfil,
            ativo: updateData.ativo,
            update_user: new Date()
          };
          if (areaId) {
            updateConsultor.id_area = areaId;
          }
          await consultorExistente.update(updateConsultor, { transaction });
        } else if (areaId) {
          const agora = new Date();
          await Consultor.create({
            id_utilizador: Number(id),
            id_area: areaId,
            nome_user: updateData.nome_user,
            email: updateData.email,
            telefone: updateData.telefone,
            password: updateData.password ?? user.password,
            lingua: user.lingua,
            last_login: user.last_login,
            update_user: agora,
            aceitacao_politicas: user.aceitacao_politicas,
            aceitacao_sla: user.aceitacao_sla,
            ativo: updateData.ativo,
            imagem_perfil,
            pontos_totais: 0,
            primeiro_login: user.primeiro_login
          }, { transaction });
        }
      } else {
        await Consultor.destroy({ where: { id_utilizador: id }, transaction });
      }

      if (temRoleServiceLineLeader) {
        const serviceLineId = id_service_line ? Number(id_service_line) : null;
        if (serviceLineId) {
          await ServiceLine.update(
            { id_lider: null, updated_service: new Date() },
            { where: { id_lider: id }, transaction }
          );
          await ServiceLine.update(
            { id_lider: Number(id), updated_service: new Date() },
            { where: { id_service_line: serviceLineId }, transaction }
          );
        }
      } else {
        await ServiceLine.update(
          { id_lider: null, updated_service: new Date() },
          { where: { id_lider: id }, transaction }
        );
      }

      await transaction.commit();

      const utilizadorAtualizado = await Utilizador.findByPk(id, {
        include: [
          {
            model: Role,
            attributes: ['id_role', 'nome_role', 'icone_role'],
            through: { attributes: [] }
          },
          {
            model: Consultor,
            attributes: ['id_area'],
            required: false
          }
        ]
      });

      return res.status(200).json({
        ...utilizadorAtualizado.toJSON(),
        roles: utilizadorAtualizado.Roles || [],
        consultor: utilizadorAtualizado.Consultor || null
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Erro ao atualizar utilizador:", error);
      return res.status(500).json({ error: "Erro ao atualizar utilizador." });
    }
  },

  async aceitarRGPD(req, res) {
    try {
      const { id } = req.params;
      const idUtilizadorLogado = req.utilizadorLogado.id_utilizador;

      if (Number(id) !== idUtilizadorLogado) {
        return res.status(403).json({ error: "Não pode aceitar políticas por outro utilizador." });
      }

      const user = await Utilizador.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: "Utilizador não encontrado." });
      }

      const agora = new Date();

      await user.update({
        aceitacao_politicas: true,
        update_user: agora
      });

      const consultor = await Consultor.findOne({ where: { id_utilizador: id } });
      if (consultor) {
        await consultor.update({
          aceitacao_politicas: true,
          update_user: agora
        });
      }

      return res.status(200).json({ message: "Políticas RGPD aceites com sucesso." });
    } catch (error) {
      console.error("Erro ao aceitar políticas RGPD:", error);
      return res.status(500).json({ error: "Erro ao aceitar políticas RGPD." });
    }
  }
};
