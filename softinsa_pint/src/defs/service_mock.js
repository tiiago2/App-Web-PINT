/* ── Mock de dados baseado na estrutura da base de dados Softinsa ──
   Tabelas refletidas: Utilizador, Consultor, Service_Line, Área,
   Badges, Nível, Submissões, Registo Badges
   Nota: valores gerados para demo até à ligação com a API.
*/

export const serviceLines = [
    { ID_Service_Line: 1, ID_Learning_Path: 1, Nome_Service_Line: 'Hybrid Systems', Descrição_Service_Line: 'Hybrid integration', Deleted_Service: false },
    { ID_Service_Line: 2, ID_Learning_Path: 1, Nome_Service_Line: 'Cloud', Descrição_Service_Line: 'Cloud solutions', Deleted_Service: false },
    { ID_Service_Line: 3, ID_Learning_Path: 2, Nome_Service_Line: 'Mobile Solutions', Descrição_Service_Line: 'Mobile development', Deleted_Service: false },
    { ID_Service_Line: 4, ID_Learning_Path: 2, Nome_Service_Line: 'Data & AI', Descrição_Service_Line: 'Data and AI', Deleted_Service: false },
];

export const areas = [
    { ID_Área: 1, ID_Service_Line: 1, Nome_Área: 'Integration', Descrição_Área: 'Integration area', Deleted_Area: false },
    { ID_Área: 2, ID_Service_Line: 1, Nome_Área: 'API Management', Descrição_Área: 'API area', Deleted_Area: false },
    { ID_Área: 3, ID_Service_Line: 2, Nome_Área: 'Azure', Descrição_Área: 'Azure cloud', Deleted_Area: false },
    { ID_Área: 4, ID_Service_Line: 2, Nome_Área: 'AWS', Descrição_Área: 'AWS cloud', Deleted_Area: false },
    { ID_Área: 5, ID_Service_Line: 3, Nome_Área: 'iOS', Descrição_Área: 'iOS dev', Deleted_Area: false },
    { ID_Área: 6, ID_Service_Line: 3, Nome_Área: 'Android', Descrição_Área: 'Android dev', Deleted_Area: false },
];

export const niveis = [
    { ID_Nível: 1, Nome_User: 'Júnior' },
    { ID_Nível: 2, Nome_User: 'Intermédio' },
    { ID_Nível: 3, Nome_User: 'Sénior' },
    { ID_Nível: 4, Nome_User: 'Especialista' },
    { ID_Nível: 5, Nome_User: 'Especialista técnico' },
];

export const utilizadores = [
    { ID_Utilizador: 1, Nome_User: 'João Silva', Email: 'joao.silva@softinsa.pt', ID_Service_Line: 1, ID_Área: 1, Ativo: true, Imagem_Perfil: null, Pontos_Totais: 374957 },
    { ID_Utilizador: 2, Nome_User: 'Maria Ana', Email: 'maria.ana@softinsa.pt', ID_Service_Line: 1, ID_Área: 2, Ativo: true, Imagem_Perfil: null, Pontos_Totais: 285410 },
    { ID_Utilizador: 3, Nome_User: 'Rui Costa', Email: 'rui.costa@softinsa.pt', ID_Service_Line: 1, ID_Área: 1, Ativo: true, Imagem_Perfil: null, Pontos_Totais: 190500 },
    { ID_Utilizador: 4, Nome_User: 'Afonso Moreira', Email: 'afonso.moreira@softinsa.pt', ID_Service_Line: 1, ID_Área: 2, Ativo: true, Imagem_Perfil: null, Pontos_Totais: 98120 },
    { ID_Utilizador: 5, Nome_User: 'Ana Reis', Email: 'ana.reis@softinsa.pt', ID_Service_Line: 1, ID_Área: 1, Ativo: true, Imagem_Perfil: null, Pontos_Totais: 35220 },
    { ID_Utilizador: 6, Nome_User: 'Pedro Sousa', Email: 'pedro.sousa@softinsa.pt', ID_Service_Line: 1, ID_Área: 2, Ativo: true, Imagem_Perfil: null, Pontos_Totais: 15400 },
    { ID_Utilizador: 7, Nome_User: 'Carlos Lima', Email: 'carlos.lima@softinsa.pt', ID_Service_Line: 1, ID_Área: 1, Ativo: true, Imagem_Perfil: null, Pontos_Totais: 12900 },
    { ID_Utilizador: 8, Nome_User: 'Diana Santos', Email: 'diana.santos@softinsa.pt', ID_Service_Line: 1, ID_Área: 2, Ativo: true, Imagem_Perfil: null, Pontos_Totais: 8450 },
    { ID_Utilizador: 9, Nome_User: 'Sofia Martins', Email: 'sofia.martins@softinsa.pt', ID_Service_Line: 3, ID_Área: 5, Ativo: true, Imagem_Perfil: null, Pontos_Totais: 9500 },
    { ID_Utilizador: 10, Nome_User: 'Tiago Ferreira', Email: 'tiago.ferreira@softinsa.pt', ID_Service_Line: 1, ID_Área: 1, Ativo: true, Imagem_Perfil: null, Pontos_Totais: 421000 },
];

export const badges = [
    { ID_Badge: 1, ID_Área: 1, ID_Nível: 1, Nome_Badge: 'Low Code Basics', Pontos_Badge: 100, Validade: 365, Especial: false, Deleted_badge: false },
    { ID_Badge: 2, ID_Área: 1, ID_Nível: 2, Nome_Badge: 'API Design', Pontos_Badge: 250, Validade: 365, Especial: false, Deleted_badge: false },
    { ID_Badge: 3, ID_Área: 1, ID_Nível: 3, Nome_Badge: 'Advanced Integration', Pontos_Badge: 500, Validade: 365, Especial: false, Deleted_badge: false },
    { ID_Badge: 4, ID_Área: 1, ID_Nível: 4, Nome_Badge: 'Integration Expert', Pontos_Badge: 1000, Validade: 365, Especial: true, Deleted_badge: false },
    { ID_Badge: 5, ID_Área: 2, ID_Nível: 2, Nome_Badge: 'RESTful Services', Pontos_Badge: 300, Validade: 365, Especial: false, Deleted_badge: false },
    { ID_Badge: 6, ID_Área: 2, ID_Nível: 3, Nome_Badge: 'API Gateway', Pontos_Badge: 600, Validade: 365, Especial: false, Deleted_badge: false },
    { ID_Badge: 7, ID_Área: 1, ID_Nível: 5, Nome_Badge: 'Technical Specialist', Pontos_Badge: 1500, Validade: 365, Especial: true, Deleted_badge: false },
];

/* Submissões com status reais da BD */
export const submissoes = [
    { ID_Submissão: 1, ID_Badge: 1, ID_Utilizador: 1, Status: 'Aceite', Data_Submissão: '2026-06-25T10:00:00' },
    { ID_Submissão: 2, ID_Badge: 2, ID_Utilizador: 1, Status: 'Aceite', Data_Submissão: '2026-06-20T10:00:00' },
    { ID_Submissão: 3, ID_Badge: 3, ID_Utilizador: 2, Status: 'Em análise', Data_Submissão: '2026-06-28T10:00:00' },
    { ID_Submissão: 4, ID_Badge: 1, ID_Utilizador: 4, Status: 'Aceite', Data_Submissão: '2026-06-15T10:00:00' },
    { ID_Submissão: 5, ID_Badge: 5, ID_Utilizador: 5, Status: 'Rejeitada', Data_Submissão: '2026-06-10T10:00:00' },
    { ID_Submissão: 6, ID_Badge: 6, ID_Utilizador: 6, Status: 'Aceite', Data_Submissão: '2026-05-20T10:00:00' },
    { ID_Submissão: 7, ID_Badge: 2, ID_Utilizador: 7, Status: 'Aceite', Data_Submissão: '2026-04-15T10:00:00' },
    { ID_Submissão: 8, ID_Badge: 4, ID_Utilizador: 10, Status: 'Aceite', Data_Submissão: '2026-06-01T10:00:00' },
];

/* Registo de badges obtidos */
export const registoBadges = [
    { ID_Registo: 1, ID_Badge: 1, ID_Utilizador: 1, Data_Obtenção: '2026-06-25T10:00:00' },
    { ID_Registo: 2, ID_Badge: 2, ID_Utilizador: 1, Data_Obtenção: '2026-06-20T10:00:00' },
    { ID_Registo: 3, ID_Badge: 1, ID_Utilizador: 4, Data_Obtenção: '2026-06-15T10:00:00' },
    { ID_Registo: 4, ID_Badge: 6, ID_Utilizador: 6, Data_Obtenção: '2026-05-20T10:00:00' },
    { ID_Registo: 5, ID_Badge: 2, ID_Utilizador: 7, Data_Obtenção: '2026-04-15T10:00:00' },
    { ID_Registo: 6, ID_Badge: 4, ID_Utilizador: 10, Data_Obtenção: '2026-06-01T10:00:00' },
];

/* Devolve as áreas pertencentes a uma determinada service line */
export const getAreasServiceLine = (idServiceLine) =>
    areas
        .filter((a) => a.ID_Service_Line === idServiceLine)
        .map((a) => a.Nome_Área);

/* Helpers para transformar os mocks no formato usado pelos componentes */

export const getNomeServiceLine = (id) =>
    serviceLines.find((s) => s.ID_Service_Line === id)?.Nome_Service_Line || '';

export const getNomeArea = (id) =>
    areas.find((a) => a.ID_Área === id)?.Nome_Área || '';

export const getNomeNivel = (id) =>
    niveis.find((n) => n.ID_Nível === id)?.Nome_User || '';

/* Devolve consultores de uma determinada service line */
export const getConsultoresServiceLine = (idServiceLine) =>
    utilizadores
        .filter((u) => u.ID_Service_Line === idServiceLine)
        .map((u) => ({
            id: u.ID_Utilizador,
            nome: u.Nome_User,
            email: u.Email,
            service_line: getNomeServiceLine(u.ID_Service_Line),
            area: getNomeArea(u.ID_Área),
            pontos: u.Pontos_Totais,
            foto: u.Imagem_Perfil,
            ativo: u.Ativo,
        }));

/* Total de badges atribuídos (registos) */
export const getTotalBadgesAtribuidos = () => registoBadges.length;

/* Total de utilizadores ativos de uma service line */
export const getTotalUtilizadoresServiceLine = (idServiceLine) =>
    utilizadores.filter((u) => u.ID_Service_Line === idServiceLine && u.Ativo).length;

/* Badges por nível — retorna percentuais para o gráfico */
/* Mapeamento dos nomes dos níveis para as chaves de tradução */
const CHAVES_NIVEL = {
    'Júnior': 'junior',
    'Intermédio': 'intermedio',
    'Sénior': 'senior',
    'Especialista': 'especialista',
    'Especialista técnico': 'especialista_tec',
};

export const getBadgesPorNivel = () => {
    const totalPorNivel = {};
    let total = 0;

    badges.forEach((b) => {
        const nome = getNomeNivel(b.ID_Nível);
        totalPorNivel[nome] = (totalPorNivel[nome] || 0) + 1;
        total += 1;
    });

    return niveis.map((n) => ({
        Nome_Nivel: CHAVES_NIVEL[n.Nome_User] || n.Nome_User,
        valor: total > 0 ? Math.round((totalPorNivel[n.Nome_User] || 0) / total * 100) : 0,
    }));
};

/* Taxa de aprovação (submissões aceites / total) */
export const getTaxaAprovacao = () => {
    const aceites = submissoes.filter((s) => s.Status === 'Aceite').length;
    const total = submissoes.length;
    return total > 0 ? Math.round((aceites / total) * 100) : 0;
};
