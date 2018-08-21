# How to run

docker build -t wwb-stream .

docker stop $(docker ps -a -q)
docker rm $(docker ps -a -q)

docker network create --driver bridge wwb-net

docker run -d -p 6379:6379 --name redis --network wwb-net redis
docker run -d -p 27017:27017 --name mongo --network wwb-net mongo

docker run --env-file env.list -p 3003:3003 -p 3004:3004 --network wwb-net wwb-stream

# How to start a local mongo DB and redis to test agains



# Environment variables that should be set

HEALTH_PORT = 3002

TEXT_PORT = 3003

DRAW_PORT = 3004

REDIS_URL = redis://localhost:6379

MONGO_URL = mongodb://localhost:27017

