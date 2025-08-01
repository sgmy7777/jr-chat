import express, { Request, Response } from "express";
import cors from "cors";
import { Client } from 'pg'

const PORT = process.env.APP_PORT || 4000;

type User = {
  "user_id": number,
  "username": string,
};

type Message = {
  "id": number,
  "username": string | null,
  "text": string,
  "timestamp": string,
};

const pgClient = new Client();

const server = express();

// Функция валидации входных данных
function validateInput(inputType: 'username' | 'text', value: unknown) {
  if (inputType === 'username') {
    // Проверка типа username
    if (typeof value !== "string") {
      return {field: "username", message: "Username must be a string"};
    }

    const username = value.trim();

    // Минимальная длина
    if (username.length < 2) {
      return {field: "username", message: "Username is too short (min 2 characters)"};
    }

    // Максимальная длина
    if (username.length > 50) {
      return {field: "username", message: "Username is too long (max 50 characters)"};
    }

    // Только латинские буквы, цифры и подчёркивания
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return {field: "username", message: "Username contains invalid characters"};
    }

    return null;
  }

  if (inputType === 'text') {
    // Проверка типа текста
    if (typeof value !== "string") {
      return {field: "text", message: "Message must be a string"};
    }

    // Проверка на пустую строку
    if (value.trim().length === 0) {
      return {field: "text", message: "Message cannot be empty or whitespace only"};
    }

    // Минимальная длина
    if (value.length < 1) {
      return {field: "text", message: "Message is too short (min 1 character)"};
    }

    // Максимальная длина
    if (value.length > 500) {
      return {field: "text", message: "Message is too long (max 500 characters)"};
    }

    // Проверка на потенциально опасный HTML (опционально)
    if (/<[^>]*script[^>]*>/i.test(value)) {
      return {field: "text", message: "Message contains potentially dangerous content"};
    }

    return null;
  }

  return {field: "unknown", message: "Invalid input type"};
}

async function initServer() {
  if (!process.env.PGUSER) {
    throw new Error("Server cannot be started without database credentials provided in .env file");
  }

  server.use(cors());
  server.use(express.json());

  async function getUsers() {
    const usersResponse = await pgClient.query("SELECT * FROM users");
    return usersResponse.rows as User[];
  }

  async function getUserById(userId: number) {
    const usersResponse = await pgClient.query(`SELECT * FROM users WHERE user_id = $1::integer`, [userId]);

    if (usersResponse.rows.length > 0) {
      return usersResponse.rows[0] as User;
    }

    return null;
  }

  async function getUserByName(username: string) {
    const usersResponse = await pgClient.query(`SELECT * FROM users WHERE username = $1::text`, [username]);

    if (usersResponse.rows.length > 0) {
      return usersResponse.rows[0] as User;
    }

    return null;
  }

  server.get("/", function (req: Request, res: Response) {
    res.status(200).json("Hello from backend");
  });

  server.get("/users", async function(req: Request, res: Response) {
    try {
      const usersResponse = await getUsers();
      res.status(200).send(usersResponse);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  server.post("/users", async function (req: Request, res: Response) {
    try {
      const { username } = req.body;

      // Валидируем username
      const usernameError = validateInput('username', username);
      if (usernameError) {
        res.status(400).json({ message: usernameError.message });
        return;
      }

      const trimmedUsername = username.trim();
      const existingUser = await getUserByName(trimmedUsername);

      if (existingUser !== null) {
        // Пользователь уже существует, возвращаем его ID
        res.status(200).json({
          "user_id": existingUser.user_id,
        });
        return;
      }

      // Создаем нового пользователя
      const newUserResponse = await pgClient.query(`INSERT INTO users(
        username
      ) VALUES (
        $1::text
      ) RETURNING user_id`, [trimmedUsername]);

      if (newUserResponse.rows.length === 0) {
        res.status(500).json({ message: "Failed to create user" });
        return;
      }

      const newUserId = newUserResponse.rows[0].user_id;

      res.status(200).json({
        "user_id": newUserId,
      });

    } catch (error) {
      console.error("Error in /users POST:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  server.get("/messages", async function (req: Request, res: Response) {
    try {
      const messagesResponse = await pgClient.query(`SELECT
                                                       messages.message_id AS id,
                                                       users.username AS username,
                                                       messages.text AS text,
                                                       TO_CHAR(messages.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS timestamp
                                                     FROM messages
                                                            LEFT JOIN users ON messages.user_id = users.user_id
                                                     ORDER BY messages.created_at ASC`);
      res.status(200).send(messagesResponse.rows as Message[]);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  server.post("/messages", async function (req: Request, res: Response) {
    try {
      const { user_id, text } = req.body;

      // Валидируем user_id
      if (typeof user_id !== 'number' || !Number.isInteger(user_id) || user_id <= 0) {
        res.status(400).json({
          message: "Invalid user_id. Must be a positive integer."
        });
        return;
      }

      // Валидируем text
      const textError = validateInput('text', text);
      if (textError) {
        res.status(400).json({ message: textError.message });
        return;
      }

      // Проверяем, существует ли пользователь
      const user = await getUserById(user_id);
      if (user === null) {
        res.status(401).json({
          message: "User not found. Please log in again.",
        });
        return;
      }

      // Создаем новое сообщение
      const newMessageResponse = await pgClient.query(`INSERT INTO messages(
        text,
        user_id
      ) VALUES ($1::text, $2::integer)`, [text, user_id]);

      if (newMessageResponse.rowCount === 0) {
        res.status(500).json({ message: "Failed to create message" });
        return;
      }

      res.sendStatus(201);

    } catch (error) {
      console.error("Error in /messages POST:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  await pgClient.connect();

  server.listen(PORT, function () {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
  });
}

process.on("exit", async function () {
  await pgClient.end();
});

process.on("SIGINT", async function () {
  console.log("\nShutting down server...");
  await pgClient.end();
  process.exit(0);
});

process.on("SIGTERM", async function () {
  console.log("\nShutting down server...");
  await pgClient.end();
  process.exit(0);
});

initServer().catch(error => {
  console.error("Failed to start server:", error);
  process.exit(1);
});