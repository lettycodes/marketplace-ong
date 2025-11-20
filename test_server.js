const express = require("express");
const app = express();
const port = 3002;

app.use(express.json());

app.get("/api/search/intelligent", (req, res) => {
  console.log("🔍 Teste de busca inteligente executado!");
  console.log("Query params:", req.query);

  const logData = {
    timestamp: new Date().toISOString(),
    query: req.query.q || "teste",
    aiFiltersUsed: req.query.category ? ["category"] : [],
    success: true,
    fallback: false,
    userId: "test-user",
    organizationId: "test-org",
  };

  console.log("📝 Log de busca simulado:", logData);

  res.json({
    success: true,
    results: [
      {
        id: 1,
        name: "Produto Teste",
        description: "Produto de teste para verificar busca",
        price: 29.99,
      },
    ],
    logData,
  });
});

app.listen(port, () => {
  console.log(`🚀 Servidor de teste rodando em http://localhost:${port}`);
  console.log(
    "💡 Teste a busca em: http://localhost:3002/api/search/intelligent?q=teste&category=alimentos"
  );
});
