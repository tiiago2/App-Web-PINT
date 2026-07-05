export const handleLogout = (navigate) => {
    
    localStorage.removeItem('utilizador_id');
    localStorage.removeItem('token_softinsa');
    localStorage.removeItem('role_softinsa');
    
    navigate('/login'); 
    window.location.reload(); 
};