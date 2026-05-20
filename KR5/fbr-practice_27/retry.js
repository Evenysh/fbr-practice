export async function processWithRetry(message, processor, options = {}) {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
  } = options;

  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      await processor(message);
      console.log(
        `[Retry] Успешно обработано за ${attempt + 1} попытку(и)`
      );
      return;
    } catch (err) {
      attempt++;
      if (attempt > maxRetries) {
        console.error(
          `[Retry] Исчерпаны все ${maxRetries} попытки. Сообщение отправляется в DLQ.`
        );
        throw err;
      }

      const exponentialDelay = Math.min(
        baseDelayMs * 2 ** (attempt - 1),
        maxDelayMs
      );
      const jitter = Math.random() * 1000;
      const delay = exponentialDelay + jitter;

      console.warn(
        `[Retry] Попытка ${attempt}/${maxRetries} провалилась: ${err.message}. Повтор через ${Math.round(delay)}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
