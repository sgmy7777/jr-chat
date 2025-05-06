import express, { Request, Response } from "express";
import cors from "cors";

type Message = {
  "id": number,
  "username": string,
  "text": string,
  "timestamp": string,
};

const server = express();
const PORT = 4000;

const messages:Message[] = [];

function* infiniteSequence() {
  let i = 0;
  while (true) {
    yield ++i;
  }
}

const idIterator = infiniteSequence();

server.use(cors());
server.use(express.json());

server.get("/", function(req: Request, res: Response) {
  res.status(200).json("Hello from backend");
});

server.get("/messages", function(req: Request, res: Response) {
  res.status(200).json([...messages]);
});

server.post("/messages", function(req: Request, res: Response) {
  const { username, text } = req.body;

  // 2 Стратегии валидации
  //   1. Проверяются все ошибки и отправляются скопом
  //   2. Проверка останавливается на первой попавшейся ошибке и отправляется эта ошибка

  // *Некрасивенько, что в одном if проводятся сразу все проверки username
  // потому что сложно сформировать адекватное сообщение об ошибке
  // if (typeof username !== "string" || username.length < 2 || username.length > 50) {
  //   res.status(400).send({
  //     message: "Incorrect username",
  //   });
  //
  //   return;
  // }
  //
  // if (typeof text !== "string" || text.length < 1 || text.length > 500) {
  //   res.status(400).send({
  //     message: "Incorrect message text",
  //   });
  //
  //   return;
  // }

  function validateInput(username: unknown, text: unknown) {
    // Проверка типа username
    if (typeof username !== "string") {
      return { field: "username", message: "Username must be a string" };
    }

    // Минимальная длина
    if (username.length < 2) {
      return { field: "username", message: "Username is too short (min 2 characters)" };
    }

    // Максимальная длина
    if (username.length > 50) {
      return { field: "username", message: "Username is too long (max 50 characters)" };
    }

    // Только латинские буквы, цифры и подчёркивания
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { field: "username", message: "Username contains invalid characters" };
    }

    // Проверка типа текста
    if (typeof text !== "string") {
      return { field: "text", message: "Message must be a string" };
    }

    // Проверка на пустую строку
    if (text.trim().length === 0) {
      return { field: "text", message: "Message cannot be empty or whitespace only" };
    }

    // Минимальная длина
    if (text.length < 1) {
      return { field: "text", message: "Message is too short (min 1 character)" };
    }

    // Максимальная длина
    if (text.length > 500) {
      return { field: "text", message: "Message is too long (max 500 characters)" };
    }

    // Проверка на потенциально опасный HTML (опционально)
    if (/<[^>]*script[^>]*>/i.test(text)) {
      return { field: "text", message: "Message contains potentially dangerous content" };
    }

    // Всё ок
    return null;
  }
  const error = validateInput(username, text);
  if (error) {
    res.status(400).send({ message: error.message });
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

server.listen(PORT, function() {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
