// Функция для управления авторизацией пользователя и состоянием чата

const ChatAuth = (function() {
    // Приватные переменные и методы
    const LOCAL_STORAGE_USERNAME_KEY = 'chat_username';
    const LOCAL_STORAGE_USER_ID_KEY = 'chat_user_id';
    let isAuthenticated = false;
    let currentUserId = null;

    // DOM элементы
    const loginContainer = document.querySelector('.containerLogin');
    const chatContainer = document.querySelector('main');
    const headerElement = document.querySelector('header');
    const usernameInput = document.getElementById('username');
    const joinButton = document.querySelector('.join-button');

    // Проверка авторизации при загрузке страницы
    function checkAuthentication() {
        const savedUsername = localStorage.getItem(LOCAL_STORAGE_USERNAME_KEY);
        const savedUserId = localStorage.getItem(LOCAL_STORAGE_USER_ID_KEY);

        if (savedUsername && savedUserId) {
            isAuthenticated = true;
            currentUserId = parseInt(savedUserId);
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

    // Показать состояние загрузки
    function showLoadingState() {
        if (joinButton) {
            joinButton.disabled = true;
            joinButton.textContent = 'Joining...';
        }
        if (usernameInput) {
            usernameInput.disabled = true;
        }
    }

    // Скрыть состояние загрузки
    function hideLoadingState() {
        if (joinButton) {
            joinButton.disabled = false;
            joinButton.textContent = 'Join';
        }
        if (usernameInput) {
            usernameInput.disabled = false;
        }
    }

    // Валидация имени пользователя
    function validateUsername(username) {
        if (!username || typeof username !== 'string') {
            return { valid: false, message: 'Username must be a string' };
        }

        const trimmedUsername = username.trim();

        if (trimmedUsername.length < 2) {
            return { valid: false, message: 'Username is too short (min 2 characters)' };
        }

        if (trimmedUsername.length > 50) {
            return { valid: false, message: 'Username is too long (max 50 characters)' };
        }

        if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
            return { valid: false, message: 'Username can only contain letters, numbers and underscores' };
        }

        return { valid: true, username: trimmedUsername };
    }

    // Авторизовать пользователя через сервер
    async function login(username) {
        const validation = validateUsername(username);
        if (!validation.valid) {
            alert(validation.message);
            return false;
        }

        const trimmedUsername = validation.username;
        showLoadingState();

        try {
            const response = await fetch("http://localhost:4000/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: trimmedUsername,
                }),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const userData = await response.json();

            if (!userData.user_id) {
                throw new Error('Server did not return user_id');
            }

            // Сохраняем данные пользователя
            localStorage.setItem(LOCAL_STORAGE_USERNAME_KEY, trimmedUsername);
            localStorage.setItem(LOCAL_STORAGE_USER_ID_KEY, userData.user_id.toString());

            isAuthenticated = true;
            currentUserId = userData.user_id;

            console.log(`User authenticated: ${trimmedUsername} (ID: ${userData.user_id})`);

            hideLoadingState();
            return true;

        } catch (error) {
            console.error('Login error:', error);
            alert('Failed to join chat. Please try again.');
            hideLoadingState();
            return false;
        }
    }

    // Выйти из аккаунта
    function logout() {
        localStorage.removeItem(LOCAL_STORAGE_USERNAME_KEY);
        localStorage.removeItem(LOCAL_STORAGE_USER_ID_KEY);
        isAuthenticated = false;
        currentUserId = null;
        showLoginScreen();

        // Очищаем интервал обновления сообщений если он существует
        if (window.messagesRefreshInterval) {
            clearInterval(window.messagesRefreshInterval);
            window.messagesRefreshInterval = null;
        }
    }

    // Получить имя пользователя
    function getUsername() {
        return localStorage.getItem(LOCAL_STORAGE_USERNAME_KEY);
    }

    // Получить ID пользователя
    function getUserId() {
        return currentUserId || parseInt(localStorage.getItem(LOCAL_STORAGE_USER_ID_KEY));
    }

    // Обновить имя пользователя
    async function updateUsername(newUsername) {
        const validation = validateUsername(newUsername);
        if (!validation.valid) {
            alert(validation.message);
            return false;
        }

        const oldUsername = getUsername();

        try {
            const response = await fetch("http://localhost:4000/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: validation.username,
                }),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const userData = await response.json();

            // Обновляем сохраненные данные
            localStorage.setItem(LOCAL_STORAGE_USERNAME_KEY, validation.username);
            localStorage.setItem(LOCAL_STORAGE_USER_ID_KEY, userData.user_id.toString());
            currentUserId = userData.user_id;

            console.log(`Username updated: ${oldUsername} → ${validation.username} (ID: ${userData.user_id})`);

            // Показываем уведомление пользователю
            if (oldUsername !== validation.username) {
                alert(`Username changed from "${oldUsername}" to "${validation.username}"`);
            }

            return true;

        } catch (error) {
            console.error('Update username error:', error);
            alert('Failed to update username. Please try again.');
            return false;
        }
    }

    // Инициализация функционала авторизации
    function init() {
        if (checkAuthentication()) {
            showChatScreen();
        } else {
            showLoginScreen();
        }

        // Обработчик для кнопки входа
        if (joinButton) {
            joinButton.addEventListener('click', async function() {
                const username = usernameInput.value;
                if (await login(username)) {
                    showChatScreen();
                    // Инициализируем чат после успешной авторизации
                    if (typeof window.initChat === 'function') {
                        window.initChat();
                    }
                }
            });
        }

        // Обработчик для входа по нажатию Enter в поле ввода имени
        if (usernameInput) {
            usernameInput.addEventListener('keydown', async function(event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    const username = usernameInput.value;
                    if (await login(username)) {
                        showChatScreen();
                        // Инициализируем чат после успешной авторизации
                        if (typeof window.initChat === 'function') {
                            window.initChat();
                        }
                    }
                }
            });
        }

        // Обработчик для кнопки Logout
        const logoutButton = document.querySelector('.dropdown-item:nth-child(2)');
        if (logoutButton) {
            logoutButton.addEventListener('click', function() {
                // Закрываем меню перед выходом
                const dropdown = document.getElementById('headerDropdown');
                if (dropdown) {
                    dropdown.classList.remove('show');
                }
                logout();
            });
        }

        // Обработчик для кнопки Edit name
        const editNameButton = document.querySelector('.dropdown-item:nth-child(1)');
        if (editNameButton) {
            editNameButton.addEventListener('click', async function() {
                // Закрываем меню сразу после клика
                const dropdown = document.getElementById('headerDropdown');
                if (dropdown) {
                    dropdown.classList.remove('show');
                }

                const currentUsername = getUsername();
                const newUsername = prompt('Enter new username', currentUsername);
                if (newUsername && newUsername.trim() !== '' && newUsername !== currentUsername) {
                    const success = await updateUsername(newUsername);
                    if (success) {
                        // Можно добавить уведомление об успешном обновлении
                        console.log('Username updated successfully');
                    }
                }
            });
        }
    }

    // Публичный API
    return {
        init,
        login,
        logout,
        getUsername,
        getUserId,
        updateUsername,
        isAuthenticated: function() { return isAuthenticated; }
    };
})();

// Экспортируем объект ChatAuth для использования в других скриптах
window.ChatAuth = ChatAuth;