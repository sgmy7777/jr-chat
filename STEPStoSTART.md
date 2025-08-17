1) запускаем базу данных в докере 'docker-compose up -d database' 
2) переходим в backend (cd backend) и запускаем сервер бекенда 'pnpm dev'
3) переходим во frontend (cd frontend) и запускаем сервер  фронта 'pnpm start'


Также у меня запускается все и через докер  'docker-compose up -d'

вот содержимое моего .env :
        PGUSER=postgres
        PGPASSWORD=1234567899
        PGHOST=localhost
        PGPORT=5433
        PGDATABASE=jr-chat
        APP_PORT=4000