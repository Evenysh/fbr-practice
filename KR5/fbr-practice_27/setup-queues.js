import amqplib from "amqplib";

const RABBITMQ_URL = "amqp://localhost";
const DLX_EXCHANGE = "dlx_exchange";
const DLQ = "dead_letter_queue";
const TASK_QUEUE = "task_queue";

async function setupQueues() {
  const connection = await amqplib.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertExchange(DLX_EXCHANGE, "direct", { durable: true });
  await channel.assertQueue(DLQ, { durable: true });
  await channel.bindQueue(DLQ, DLX_EXCHANGE, "dead");

  await channel.assertQueue(TASK_QUEUE, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": DLX_EXCHANGE,
      "x-dead-letter-routing-key": "dead",
    },
  });

  console.log("Очереди настроены: task_queue → [DLX] → dead_letter_queue");
  await connection.close();
}

await setupQueues();
