import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  await prisma.order.deleteMany()
  await prisma.product.deleteMany() 
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()

  console.log('🗑️ Dados existentes removidos')

  const org1 = await prisma.organization.create({
    data: {
      name: 'EcoLife Brasil',
      email: 'contato@ecolife.org',
      description: 'Organização focada em sustentabilidade e meio ambiente'
    }
  })

  const org2 = await prisma.organization.create({
    data: {
      name: 'Artesanato Social',
      email: 'contato@artesanato.org',
      description: 'Cooperativa de artesãos locais'
    }
  })

  const org3 = await prisma.organization.create({
    data: {
      name: 'Verde Vida',
      email: 'contato@verdevida.org',
      description: 'Produtos orgânicos e sustentáveis'
    }
  })

  console.log('✅ Organizações criadas')

  const hashedPassword = await bcrypt.hash('123456', 10)

  const admin1 = await prisma.user.create({
    data: {
      name: 'Maria Silva',
      email: 'maria@ecolife.org',
      passwordHash: hashedPassword,
      organizationId: org1.id,
      isAdmin: true
    }
  })

  const admin2 = await prisma.user.create({
    data: {
      name: 'João Santos',
      email: 'joao@artesanato.org',
      passwordHash: hashedPassword,
      organizationId: org2.id,
      isAdmin: true
    }
  })

  const user1 = await prisma.user.create({
    data: {
      name: 'Ana Costa',
      email: 'ana@email.com',
      passwordHash: hashedPassword,
      organizationId: org3.id,
      isAdmin: false
    }
  })

  const consumer = await prisma.user.create({
    data: {
      name: 'Pedro Oliveira',
      email: 'pedro@email.com', 
      passwordHash: hashedPassword,
      isAdmin: false
    }
  })

  console.log('✅ Usuários criados')

  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Produtos Sustentáveis'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Artesanato'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Alimentos Orgânicos'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Vestuário Sustentável'
      }
    })
  ])

  console.log('✅ Categorias criadas')

  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Ecobag Reutilizável',
        description: 'Bolsa ecológica feita de material reciclado, perfeita para compras sustentáveis.',
        price: 25.90,
        stockQty: 100,
        weightGrams: 200,
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
        organizationId: org1.id,
        categoryId: categories[0].id,
        isActive: true
      }
    }),
    prisma.product.create({
      data: {
        name: 'Canudo de Bambu Kit',
        description: 'Kit com 4 canudos de bambu reutilizáveis, com escovinha para limpeza.',
        price: 18.50,
        stockQty: 75,
        weightGrams: 50,
        imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb889?w=400',
        organizationId: org1.id,
        categoryId: categories[0].id,
        isActive: true
      }
    }),
    prisma.product.create({
      data: {
        name: 'Sabonete Natural Lavanda',
        description: 'Sabonete artesanal com ingredientes naturais e óleo essencial de lavanda.',
        price: 12.90,
        stockQty: 150,
        weightGrams: 80,
        imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
        organizationId: org1.id,
        categoryId: categories[0].id,
        isActive: true
      }
    }),

    prisma.product.create({
      data: {
        name: 'Cesta de Palha Artesanal',
        description: 'Cesta feita à mão com palha natural, ideal para decoração ou organização.',
        price: 45.00,
        stockQty: 30,
        weightGrams: 350,
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        organizationId: org2.id,
        categoryId: categories[1].id,
        isActive: true
      }
    }),
    prisma.product.create({
      data: {
        name: 'Almofada Bordada à Mão',
        description: 'Almofada com bordado tradicional feito por artesãs locais.',
        price: 65.00,
        stockQty: 25,
        weightGrams: 300,
        imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
        organizationId: org2.id,
        categoryId: categories[1].id,
        isActive: true
      }
    }),
    prisma.product.create({
      data: {
        name: 'Vaso de Cerâmica Pintado',
        description: 'Vaso decorativo de cerâmica com pintura artística exclusiva.',
        price: 89.90,
        stockQty: 15,
        weightGrams: 800,
        imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400',
        organizationId: org2.id,
        categoryId: categories[1].id,
        isActive: true
      }
    }),

    prisma.product.create({
      data: {
        name: 'Mel Orgânico Multifloral',
        description: 'Mel puro e orgânico de flores silvestres, 500g.',
        price: 35.00,
        stockQty: 60,
        weightGrams: 500,
        imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400',
        organizationId: org3.id,
        categoryId: categories[2].id,
        isActive: true
      }
    }),
    prisma.product.create({
      data: {
        name: 'Granola Caseira Orgânica',
        description: 'Granola artesanal com ingredientes orgânicos selecionados, 300g.',
        price: 28.90,
        stockQty: 80,
        weightGrams: 300,
        imageUrl: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400',
        organizationId: org3.id,
        categoryId: categories[2].id,
        isActive: true
      }
    }),
    prisma.product.create({
      data: {
        name: 'Camiseta Algodão Orgânico',
        description: 'Camiseta unissex de algodão 100% orgânico, tingimento natural.',
        price: 55.00,
        stockQty: 40,
        weightGrams: 180,
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
        organizationId: org3.id,
        categoryId: categories[3].id,
        isActive: true
      }
    }),
    prisma.product.create({
      data: {
        name: 'Óleo Essencial Eucalipto',
        description: 'Óleo essencial puro de eucalipto, 10ml, ideal para aromaterapia.',
        price: 22.50,
        stockQty: 90,
        weightGrams: 30,
        imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400',
        organizationId: org3.id,
        categoryId: categories[0].id,
        isActive: true
      }
    })
  ])

  console.log('✅ Produtos criados')

  const order1 = await prisma.order.create({
    data: {
      userId: consumer.id,
      organizationId: org1.id,
      customerName: 'Pedro Oliveira',
      customerEmail: 'pedro@email.com',
      totalAmount: 57.30,
      status: 'DELIVERED',
      orderItems: {
        create: [
          {
            productId: products[0].id, 
            quantity: 2,
            price: 25.90
          },
          {
            productId: products[2].id, 
            quantity: 1,
            price: 12.90
          }
        ]
      }
    },
    include: {
      orderItems: true
    }
  })

  const order2 = await prisma.order.create({
    data: {
      userId: consumer.id,
      organizationId: org2.id,
      customerName: 'Pedro Oliveira',
      customerEmail: 'pedro@email.com',
      totalAmount: 110.00,
      status: 'PENDING',
      orderItems: {
        create: [
          {
            productId: products[3].id, 
            quantity: 1,
            price: 45.00
          },
          {
            productId: products[4].id, 
            quantity: 1,
            price: 65.00
          }
        ]
      }
    },
    include: {
      orderItems: true
    }
  })

  console.log('✅ Pedidos criados')

  console.log(`
🎉 Seed concluído com sucesso!

📊 Resumo dos dados criados:
   • ${3} organizações
   • ${4} usuários (3 admins + 1 consumidor)
   • ${4} categorias  
   • ${10} produtos
   • ${2} pedidos

👥 Usuários para teste:
   Admin EcoLife: maria@ecolife.org / 123456
   Admin Artesanato: joao@artesanato.org / 123456
   Admin Verde Vida: ana@email.com / 123456
   Consumidor: pedro@email.com / 123456

🌐 Acesse: http://localhost:3000
  `)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Erro durante o seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })