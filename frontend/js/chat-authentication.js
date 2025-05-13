
// Функция для управления авторизацией пользователя и состоянием чата

const ChatAuth = (function() {
    // Приватные переменные и методы
    const LOCAL_STORAGE_USERNAME_KEY = 'chat_username';
    let isAuthenticated = false;

    // DOM элементы
    const loginContainer = document.querySelector('.containerLogin');
    const chatContainer = document.querySelector('main');
    const headerElement = document.querySelector('header');
    const usernameInput = document.getElementById('username');
    const joinButton = document.querySelector('.join-button');
    const usernameDisplay = document.querySelector('.username-display');

    // Проверка авторизации при загрузке страницы
    function checkAuthentication() {
        const savedUsername = localStorage.getItem(LOCAL_STORAGE_USERNAME_KEY);

        if (savedUsername) {
            isAuthenticated = true;
            return true;
        }

        return false;
    }

    // Показать экран логина
    function showLoginScreen() {
        loginContainer.style.display = 'flex';
        chatContainer.style.display = 'none';
        headerElement.style.display = 'none';
    }

    // Показать экран чата
    function showChatScreen() {
        loginContainer.style.display = 'none';
        chatContainer.style.display = 'block';
        headerElement.style.display = 'flex';
    }

    // Авторизовать пользователя
    function login(username) {
        if (!username || username.trim() === '') {
            alert('Please enter a username');
            return false;
        }

        localStorage.setItem(LOCAL_STORAGE_USERNAME_KEY, username.trim());
        isAuthenticated = true;

        // Устанавливаем имя пользователя в форму отправки сообщений
        const usernameField = document.querySelector('input[name="username"]');
        if (usernameField) {
            usernameField.value = username.trim();
        }

        return true;
    }

    // Выйти из аккаунта
    function logout() {
        localStorage.removeItem(LOCAL_STORAGE_USERNAME_KEY);
        isAuthenticated = false;
        showLoginScreen();
    }

    // Получить имя пользователя
    function getUsername() {
        return localStorage.getItem(LOCAL_STORAGE_USERNAME_KEY);
    }

    // Инициализация функционала авторизации
    function init() {
        if (checkAuthentication()) {
            const username = getUsername();
            const usernameField = document.querySelector('input[name="username"]');
            if (usernameField) {
                usernameField.value = username;
            }
            showChatScreen();
        } else {
            showLoginScreen();
        }

        // Обработчик для кнопки входа
        joinButton.addEventListener('click', function() {
            const username = usernameInput.value;
            if (login(username)) {
                showChatScreen();
            }
        });

        // Обработчик для входа по нажатию Enter в поле ввода имени
        usernameInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                const username = usernameInput.value;
                if (login(username)) {
                    showChatScreen();
                }
            }
        });

        // Обработчик для кнопки Logout
        const logoutButton = document.querySelector('.dropdown-item:nth-child(2)');
        if (logoutButton) {
            logoutButton.addEventListener('click', logout);
        }

        // Обработчик для кнопки Edit name
        const editNameButton = document.querySelector('.dropdown-item:nth-child(1)');
        if (editNameButton) {
            editNameButton.addEventListener('click', function() {
                const newUsername = prompt('Enter new username', getUsername());
                if (newUsername && newUsername.trim() !== '') {
                    login(newUsername);
                }
            });
        }
    }

    // Функция очистки (для удаления обработчиков событий)
    function destroy() {
        // Удаляем обработчик для кнопки Join
        if (joinButton) {
            joinButton.removeEventListener('click', function() {});
        }

        // Удаляем обработчик для нажатия Enter в поле ввода
        if (usernameInput) {
            usernameInput.removeEventListener('keydown', function() {});
        }

        // Удаляем обработчик для кнопки Logout
        const logoutButton = document.querySelector('.dropdown-item:nth-child(2)');
        if (logoutButton) {
            logoutButton.removeEventListener('click', logout);
        }

        // Удаляем обработчик для кнопки Edit name
        const editNameButton = document.querySelector('.dropdown-item:nth-child(1)');
        if (editNameButton) {
            editNameButton.removeEventListener('click', function() {});
        }
    }

    // Публичный API
    return {
        init,
        destroy,
        login,
        logout,
        getUsername,
        isAuthenticated: function() { return isAuthenticated; }
    };
})();

// Экспортируем объект ChatAuth для использования в других скриптах
window.ChatAuth = ChatAuth;