/**
 * Требования:
 * - Прозрачная обратная связь — в любой момент времени пользователь
 *   должен понимать что происходит с интерфейсомы
 *   - Можно ли писать текст сообщения?
 *   - Валидно ли сообщение, которое он отправляет и можно ли его отправить?
 *   - После отправки 
 *    - началась ли отправка?
 *    - пришло ли сообщение на сервер? удачно ли?
 *    - [отображение сообщения в списке]
 * 
 * 1. Я нажал на кнопку отправить
 * 2. На сервер ушел POST-запрос
 * 3. Сервер обработал этот запрос
 * 4. Вернул мне ответ
 * 5. Я обработал ответ, понял есть ли ошибка
 * 6. Если нет ошибки — показал это
 * 6.1 Если есть ошибка — показал это
 * 
 * Хорошо бы дать возможность пользователю не отправлять одно и то же сообщение
 * несколько раз
 * 
 * Способы обратной связи 
 * 1. Ничего не делать
 * 2. Все заблокировать
 *   1. Заблокировать поле ввода и кнопку и поменять текст на кнопке
 *   2. Если удачно — разблокировать и вернуть текст обратно, очистить форму и отобразить обновленный список сообщений
 *   3. Если ошибка — разблокировать и вернуть текст обратно, не сбрасывать форму и показать ошибку
 * 3. Optimistic UI
 *   1. Мгновенно обновляет список сообщений и показывает наше сообщение в списке
 *      Очищает форму и дает возможность отправить новое сообщение
 *      Вновь созданному сообщению добавляет визуальный индикатор о его состоянии
 */


{
  /** выпадающее меню */
  document.addEventListener('DOMContentLoaded', function () {
    const menuButton = document.getElementById('menuButton');
    const dropdown = document.getElementById('headerDropdown');

    menuButton.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    document.addEventListener('click', function (e) {
      if (!dropdown.contains(e.target) && !menuButton.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    });
  });

 /** выпадающее меню сообщения */

    document.addEventListener('click', function(event) {
        // Проверяем, был ли клик по кнопке управления
        const controlButton = event.target.closest('[id^="message-menu-"]');

        if (controlButton) {
            const messageId = controlButton.id.split('-')[2];
            const menu = document.getElementById(`messageDropdown-${messageId}`);

            // Сначала закрываем все меню
            document.querySelectorAll('.message-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });

            // Потом открываем только нужное меню (если оно было закрыто)
            if (menu && !menu.classList.contains('show')) {
                menu.classList.add('show');
            }
        } else {
            // Клик вне кнопки — закрываем все меню
            document.querySelectorAll('.message-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });

  /**Цвет сообщения при вызове меню*/

    document.addEventListener('click', function(event) {
        const controlButton = event.target.closest('[id^="message-menu-"]');

        if (controlButton) {
            const messageId = controlButton.id.split('-')[2];
            const menu = document.getElementById(`messageDropdown-${messageId}`);
            const messageText = document.getElementById(`message-text-${messageId}`);

            // Закрываем все меню и убираем выделение
            document.querySelectorAll('.message-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
            document.querySelectorAll('.message-text.highlight-border').forEach(el => {
                el.classList.remove('highlight-border');
            });

            // Показываем только текущее меню и выделяем текст
            if (menu && !menu.classList.contains('show')) {
                menu.classList.add('show');
                if (messageText) {
                    messageText.classList.add('highlight-border');
                }
            }

        } else {
            // Клик вне кнопки — закрываем меню и снимаем выделение
            document.querySelectorAll('.message-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
            document.querySelectorAll('.message-text.highlight-border').forEach(el => {
                el.classList.remove('highlight-border');
            });
        }
    });

  /** сообщения */

  const container = document.querySelector(".messages");

  function renderMessages(messages) {
    container.innerHTML = "";

    for (const message of messages) {
      const messageElement = document.createElement("article");
      messageElement.className = "message";

      messageElement.innerHTML = `
        <div class="message-header">
          <div class="message-author">${message.username}</div>
          
          <button class="message-control" id="message-menu-${message.id}"></button>
          <div class="message-menu" id="messageDropdown-${message.id}">
            <button class="dropdown-item">View</button>
            <button class="dropdown-item">Edit</button>
            <button class="dropdown-item delete-red">Delete</button>
            <button class="dropdown-item last-item">Item</button>
          </div>
          
        </div>
        <p class="message-text" id="message-text-${message.id}">${message.text}</p>
        <time class="message-time">${message.timestamp}</time>
      `;

      container.appendChild(messageElement);
    }
  }

  function getMessages() {
    fetch("http://localhost:4000/messages", {
      method: "GET",
    })
      .then(function (messagesResponse) {
        if (messagesResponse.status !== 200) {
          throw new Error("Couldn't get messages from server");
        }

        return messagesResponse.json();
      })
      .then(function (messagesList) {
        console.log(messagesList);
        renderMessages(messagesList);
      });
  }

  function initForm() {
    const formContainer = document.querySelector("form");
    const formTextField = formContainer.querySelector("textarea");
    const formSubmitButton = formContainer.querySelector("button");


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

      const form = document.querySelector("form");
      const textarea = form.querySelector("textarea");

      form.addEventListener("submit", function (event) {
          // Позволим отправку формы как обычно (если хотите перехватить — используйте preventDefault)
          // В вашем случае, возможно, оставить как есть
      });

      textarea.addEventListener("keydown", function (event) {
          if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault(); // предотвращаем перевод строки
              form.requestSubmit();   // имитирует клик по кнопке отправки (HTML5)
          }
      });

      /**--------*/

    formContainer.onsubmit = function(evt) {
      evt.preventDefault();
      const formData = new FormData(evt.target);

      const messageData = {
        username: formData.get("username"),
        text: formData.get("text"),
      };

      formTextField.disabled = true;
      formSubmitButton.disabled = true;
      formSubmitButton.textContent = "Сообщение отправляется...";

      fetch("http://localhost:4000/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      })
        .then(function(newMessageResponse) {
          console.log(newMessageResponse.status);

          if (newMessageResponse.status !== 200) {
            //
          }

          formTextField.disabled = false;
          formTextField.value = "";
          formSubmitButton.disabled = false;
          formSubmitButton.textContent = "Отправить";

          getMessages();
        });
    }
  }

  function initChat() {
    getMessages();
    setInterval(getMessages, 3000);
    initForm();
  }

  initChat();
}
