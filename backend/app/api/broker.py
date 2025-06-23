import taskiq_fastapi
from taskiq import TaskiqScheduler, ZeroMQBroker
from taskiq_redis import RedisScheduleSource

broker = ZeroMQBroker()

# Here's the source that is used to store scheduled tasks
redis_source = RedisScheduleSource("redis://localhost:6379/0")


taskiq_fastapi.init(broker, "app.api.main:app")


scheduler = TaskiqScheduler(broker, sources=[redis_source])
