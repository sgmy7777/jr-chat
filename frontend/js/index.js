// Modified index.js with user authentication and message alignment

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация модуля аутентификации
    if (typeof ChatAuth !== 'undefined') {
        ChatAuth.init();
    }

    /** выпадающее меню */
    const menuButton = document.getElementById('menuButton');
    const dropdown = document.getElementById('headerDropdown');

    menuButton.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });

    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target) && !menuButton.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });

    /** выпадающее меню сообщения */
    // Единый обработчик для управления меню сообщений
    document.addEventListener('click', function(event) {
        // Проверяем, был ли клик по кнопке управления
        const controlButton = event.target.closest('[id^="message-menu-"]');

        if (controlButton) {
            // Получаем ID сообщения из ID кнопки
            const messageId = controlButton.id.split('-')[2];
            const menu = document.getElementById(`messageDropdown-${messageId}`);
            const messageText = document.getElementById(`message-text-${messageId}`);

            // Если кликнули по той же кнопке, что и открыто меню - закрываем его
            if (openMenuId === `messageDropdown-${messageId}`) {
                menu.classList.remove('show');
                messageText.classList.remove('highlight-border');
                openMenuId = null;
                highlightedMessageId = null;
            } else {
                // Закрываем предыдущее меню, если оно было открыто
                if (openMenuId) {
                    const prevMenu = document.getElementById(openMenuId);
                    const prevHighlight = document.getElementById(highlightedMessageId);
                    if (prevMenu) prevMenu.classList.remove('show');
                    if (prevHighlight) prevHighlight.classList.remove('highlight-border');
                }

                // Открываем новое меню
                menu.classList.add('show');
                messageText.classList.add('highlight-border');
                openMenuId = `messageDropdown-${messageId}`;
                highlightedMessageId = `message-text-${messageId}`;
            }

            // Предотвращаем всплытие, чтобы не сработал нижеследующий код закрытия
            event.stopPropagation();
        } else {
            // Проверяем, не был ли клик внутри открытого меню
            const clickedInsideMenu = event.target.closest('.message-menu');

            if (!clickedInsideMenu && openMenuId) {
                // Клик был вне меню - закрываем меню и снимаем выделение
                const menu = document.getElementById(openMenuId);
                const highlight = document.getElementById(highlightedMessageId);
                if (menu) menu.classList.remove('show');
                if (highlight) highlight.classList.remove('highlight-border');
                openMenuId = null;
                highlightedMessageId = null;
            }
        }
    });

    /** сообщения */
    const container = document.querySelector(".messages");
    const indicator = document.getElementById("new-message-indicator");

    // Хранит информацию об открытых меню
    let openMenuId = null;
    let highlightedMessageId = null;

    function renderMessages(messages, forceScroll = false) {
        // Проверяем, что messages - это массив
        if (!Array.isArray(messages)) {
            console.error("renderMessages received invalid data:", messages);
            return;
        }

        const isScrolledToBottom =
            container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
        const prevScrollHeight = container.scrollHeight;

        // Сохраняем состояние открытого меню перед обновлением
        if (!openMenuId) {
            // Проверяем, есть ли открытое меню
            const openMenuEl = document.querySelector('.message-menu.show');
            if (openMenuEl) {
                openMenuId = openMenuEl.id;
                const messageIdMatch = openMenuId.match(/messageDropdown-(.+)/);
                if (messageIdMatch && messageIdMatch[1]) {
                    highlightedMessageId = `message-text-${messageIdMatch[1]}`;
                }
            }
        }

        container.innerHTML = "";

        // Получаем текущее имя пользователя
        const currentUsername = ChatAuth ? ChatAuth.getUsername() : null;

        for (const message of messages) {
            // Проверка корректности объекта сообщения
            if (!message || typeof message !== 'object') {
                console.warn("Skipping invalid message:", message);
                continue;
            }

            // Установка безопасных значений по умолчанию
            const messageId = message.id || Math.random().toString(36).substring(2, 9);
            const username = message.username || "unknown";
            const text = message.text || "";
            const timestamp = message.timestamp || new Date().toLocaleString();

            const messageElement = document.createElement("article");
            messageElement.className = "message";

            // Добавляем класс для определения позиции сообщения (свое или чужое)
            if (currentUsername && username === currentUsername) {
                messageElement.classList.add("own-message");
            } else {
                messageElement.classList.add("other-message");
            }

            const dropdownId = `messageDropdown-${messageId}`;
            const messageTextId = `message-text-${messageId}`;

            messageElement.innerHTML = `
        <div class="message-header">
          <div class="message-author">${username}</div>
          
          <button class="message-control" id="message-menu-${messageId}"></button>
          <div class="message-menu${openMenuId === dropdownId ? ' show' : ''}" id="${dropdownId}">
            <button class="dropdown-item">View</button>
            <button class="dropdown-item">Edit</button>
            <button class="dropdown-item delete-red">Delete</button>
            <button class="dropdown-item last-item">Item</button>
          </div>
        </div>
        <p class="message-text${highlightedMessageId === messageTextId ? ' highlight-border' : ''}" id="${messageTextId}">${text}</p>
        <time class="message-time">${timestamp}</time>
      `;

            container.appendChild(messageElement);
        }

        if (isScrolledToBottom || forceScroll) {
            container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
            indicator.style.display = "none";
        } else {
            // если появилось новое содержимое и пользователь не внизу — показать индикатор
            if (container.scrollHeight > prevScrollHeight) {
                indicator.style.display = "block";
            }
        }
    }

    /** Клик по индикатору новых сообщений */
    indicator.addEventListener("click", () => {
        container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth"
        });
        indicator.style.display = "none";
    });

    /** Спрятать индикатор при прокрутке в самый низ */
    container.addEventListener("scroll", () => {
        const nearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
        if (nearBottom) {
            indicator.style.display = "none";
        }
    });

    function getMessages(forceScroll = false) {
        fetch("http://localhost:4000/messages", {
            method: "GET",
        })
            .then(function(messagesResponse) {
                // Даже если статус не 200, мы не будем выбрасывать ошибку
                // Просто выведем предупреждение в консоль
                if (messagesResponse.status !== 200) {
                    console.warn("Warning: Couldn't get messages from server, status:", messagesResponse.status);
                }

                // Продолжаем обработку ответа
                return messagesResponse.json().catch(e => {
                    console.error("Error parsing JSON response:", e);
                    return []; // Возвращаем пустой массив в случае ошибки парсинга
                });
            })
            .then(function(messagesList) {
                // Проверяем, что полученные данные - это массив
                if (Array.isArray(messagesList)) {
                    console.log("Messages received:", messagesList.length);
                    renderMessages(messagesList, forceScroll);
                } else {
                    console.error("Received invalid messages data:", messagesList);
                }
            })
            .catch(function(error) {
                // Логируем ошибку, но не показываем пользователю
                console.error("Error fetching messages:", error);
            });
    }

    function initForm() {
        const formContainer = document.querySelector("form");
        const formTextField = formContainer.querySelector("textarea");
        const formSubmitButton = formContainer.querySelector("button");

        // При инициализации формы устанавливаем текущее имя пользователя
        if (ChatAuth) {
            const usernameField = formContainer.querySelector('input[name="username"]');
            if (usernameField) {
                usernameField.value = ChatAuth.getUsername() || 'guest001';
            }
        }

        function updateButtonState() {
            if (formTextField.value.trim() === '') {
                formSubmitButton.style.visibility = 'hidden';  // Скрыть кнопку
            } else {
                formSubmitButton.style.visibility = 'visible';  // Показать кнопку
            }
        }

        // Запускать при каждом вводе в textarea
        formTextField.addEventListener('input', updateButtonState);

        // Проверить состояние при загрузке страницы
        updateButtonState();

        /** Отправка сообщения нажатием на enter*/
        const form = formContainer;
        const textarea = formTextField;

        form.addEventListener("submit", function(event) {
            // Позволим отправку формы как обычно
        });

        textarea.addEventListener("keydown", function(event) {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault(); // предотвращаем перевод строки
                form.requestSubmit();   // имитирует клик по кнопке отправки
            }
        });

        formContainer.onsubmit = function(evt) {
            evt.preventDefault();
            const formData = new FormData(evt.target);

            const messageData = {
                username: formData.get("username"),
                text: formData.get("text"),
            };

            if (!messageData.text.trim()) {
                return; // Не отправляем пустые сообщения
            }

            // Сохраняем текст сообщения перед отправкой
            const messageText = messageData.text;

            // Очищаем поле ввода сразу же
            formTextField.value = "";
            updateButtonState(); // Обновляем состояние кнопки отправки

            // Временно отключаем форму на время отправки
            formTextField.disabled = true;
            formSubmitButton.disabled = true;

            fetch("http://localhost:4000/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(messageData),
            })
                .then(function(newMessageResponse) {
                    console.log(newMessageResponse.status);

                    // Разблокируем форму в любом случае
                    formTextField.disabled = false;
                    formSubmitButton.disabled = false;
                    formTextField.focus(); // поле ввода активно после отправки сообщения

                    // Обновляем список сообщений
                    getMessages(true);
                })
                .catch(function(error) {
                    console.error("Error sending message:", error);

                    // Разблокируем форму
                    formTextField.disabled = false;
                    formSubmitButton.disabled = false;

                    // Восстанавливаем текст сообщения, если отправка не удалась
                    formTextField.value = messageText;
                    updateButtonState(); // Обновляем состояние кнопки отправки

                    // Выводим ошибку в консоль, но не показываем пользователю
                    // alert("Failed to send message. Please try again.");
                });
        };
    }

    function initChat() {
        // Проверяем, авторизован ли пользователь
        if (ChatAuth && !ChatAuth.isAuthenticated()) {
            // Не инициализируем чат, если пользователь не авторизован
            return;
        }

        getMessages();

        // Проверяем существует ли уже интервал обновления
        if (window.messagesRefreshInterval) {
            clearInterval(window.messagesRefreshInterval);
        }

        // Устанавливаем новый интервал и сохраняем ссылку на него
        window.messagesRefreshInterval = setInterval(function() {
            // Проверяем, не открыто ли сейчас меню сообщения
            if (!openMenuId) {
                getMessages();
            }
        }, 3000);

        initForm();
    }

    // Инициализируем чат только если пользователь авторизован
    if (!ChatAuth || ChatAuth.isAuthenticated()) {
        initChat();
    }
});