# Практика 22 — балансировка нагрузки (Nginx + HAProxy)

Реализация практического задания:
- не менее 2 backend-серверов на разных портах (в Docker — 3 инстанса, 2 основных + 1 backup);
- Nginx как балансировщик нагрузки + `max_fails` / `fail_timeout`;
- тест распределения запросов;
- альтернативный пример балансировки через HAProxy.

## Требования
- Docker + Docker Compose.

## Структура
- `backend/server.js` — простой backend (отдает JSON с `instance`/`port`)
- `nginx/nginx.conf` — upstream + `max_fails`/`fail_timeout` + `proxy_next_upstream`
- `haproxy/haproxy.cfg` — roundrobin + health check `/health`
- `docker-compose.yml` — сервисы backend + профили `nginx` и `haproxy`

### Порты (важно не перепутать)

| Сервис | Порт на вашем компьютере |
|--------|---------------------------|
| **Nginx** (балансировщик) | **8080** → контейнер `:80` |
| **HAProxy** (балансировщик) | **8081** → контейнер `:80` |

После команды `--profile haproxy up` проверять нужно **`http://localhost:8081/`**, а не `8080`. На **8080** по-прежнему отвечает **Nginx**, если контейнер nginx был запущен ранее — round-robin по `backend1`/`backend2` вы там видите именно от Nginx.

## Запуск (Nginx)
Из папки `KR4/fbr-practice_22`:

```bash
docker compose --profile nginx up --build
```

Балансировщик будет доступен на `http://localhost:8080/`.

### Тест распределения запросов

```bash
for i in {1..10}; do curl -s http://localhost:8080/ | jq -r '.instance'; done
```

Если `jq` не установлен:

```bash
for i in {1..10}; do curl -s http://localhost:8080/; echo; done
```

Ожидаемо, `instance` будет чередоваться между `backend1` и `backend2` (round-robin).

### Тест отказоустойчивости (max_fails / fail_timeout + backup)
Остановить один из основных backend:

```bash
docker compose stop backend1
```

И повторить запросы:

```bash
for i in {1..10}; do curl -s http://localhost:8080/ | jq -r '.instance'; done
```

Ожидаемо, ответы будут приходить с `backend2`, а при недоступности обоих основных — с `backend3-backup`.

Вернуть backend:

```bash
docker compose start backend1
```

## Запуск (HAProxy)
Nginx и HAProxy **не конфликтуют по портам** (8080 и 8081 разные). Останавливать nginx не обязательно — просто для проверки HAProxy используйте **8081**.

```bash
docker compose --profile haproxy up --build
```

HAProxy будет доступен только на **`http://localhost:8081/`** (не путать с 8080).

### Тест распределения запросов (HAProxy)

```bash
for i in {1..10}; do curl -s http://localhost:8081/ | jq -r '.instance'; done
```

HAProxy использует `option httpchk GET /health` и исключает недоступные backend из балансировки.

Примечание: при остановке одного backend возможна кратковременная ошибка `503` до того, как health-check пометит сервер недоступным (после чего трафик пойдет только на доступные узлы).

## Остановка

```bash
docker compose down
```

