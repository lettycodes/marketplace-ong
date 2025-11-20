# 🏪 ONG Marketplace

Um marketplace completo para conectar consumidores com ONGs parceiras. Cada organização mantém seu estoque de produtos (artesanato, alimentos, vestuário, etc.) e os disponibiliza para venda em um portal público unificado.

## 🚀 Funcionalidades Principais

### 👥 Área da ONG (Restrita)
- **CRUD Completo de Produtos**: Cadastro/edição com validações
- **Gerenciamento de Pedidos**: Visualização de pedidos por organização
- **Dashboard Organizacional**: Estatísticas e informações da organização
- **Segurança Multi-Tenancy**: Isolamento rigoroso por `organizationId`
- **Autenticação JWT**: Sistema de login seguro com tokens

### 🌐 Portal Público
- **Catálogo de Produtos**: Lista paginada com produtos de todas as ONGs
- **Filtros Avançados**: Por categoria, preço, organização
- **Sistema de Carrinho**: Adição/remoção de produtos e quantidades
- **Finalização de Pedidos**: Criação de pedidos com dados do cliente

### 🤖 Busca Inteligente com AI
- **Processamento de Linguagem Natural**: "doces até 50 reais" → filtros estruturados
- **Interpretação Contextual**: Extração automática de categorias e preços
- **Fallback Automático**: Busca simples quando AI falha (timeout 5s)
- **Logs Detalhados**: Métricas de sucesso/fallback da AI

### 📊 Sistema de Logs e Observabilidade
- **Logs Estruturados**: JSON para todas as requisições HTTP
- **Métricas de Performance**: Latência, status codes, identificadores
- **Logs de Busca**: Tracking específico para buscas AI com fallback
- **Dashboard de Logs**: Interface para visualização e filtros

### 🔄 Gestão de Produtos Avançada
- **Cascade Delete**: Opção de remoção forçada com dependências
- **Validações**: Preços, quantidades, dados obrigatórios
- **Upload de Imagens**: URLs para imagens de produtos

## 🛠️ Stack Tecnológica

- **Backend**: Node.js + TypeScript + Express + Prisma ORM
- **Frontend**: React + TypeScript + Vite + Context API
- **Banco de Dados**: PostgreSQL 15 + Docker
- **Autenticação**: JWT com bcrypt
- **AI/LLM**: OpenAI GPT-3.5-turbo
- **Logs**: Winston + arquivo JSON
- **Containerização**: Docker + Docker Compose
- **Rate Limiting**: express-rate-limit configurável

## 📊 Esquema do Banco de Dados (ERD)

### Estrutura das Tabelas

```
Organizations (ONGs)
├── id (UUID, PK)
├── name (String)
├── email (String, unique)
├── description (String, optional)
├── website (String, optional)
├── phone (String, optional)
├── address (String, optional)
├── createdAt (DateTime)
└── updatedAt (DateTime)

Users (Usuários das ONGs + Consumidores)
├── id (UUID, PK)
├── email (String, unique)
├── name (String)
├── passwordHash (String)
├── organizationId (UUID, FK → Organizations.id, optional)
├── isAdmin (Boolean)
├── createdAt (DateTime)
└── updatedAt (DateTime)

Categories (Categorias de Produtos)
├── id (UUID, PK)
├── name (String, unique)
├── createdAt (DateTime)
└── updatedAt (DateTime)

Products (Produtos das ONGs)
├── id (UUID, PK)
├── name (String)
├── description (String)
├── price (Decimal)
├── imageUrl (String, optional)
├── stockQty (Integer)
├── weightGrams (Integer)
├── organizationId (UUID, FK → Organizations.id) ⭐ Multi-tenancy
├── categoryId (UUID, FK → Categories.id)
├── isActive (Boolean)
├── createdAt (DateTime)
└── updatedAt (DateTime)

Logs (Sistema de Logs)
├── id (UUID, PK)
├── timestamp (DateTime)
├── method (String: GET, POST, PUT, DELETE, etc.)
├── route (String)
├── statusCode (Integer)
├── latencyMs (Integer)
├── userId (String, optional)
├── organizationId (String, optional)
├── details (JSON, optional)
└── createdAt (DateTime)
```

### Relacionamentos

```
Organizations 1:N Users (uma ONG tem vários usuários)
Organizations 1:N Products (uma ONG tem vários produtos)

Categories 1:N Products (uma categoria tem vários produtos)

Orders 1:N OrderItems (um pedido tem vários itens)
Products 1:N OrderItems (um produto pode estar em vários itens)
```

### Índices Principais

```sql
-- Multi-tenancy (crítico para performance)
CREATE INDEX idx_products_organization_id ON products(organization_id);
CREATE INDEX idx_orders_organization_id ON orders(organization_id);

-- Buscas e filtros
CREATE INDEX idx_products_active_category ON products(is_active, category_id);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);

-- Logs
CREATE INDEX idx_logs_timestamp ON logs(timestamp);
CREATE INDEX idx_logs_org_id ON logs(organization_id);
```

## 🔧 Como Rodar Localmente (Docker Compose)

### Pré-requisitos
- **Docker** e **Docker Compose** instalados
- **Git** para clone do repositório
- **OpenAI API Key** (opcional, para busca inteligente)

### Passo a Passo Completo

#### 1. **Clone o Repositório**
```bash
git clone <repository-url>
cd marketplace
```

#### 2. **Configure as Variáveis de Ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# OpenAI API Key (obrigatório para busca inteligente)
OPENAI_API_KEY=your-openai-api-key

# JWT Secret (altere em produção)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Database Configuration (configuração Docker)
DATABASE_URL="postgresql://marketplace_user:marketplace_password@localhost:5433/marketplace?schema=public"

# Backend Configuration
PORT=3001

# Frontend Configuration  
VITE_API_URL=http://localhost:3001

# Docker Database Settings
POSTGRES_DB=marketplace
POSTGRES_USER=marketplace_user
POSTGRES_PASSWORD=marketplace_password
```

#### 3. **Inicie os Serviços com Docker Compose**
```bash
# Iniciar todos os serviços (database, backend, frontend)
docker-compose up --build

# Ou em modo detached (background)
docker-compose up -d --build
```

**Este comando irá:**
- ✅ PostgreSQL na porta **5433**
- ✅ Backend API na porta **3001** 
- ✅ Frontend React na porta **3000**

#### 4. **Execute as Migrações do Banco** (em outro terminal)
```bash
# Aguarde os containers iniciarem completamente, então:

# Entre no container do backend
docker-compose exec backend bash

# Execute as migrações
npm run migrate

# Execute o seed para dados de exemplo
npm run seed

# Saia do container
exit
```

#### 5. **Acesse a Aplicação**
- 🌐 **Frontend (React)**: http://localhost:3000
- 🔌 **Backend API**: http://localhost:3001
- 🗄️ **Banco PostgreSQL**: localhost:5433
- 📊 **Health Check**: http://localhost:3001/health

### Verificação de Funcionamento

```bash
# Teste se o backend está respondendo
curl http://localhost:3001/health

# Teste uma rota pública
curl "http://localhost:3001/api/public/products?limit=5"

# Ver logs em tempo real
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 🎯 Credenciais de Teste (Dados do Seed)

O sistema vem com dados pré-configurados para facilitar os testes:

#### 👨‍💼 **Administradores de ONGs** (Login: email / senha)
1. **EcoLife Brasil** (Sustentabilidade)
   - **Email:** `maria@ecolife.org`
   - **Senha:** `123456`
   - **Permissões:** Administrador + Gestão de produtos

2. **Artesanato Social** (Cooperativa)
   - **Email:** `joao@artesanato.org` 
   - **Senha:** `123456`
   - **Permissões:** Administrador + Gestão de produtos

3. **Verde Vida** (Produtos Orgânicos)
   - **Email:** `ana@email.com`
   - **Senha:** `123456`
   - **Permissões:** Administrador + Gestão de produtos

#### 👤 **Consumidor**
4. **Cliente Final**
   - **Email:** `pedro@email.com`
   - **Senha:** `123456` 
   - **Tipo:** Usuário consumidor (sem organização)

#### 📦 **Produtos de Exemplo**
- **10 produtos** distribuídos entre as 3 organizações
- **5 categorias**: Produtos Sustentáveis, Artesanato, Alimentos Orgânicos, Vestuário Sustentável
- **Preços variados**: R$ 12,90 a R$ 89,90
- **Estoque diferenciado**: 15 a 150 unidades

## 🔌 Principais Rotas da API

### 📂 Rotas Públicas (Sem Autenticação)

#### **Produtos**
```http
GET /api/public/products
Query: ?page=1&limit=12&category=Artesanato&priceMin=10&priceMax=100&search=cesta&organization=EcoLife
Descrição: Lista produtos com filtros e paginação
Resposta: { success, data: { products, pagination } }

GET /api/public/products/:id
Descrição: Detalhes completos de um produto específico
Resposta: { success, data: { product } }
```

#### **Busca Inteligente**
```http
POST /api/public/search?q=doces até 50 reais
Descrição: Busca com IA + fallback automático
Resposta: { success, data: { products, searchInfo, pagination } }

GET /api/search/intelligent?q=artesanato barato&page=1&limit=10
Descrição: Busca inteligente via GET (alternativa)
Resposta: { success, data: { products, searchInfo: { aiSuccess, fallbackUsed } } }
```

#### **Categorias e Organizações**
```http
GET /api/public/categories
Descrição: Lista todas as categorias com contagem de produtos
Resposta: { success, data: { categories } }

GET /api/public/organizations  
Descrição: Lista organizações ativas com contagem de produtos
Resposta: { success, data: { organizations } }
```

### 🔐 Rotas de Autenticação

```http
POST /api/auth/register
Body: { email, name, password, organizationName?, organizationEmail?, organizationDescription? }
Descrição: Registro de usuário individual ou com nova organização
Resposta: { success, token, user }

POST /api/auth/login
Body: { email, password }
Descrição: Login com email/senha
Resposta: { success, token, user: { id, email, name, organizationId, isAdmin } }
```

### 🏢 Rotas da ONG (Protegidas - JWT Required)

#### **Gestão de Produtos**
```http
GET /api/products
Query: ?page=1&limit=10&category=Artesanato&search=cesta
Headers: Authorization: Bearer <token>
Descrição: Lista produtos da organização autenticada
Resposta: { success, data: { products, pagination } }

POST /api/products
Headers: Authorization: Bearer <token>
Body: { name, description, price, categoryId, imageUrl?, stockQty, weightGrams }
Descrição: Criar novo produto (auto-associado à organização do token)
Resposta: { success, data: { product } }

PUT /api/products/:id
Headers: Authorization: Bearer <token>  
Body: { name, description, price, categoryId, imageUrl?, stockQty, weightGrams, isActive }
Descrição: Editar produto próprio da organização
Resposta: { success, data: { product } }

DELETE /api/products/:id
Headers: Authorization: Bearer <token>
Descrição: Excluir produto (cascade: remove order_items relacionados)
Resposta: { success, message }
```

#### **Gestão Organizacional**
```http
GET /api/organizations
Headers: Authorization: Bearer <token>
Descrição: Dados da organização autenticada + estatísticas
Resposta: { success, data: { organization: { _count: { products, orders } } } }
```

### 📊 Rotas de Logs e Observabilidade

```http
GET /api/logs
Query: ?page=1&limit=50&method=GET&statusCode=200&route=/api/products&startDate=2024-01-01&endDate=2024-12-31
Descrição: Logs estruturados do sistema (sem autenticação para desenvolvimento)
Resposta: { success, data: { logs, pagination } }

GET /api/logs/stats
Descrição: Estatísticas agregadas dos logs
Resposta: { success, data: { totalLogs, methods, statusCodes, routes } }

GET /api/logs/test
Descrição: Rota de teste para verificar funcionamento dos logs
Resposta: { success, message, data: { logs } }
```

### ⚡ Rate Limiting

- **Desenvolvimento**: 1000 requests / 15 minutos
- **Produção**: 100 requests / 15 minutos
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

## 🤖 Busca Inteligente com AI (Configuração Detalhada)

### 🔑 Configuração de Variáveis de Ambiente

#### **Obrigatórias para Busca AI**
```env
# OpenAI API Key - obrigatório para funcionalidade de IA
OPENAI_API_KEY=sk-your-openai-api-key-here

# Opcional: timeout personalizado (padrão: 5000ms)
AI_TIMEOUT_MS=5000
```

#### **Como Obter uma OpenAI API Key**
1. Acesse: https://platform.openai.com/api-keys
2. Faça login ou crie uma conta OpenAI
3. Clique em "Create new secret key"
4. Copie a chave e adicione no `.env`
5. **Importante**: Adicione créditos à sua conta OpenAI

### ⚙️ Funcionamento do Sistema

#### **Fluxo da Busca Inteligente**
```
Usuário digita: "doces até 50 reais"
       ↓
[1] Valida query (min: 1 char, max: 200)
       ↓  
[2] Envia para OpenAI GPT-3.5-turbo (timeout: 5s)
       ↓
[3] AI retorna JSON: {category: "Doces", priceMax: 50}
       ↓
[4] Aplica filtros estruturados no banco
       ↓
[5] Retorna produtos + interpretação
```

#### **Em Caso de Falha da AI**
```
AI falhou (timeout/erro)
       ↓
[FALLBACK] Extrai palavras-chave: ["doces", "50", "reais"]
       ↓  
[FALLBACK] Busca textual nos campos name/description
       ↓
[FALLBACK] Aplica filtros básicos se possível
       ↓
Retorna resultados + flag fallbackUsed: true
```

### ⏱️ Configuração de Timeout

#### **Timeout Padrão: 5 segundos**
```typescript
// Configurável via variável de ambiente
const AI_TIMEOUT = process.env.AI_TIMEOUT_MS || 5000;

// Timeout aplicado na requisição OpenAI
const response = await axios.post(url, payload, {
  timeout: AI_TIMEOUT,
  headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
});
```

#### **Por que 5 segundos?**
- ⚡ **UX**: Usuário não espera mais de 5s por uma busca
- 🔄 **Fallback**: Tempo suficiente para AI + margem para fallback
- 💰 **Custo**: Evita requests longos que consumem tokens
- 🔧 **Configurável**: Pode ser ajustado conforme necessidade

### 🛡️ Mecanismo de Fallback

#### **Quando o Fallback é Ativado**
- ❌ OpenAI API Key não configurada
- ⏰ Timeout excedido (> 5 segundos)  
- 🔌 Erro de conectividade com OpenAI
- 🚫 Rate limit da OpenAI atingido
- 📝 Resposta inválida da AI (JSON malformado)

#### **Estratégias do Fallback**
```typescript
// 1. Extração de palavras-chave
const keywords = query
  .toLowerCase()
  .split(/\s+/)
  .filter(word => word.length > 2)
  .slice(0, 5); // Max 5 palavras

// 2. Busca textual nos produtos
const searchFilter = {
  OR: [
    { name: { contains: keyword, mode: 'insensitive' } },
    { description: { contains: keyword, mode: 'insensitive' } }
  ]
};

// 3. Filtros heurísticos básicos
if (query.includes('até') || query.includes('máximo')) {
  // Tenta extrair preço máximo
  const priceMatch = query.match(/(\d+(?:,\d{2})?)/);
  if (priceMatch) filters.priceMax = parseFloat(priceMatch[1]);
}
```

### 📊 Logs e Métricas da Busca AI

#### **Logs Estruturados**
```json
{
  "timestamp": "2024-11-20T16:30:00Z",
  "level": "info", 
  "message": "AI search completed",
  "query": "doces até 50 reais",
  "aiSuccess": true,
  "fallbackUsed": false,
  "latencyMs": 1250,
  "filters": {
    "category": "Doces",
    "priceMax": 50
  },
  "interpretation": "Categoria: Doces; Preço máximo: R$ 50",
  "resultCount": 12,
  "userId": "user-uuid",
  "organizationId": null
}
```

#### **Logs de Fallback**
```json
{
  "timestamp": "2024-11-20T16:31:00Z", 
  "level": "warn",
  "message": "AI search failed, using fallback",
  "query": "produtos orgânicos",
  "aiSuccess": false,
  "fallbackUsed": true,
  "errorReason": "OpenAI timeout after 5000ms",
  "latencyMs": 5100,
  "fallbackFilters": {
    "keywords": ["produtos", "orgânicos"]
  },
  "resultCount": 8
}
```

### 🎯 Exemplos de Conversões AI

#### **Filtros por Categoria**
```
Input: "doces artesanais" 
AI Output: { "category": "Doces", "keywords": ["artesanais"] }

Input: "produtos de artesanato"
AI Output: { "category": "Artesanato" }

Input: "vestuário sustentável"  
AI Output: { "category": "Vestuário Sustentável" }
```

#### **Filtros por Preço**
```
Input: "até 50 reais"
AI Output: { "priceMax": 50 }

Input: "entre 20 e 100 reais"
AI Output: { "priceMin": 20, "priceMax": 100 }

Input: "mais de 30 reais"
AI Output: { "priceMin": 30 }
```

#### **Filtros Combinados**
```
Input: "doces até 25 reais da Verde Vida"
AI Output: { 
  "category": "Doces", 
  "priceMax": 25, 
  "organization": "Verde Vida" 
}

Input: "artesanato barato e sustentável"
AI Output: { 
  "category": "Artesanato", 
  "keywords": ["barato", "sustentável"],
  "priceMax": 50 
}
```

### 🔧 Monitoramento e Debug

#### **Health Check da AI**
```http
GET /api/search/ai-health
Resposta: {
  "aiConfigured": true,
  "lastSuccessAt": "2024-11-20T16:30:00Z", 
  "lastFailureAt": "2024-11-20T15:45:00Z",
  "successRate": 0.87,
  "avgLatencyMs": 1350
}
```

#### **Configurações Recomendadas**

**Desenvolvimento:**
```env
OPENAI_API_KEY=sk-test-key
AI_TIMEOUT_MS=3000  # Mais rápido para testes
```

**Produção:**
```env  
OPENAI_API_KEY=sk-prod-key
AI_TIMEOUT_MS=5000  # Padrão balanceado
```

**Sem AI (só fallback):**
```env
# Não definir OPENAI_API_KEY
# Sistema funcionará 100% com fallback textual
```

## 🔐 Segurança e Multi-Tenancy

### 🏛️ Arquitetura de Isolamento

#### **Princípios Fundamentais**
- **Zero Trust**: Nunca confiar em dados do client-side
- **Token-Based**: Organização derivada sempre do JWT válido
- **Database-Level**: Filtros automáticos em todas as queries
- **Middleware Protection**: Validação em cada request autenticado

#### **Fluxo de Autenticação**
```
[1] Login: email/password → JWT(userId)
[2] Request: JWT → Middleware → User lookup → organizationId
[3] Query: WHERE organizationId = req.organizationId 
[4] Response: Apenas dados da organização autenticada
```

### 🛡️ Implementação Técnica

#### **JWT Token Structure**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "iat": 1700500000,
  "exp": 1701104800
}
```

#### **Middleware de Segurança**
```typescript
// ✅ SEGURO: Derivar organização do token
export const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET);
  
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { organization: true }
  });
  
  req.userId = user.id;
  req.organizationId = user.organizationId; // ← Fonte da verdade
  req.isAdmin = user.isAdmin;
  next();
};
```

#### **Proteção em Queries**
```typescript
// ✅ SEGURO: Filtro automático por organização
router.get('/products', async (req: AuthenticatedRequest, res) => {
  const products = await prisma.product.findMany({
    where: {
      organizationId: req.organizationId // ← Do token JWT
    }
  });
});

// ❌ INSEGURO: Nunca confiar no client
router.get('/products', async (req, res) => {
  const products = await prisma.product.findMany({
    where: {
      organizationId: req.body.organizationId // ← Perigoso!
    }
  });
});
```

### 🔒 Casos de Uso de Segurança

#### **Criação de Produtos**
```typescript
// Produto sempre associado à organização do token
const newProduct = await prisma.product.create({
  data: {
    ...req.body,
    organizationId: req.organizationId, // ← Auto-associado
  }
});
```

#### **Edição de Produtos**
```typescript
// Só permite editar produtos próprios
const product = await prisma.product.findFirst({
  where: {
    id: req.params.id,
    organizationId: req.organizationId // ← Dupla verificação
  }
});

if (!product) {
  return res.status(404).json({ error: 'Product not found' });
}
```

### 🚨 Validações de Segurança

#### **Checklist de Proteções**
- ✅ **Autenticação**: Todas as rotas organizacionais requerem JWT
- ✅ **Autorização**: organizationId sempre derivado do token
- ✅ **Validação de Input**: express-validator em todos os endpoints
- ✅ **Rate Limiting**: 1000 req/15min (dev), 100 req/15min (prod)
- ✅ **CORS**: Configurado para domínios específicos
- ✅ **Helmet**: Headers de segurança automáticos
- ✅ **Hash de Senhas**: bcrypt com salt rounds = 12
- ✅ **SQL Injection**: Prisma ORM previne automaticamente
- ✅ **XSS Protection**: Sanitização de inputs

#### **Configurações de Produção**
```env
# Secrets únicos e complexos
JWT_SECRET=complex-production-secret-256-bits
POSTGRES_PASSWORD=strong-db-password

# Rate limiting restritivo  
NODE_ENV=production

# CORS específico
CORS_ORIGIN=https://yourdomain.com

# Headers de segurança
HELMET_CSP=true
```

### 🔧 Setup para Desenvolvimento
```bash
# Fork o repositório
git clone https://github.com/lettycodes/marketplace-ong.git

# Configure ambiente local
cp .env.example .env
# Edite .env com suas configurações

# Instale dependências localmente (opcional)
cd backend && npm install
cd ../frontend && npm install

# Use Docker para ambiente completo
docker-compose up --build
```

---

**Desenvolvido com ❤️ para conectar consumidores conscientes com ONGs que fazem a diferença.**