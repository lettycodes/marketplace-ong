@echo off
echo 🚀 Iniciando setup do Marketplace...

REM Verificar se Docker está rodando
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker não está rodando. Por favor, inicie o Docker primeiro.
    exit /b 1
)

REM Parar containers existentes
echo 🧹 Limpando containers existentes...
docker-compose down -v

REM Construir e iniciar os serviços
echo 🏗️  Construindo e iniciando os serviços...
docker-compose up -d --build

REM Aguardar o banco de dados ficar disponível
echo ⏳ Aguardando banco de dados ficar disponível...
timeout /t 30 /nobreak

REM Executar migrações
echo 📊 Executando migrações do banco...
docker-compose exec backend npm run migrate

REM Executar seeds
echo 🌱 Populando banco com dados de exemplo...
docker-compose exec backend npm run seed

echo ✅ Setup concluído!
echo.
echo 🌐 Acesse a aplicação:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:3001
echo.
echo 👤 Usuários de teste:
echo    maria@ongesperanca.org / 123456
echo    joao@institutosolidariedade.org / 123456
echo.
echo 📋 Para visualizar logs:
echo    docker-compose logs -f