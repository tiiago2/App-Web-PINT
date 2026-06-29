export function lerDadosDoToken(token) {
    try {
        const payloadBase64 = token.split('.')[1];
        const payloadString = atob(payloadBase64);
        return JSON.parse(payloadString);
    } catch (erro) {
        console.error("Erro ao ler o token:", erro);
        return null;
    }
}

export function apagarToken() {
    localStorage.removeItem('meu_token');
}