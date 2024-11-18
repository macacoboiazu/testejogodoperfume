// Classe para gerenciar o banco de dados de usuários
class UserDatabase {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.loginHistory = JSON.parse(localStorage.getItem('loginHistory')) || [];
    }

    // Registrar um novo usuário
    registerUser(username, password) {
        if (this.users.some(user => user.username === username)) {
            return { success: false, message: 'Usuário já existe!' };
        }

        const newUser = {
            id: Date.now(),
            username,
            password: this.hashPassword(password),
            createdAt: new Date().toISOString()
        };

        this.users.push(newUser);
        this.saveUsers();
        return { success: true, message: 'Usuário registrado com sucesso!' };
    }

    // Fazer login
    login(username, password) {
        const user = this.users.find(user => user.username === username);
        
        if (!user || user.password !== this.hashPassword(password)) {
            return { success: false, message: 'Usuário ou senha incorretos!' };
        }

        // Registrar o histórico de login
        this.loginHistory.push({
            userId: user.id,
            username: user.username,
            timestamp: new Date().toISOString()
        });

        this.saveLoginHistory();
        return { success: true, message: 'Login realizado com sucesso!' };
    }

    // Obter histórico de login
    getLoginHistory() {
        return this.loginHistory;
    }

    // Função simples de hash (em produção, use bcrypt ou similar)
    hashPassword(password) {
        return password.split('').reduce((hash, char) => 
            (((hash << 5) - hash) + char.charCodeAt(0))|0, 0).toString();
    }

    // Salvar usuários no localStorage
    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    // Salvar histórico de login no localStorage
    saveLoginHistory() {
        localStorage.setItem('loginHistory', JSON.stringify(this.loginHistory));
    }
}

// Inicializar o banco de dados
const db = new UserDatabase();

// Elementos do DOM
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');

// Alternar entre formulários
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
});

// Manipulador do formulário de login
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = this.querySelector('input[type="text"]').value;
    const password = this.querySelector('input[type="password"]').value;
    const rememberMe = this.querySelector('input[type="checkbox"]').checked;

    // Tentar fazer login
    const loginResult = db.login(username, password);

    if (loginResult.success) {
        // Se "Lembrar-me" estiver marcado, salvar as credenciais
        if (rememberMe) {
            localStorage.setItem('rememberedUser', username);
        } else {
            localStorage.removeItem('rememberedUser');
        }

        // Salvar usuário atual
        localStorage.setItem('currentUser', username);
        localStorage.setItem('isAuthenticated', 'true');

        showNotification(loginResult.message, 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    } else {
        showNotification(loginResult.message, 'error');
    }
});

// Manipulador do formulário de registro
registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const inputs = this.querySelectorAll('input[type="password"]');
    const username = this.querySelector('input[type="text"]').value;
    const password = inputs[0].value;
    const confirmPassword = inputs[1].value;

    if (password !== confirmPassword) {
        showNotification('As senhas não coincidem!', 'error');
        return;
    }

    // Tentar registrar o usuário
    const registerResult = db.registerUser(username, password);

    if (registerResult.success) {
        showNotification(registerResult.message, 'success');
        this.reset();
        // Voltar para o formulário de login
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    } else {
        showNotification(registerResult.message, 'error');
    }
});

// Verificar se existe um usuário lembrado
window.addEventListener('load', function() {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
        loginForm.querySelector('input[type="text"]').value = rememberedUser;
        loginForm.querySelector('input[type="checkbox"]').checked = true;
    }
});

// Função para mostrar notificações
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Adicionar estilos para as notificações
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 5px;
        color: white;
        font-weight: 500;
        animation: slideIn 0.5s ease-out;
        z-index: 1000;
    }

    .notification.success {
        background-color: #4CAF50;
    }

    .notification.error {
        background-color: #f44336;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
