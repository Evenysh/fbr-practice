import amqplib from "amqplib";
import { processWithRetry } from "./retry.js";

const RABBITMQ_URL = "amqp://localhost";
const TASK_QUEUE = "task_queue";
const MAX_RETRIES = 3;
const WORKER_ID = process.env.WORKER_ID || "1";

async function performTask(task) {
  console.log(`[Worker ${WORKER_ID}] Обработка задачи: ${task.id} (${task.type})`);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  console.log(`[Worker ${WORKER_ID}] Задача ${task.id} выполнена`);
}

async function startWorker() {
  const connection = await amqplib.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue(TASK_QUEUE, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": "dlx_exchange",
      "x-dead-letter-routing-key": "dead",
    },
  });

  channel.prefetch(1);

  channel.consume(TASK_QUEUE, async (msg) => {
    if (!msg) return;

    const task = JSON.parse(msg.content.toString());
    console.log(`[Worker ${WORKER_ID}] Получена задача:`, task);

    try {
      await processWithRetry(task, performTask, { maxRetries: MAX_RETRIES });
      channel.ack(msg);
    } catch (err) {
      console.error(
        `[Worker ${WORKER_ID}] Сообщение отправлено в DLQ: ${err.message}`
      );
      channel.nack(msg, false, false);
    }
  });

  console.log(`[Worker ${WORKER_ID}] Запущен, ожидание задач в "${TASK_QUEUE}"...`);
}

await startWorker();
