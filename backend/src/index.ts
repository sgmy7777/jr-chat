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
  "username": string,
  "text": string,
  "timestamp": string,
};

const pgClient = new Client();

const server = express();


const messages:Message[] = [];

function* infiniteSequence() {
  let i = 0;
  while (true) {
    yield ++i;
  }
}

async function initServer() {
  if (!process.env.PGUSER) {
    throw new Error("Server cannot be started without database credentials provided in .env file");
  }

  const idIterator = infiniteSequence();

  server.use(cors());
  server.use(express.json());

  server.get("/", function (req: Request, res: Response) {
    res.status(200).json("Hello from backend");
  });

  server.get("/users", async function(req: Request, res: Response) {
    const usersResponse = await pgClient.query("SELECT * FROM users");
    res.status(200).send(usersResponse.rows);
  });

  server.get("/messages", function (req: Request, res: Response) {
    res.status(200).json([...messages]);
  });

  server.post("/messages", function (req: Request, res: Response) {
    const {username, text} = req.body;


    function validateInput(username: unknown, text: unknown) {
      // Проверка типа username
      if (typeof username !== "string") {
        return {field: "username", message: "Username must be a string"};
      }

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

      // Проверка типа текста
      if (typeof text !== "string") {
        return {field: "text", message: "Message must be a string"};
      }

      // Проверка на пустую строку
      if (text.trim().length === 0) {
        return {field: "text", message: "Message cannot be empty or whitespace only"};
      }

      // Минимальная длина
      if (text.length < 1) {
        return {field: "text", message: "Message is too short (min 1 character)"};
      }

      // Максимальная длина
      if (text.length > 500) {
        return {field: "text", message: "Message is too long (max 500 characters)"};
      }

      // Проверка на потенциально опасный HTML (опционально)
      if (/<[^>]*script[^>]*>/i.test(text)) {
        return {field: "text", message: "Message contains potentially dangerous content"};
      }

      // Всё ок
      return null;
    }

    const error = validateInput(username, text);
    if (error) {
      res.status(400).send({message: error.message});
      return;
    }

    const newMessage = {
      id: idIterator.next().value as number,
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      username,
    };

    messages.push(newMessage);
    res.status(201).send(newMessage);
  });

  await pgClient.connect();

  server.listen(PORT, function () {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
  });
}

process.on("exit", async function () {
  await pgClient.end();
});

initServer();