const { Utilizador, Consultor, Role, UtilizadorRoles, Area, ServiceLine } = require('../models');
const { Op, Sequelize } = require('sequelize');
const sequelize = require('../config/db.config');
const cloudinary = require('cloudinary').v2;
const bcrypt = require('bcrypt');

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

// Helper para sincronizar dados com a tabela Consultor
async function sincronizarConsultor(id, dados) {
  const consultor = await Consultor.findOne({ where: { id_utilizador: id } });
  if (consultor) {
    const updateObj = {
      nome_user: dados.nome_user ?? consultor.nome_user,
      email: dados.email ?? consultor.email,
      telefone: dados.telefone ?? consultor.telefone,
      imagem_perfil: dados.imagem_perfil ?? consultor.imagem_perfil,
      ativo: dados.ativo ?? consultor.ativo,
      update_user: new Date()
    };
    if (dados.primeiro_login !== undefined) {
      updateObj.primeiro_login = dados.primeiro_login;
    }
    if (dados.password !== undefined) {
      updateObj.password = dados.password;
    }
    await consultor.update(updateObj);
  }
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
        roles
      } = req.body;

      const user = await Utilizador.findByPk(id);
      if (!user) {
        await transaction.rollback();
        return res.status(404).json({ error: "Utilizador não encontrado." });
      }

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

      if (roles !== undefined) {
        let rolesArray = [];
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

      await sincronizarConsultor(id, {
        nome_user: updateData.nome_user,
        email: updateData.email,
        telefone: updateData.telefone,
        imagem_perfil,
        ativo: updateData.ativo
      });

      await transaction.commit();

      const utilizadorAtualizado = await Utilizador.findByPk(id, {
        include: [
          {
            model: Role,
            attributes: ['id_role', 'nome_role', 'icone_role'],
            through: { attributes: [] }
          }
        ]
      });

      return res.status(200).json({
        ...utilizadorAtualizado.toJSON(),
        roles: utilizadorAtualizado.Roles || []
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Erro ao atualizar utilizador:", error);
      return res.status(500).json({ error: "Erro ao atualizar utilizador." });
    }
  },

  async deleteUtilizador(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const idLogado = req.utilizadorLogado?.id_utilizador;

      if (Number(id) === Number(idLogado)) {
        await transaction.rollback();
        return res.status(400).json({ error: "Não podes eliminar o teu próprio utilizador." });
      }

      const user = await Utilizador.findByPk(id);
      if (!user) {
        await transaction.rollback();
        return res.status(404).json({ error: "Utilizador não encontrado." });
      }

      await UtilizadorRoles.destroy({ where: { id_utilizador: id }, transaction });
      await Consultor.destroy({ where: { id_utilizador: id }, transaction });
      await user.destroy({ transaction });

      await transaction.commit();
      return res.status(200).json({ message: "Utilizador eliminado com sucesso." });
    } catch (error) {
      await transaction.rollback();
      console.error("Erro ao eliminar utilizador:", error);
      return res.status(500).json({ error: "Erro ao eliminar utilizador." });
    }
  }
};
