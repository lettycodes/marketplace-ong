import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  const categories = [
    { name: "Artesanato" },
    { name: "Alimentos" },
    { name: "Vestuário" },
    { name: "Doces" },
    { name: "Decoração" },
  ];

  console.log("Creating categories...");
  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  const categoriesCreated = await prisma.category.findMany();

  const organizations = [
    {
      name: "ONG Esperança",
      email: "contato@ongesperanca.org",
      description:
        "ONG dedicada ao desenvolvimento de comunidades carentes através do artesanato e capacitação profissional",
      website: "https://ongesperanca.org",
      phone: "(11) 99999-1111",
      address: "Rua da Esperança, 123, São Paulo - SP",
    },
    {
      name: "Instituto Solidariedade",
      email: "contato@institutosolidariedade.org",
      description:
        "Instituto focado na produção de alimentos orgânicos e capacitação de jovens em vulnerabilidade social",
      website: "https://institutosolidariedade.org",
      phone: "(21) 99999-2222",
      address: "Avenida da Solidariedade, 456, Rio de Janeiro - RJ",
    },
  ];

  console.log("Creating organizations...");
  const createdOrgs = [];
  for (const org of organizations) {
    const createdOrg = await prisma.organization.upsert({
      where: { email: org.email },
      update: {},
      create: org,
    });
    createdOrgs.push(createdOrg);
  }

  const users = [
    {
      name: "Maria Silva",
      email: "maria@ongesperanca.org",
      passwordHash: await bcrypt.hash("123456", 10),
      organizationId: createdOrgs[0].id,
      isAdmin: true,
    },
    {
      name: "João Santos",
      email: "joao@institutosolidariedade.org",
      passwordHash: await bcrypt.hash("123456", 10),
      organizationId: createdOrgs[1].id,
      isAdmin: true,
    },
  ];

  console.log("Creating users...");
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  const products = [
    {
      name: "Cesta de Palha Artesanal",
      description:
        "Linda cesta feita à mão com palha natural, perfeita para decoração e organização",
      price: 45.9,
      imageUrl: "https://images.unsplash.com/photo-1586627071161-700468c1a824",
      stockQty: 15,
      weightGrams: 200,
      organizationId: createdOrgs[0].id,
      categoryId: categoriesCreated.find((c) => c.name === "Artesanato")!.id,
    },
    {
      name: "Boneca de Pano Colorida",
      description:
        "Boneca artesanal feita com tecidos reciclados, ideal para crianças",
      price: 29.9,
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64",
      stockQty: 25,
      weightGrams: 150,
      organizationId: createdOrgs[0].id,
      categoryId: categoriesCreated.find((c) => c.name === "Artesanato")!.id,
    },
    {
      name: "Vaso de Cerâmica Pintado",
      description: "Vaso decorativo em cerâmica com pintura manual exclusiva",
      price: 68.5,
      imageUrl: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261",
      stockQty: 8,
      weightGrams: 800,
      organizationId: createdOrgs[0].id,
      categoryId: categoriesCreated.find((c) => c.name === "Decoração")!.id,
    },
    {
      name: "Cachecol de Tricô",
      description: "Cachecol quentinho feito em tricô com lã de alta qualidade",
      price: 39.9,
      imageUrl: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f",
      stockQty: 12,
      weightGrams: 180,
      organizationId: createdOrgs[0].id,
      categoryId: categoriesCreated.find((c) => c.name === "Vestuário")!.id,
    },
    {
      name: "Porta-joias de Madeira",
      description: "Elegante porta-joias em madeira com divisórias internas",
      price: 85.0,
      imageUrl: "https://images.unsplash.com/photo-1531973486364-5fa64260d75b",
      stockQty: 6,
      weightGrams: 350,
      organizationId: createdOrgs[0].id,
      categoryId: categoriesCreated.find((c) => c.name === "Decoração")!.id,
    },
    {
      name: "Geleia Orgânica de Morango",
      description:
        "Geleia artesanal feita com morangos orgânicos cultivados pela comunidade",
      price: 18.9,
      imageUrl: "https://images.unsplash.com/photo-1549888834-3ec93abae044",
      stockQty: 30,
      weightGrams: 350,
      organizationId: createdOrgs[1].id,
      categoryId: categoriesCreated.find((c) => c.name === "Alimentos")!.id,
    },
    {
      name: "Mel Puro Silvestre",
      description:
        "Mel puro extraído de colmeias sustentáveis, rico em nutrientes",
      price: 32.5,
      imageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784d38",
      stockQty: 20,
      weightGrams: 500,
      organizationId: createdOrgs[1].id,
      categoryId: categoriesCreated.find((c) => c.name === "Alimentos")!.id,
    },
    {
      name: "Brigadeiros Gourmet",
      description: "Caixa com 12 brigadeiros artesanais de sabores variados",
      price: 24.9,
      imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587",
      stockQty: 18,
      weightGrams: 240,
      organizationId: createdOrgs[1].id,
      categoryId: categoriesCreated.find((c) => c.name === "Doces")!.id,
    },
    {
      name: "Granola Caseira",
      description:
        "Granola artesanal com frutas secas e castanhas, sem conservantes",
      price: 22.8,
      imageUrl: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce",
      stockQty: 25,
      weightGrams: 300,
      organizationId: createdOrgs[1].id,
      categoryId: categoriesCreated.find((c) => c.name === "Alimentos")!.id,
    },
    {
      name: "Pão Integral Artesanal",
      description:
        "Pão integral feito com farinha orgânica e fermentação natural",
      price: 15.5,
      imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff",
      stockQty: 10,
      weightGrams: 600,
      organizationId: createdOrgs[1].id,
      categoryId: categoriesCreated.find((c) => c.name === "Alimentos")!.id,
    },
  ];

  console.log("Creating products...");
  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
