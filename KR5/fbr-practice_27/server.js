import express from "express";
import amqplib from "amqplib";

const RABBITMQ_URL = "amqp://localhost";
const DLX_EXCHANGE = "dlx_exchange";
const DLQ = "dead_letter_queue";
const TASK_QUEUE = "task_queue";
const PORT = 3000;

let channel;

async function setupQueues(ch) {
  await ch.assertExchange(DLX_EXCHANGE, "direct", { durable: true });
  await ch.assertQueue(DLQ, { durable: true });
  await ch.bindQueue(DLQ, DLX_EXCHANGE, "dead");

  await ch.assertQueue(TASK_QUEUE, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": DLX_EXCHANGE,
      "x-dead-letter-routing-key": "dead",
    },
  });
}

async function connectRabbitMQ() {
  const connection = await amqplib.connect(RABBITMQ_URL);
  channel = await connection.createChannel();
  await setupQueues(channel);
}

const app = express();
app.use(express.json());

app.post("/tasks", async (req, res) => {
  const { type, payload } = req.body;

  if (!type || !payload) {
    return res.status(400).json({ error: "Требуются поля type и payload" });
  }

  const task = {
    id: String(Date.now()),
    type,
    payload,
  };

  channel.sendToQueue(TASK_QUEUE, Buffer.from(JSON.stringify(task)), {
    persistent: true,
  });

  console.log(`[Producer] Задача отправлена в очередь:`, task);
  res.status(201).json({ message: "Задача добавлена в очередь", task });
});

await connectRabbitMQ();

app.listen(PORT, () => {
  console.log(`[Producer] Express API: http://localhost:${PORT}`);
  console.log(`[Producer] POST /tasks — отправка задачи в очередь "${TASK_QUEUE}"`);
});
