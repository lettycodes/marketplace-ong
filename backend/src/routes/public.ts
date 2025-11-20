import { Router } from "express";
import { query, param, validationResult } from "express-validator";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { AISearchService } from "../services/aiSearch";

const router = Router();

router.get("/products", async (req, res, next) => {
  try {
    const {
      page = "1",
      limit = "12",
      category,
      priceMin,
      priceMax,
      search,
      organization,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      isActive: true,
    };

    if (category) {
      where.category = {
        name: category as string,
      };
    }

    if (priceMin || priceMax) {
      where.price = {};
      if (priceMin) where.price.gte = parseFloat(priceMin as string);
      if (priceMax) where.price.lte = parseFloat(priceMax as string);
    }

    if (organization) {
      where.organization = {
        name: { contains: organization as string, mode: "insensitive" },
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          category: true,
          organization: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/products/:id", [param("id").isUUID()], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError("Invalid product ID", 400));
    }

    const product = await prisma.product.findFirst({
      where: {
        id: req.params.id,
        isActive: true,
      },
      include: {
        category: true,
        organization: {
          select: {
            id: true,
            name: true,
            description: true,
            website: true,
            phone: true,
          },
        },
      },
    });

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    res.json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/categories", async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            products: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/organizations", async (req, res, next) => {
  try {
    const organizations = await prisma.organization.findMany({
      where: {
        products: {
          some: {
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        website: true,
        _count: {
          select: {
            products: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      success: true,
      data: { organizations },
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/search",
  [query("q").trim().isLength({ min: 1, max: 200 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new AppError("Search query is required", 400));
      }

      const searchQuery = req.query.q as string;
      const { page = "1", limit = "12" } = req.query;

      const pageNum = Math.max(1, parseInt(page as string));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
      const skip = (pageNum - 1) * limitNum;

      const aiResult = await AISearchService.parseNaturalLanguageSearch(
        searchQuery
      );

      const where: any = {
        isActive: true,
      };

      if (aiResult.filters.category) {
        where.category = {
          name: aiResult.filters.category,
        };
      }

      if (aiResult.filters.priceMin || aiResult.filters.priceMax) {
        where.price = {};
        if (aiResult.filters.priceMin)
          where.price.gte = aiResult.filters.priceMin;
        if (aiResult.filters.priceMax)
          where.price.lte = aiResult.filters.priceMax;
      }

      if (aiResult.filters.organization) {
        where.organization = {
          name: {
            contains: aiResult.filters.organization,
            mode: "insensitive",
          },
        };
      }

      if (aiResult.filters.keywords && aiResult.filters.keywords.length > 0) {
        const keywordsQuery = aiResult.filters.keywords.join(" ");
        where.OR = [
          { name: { contains: keywordsQuery, mode: "insensitive" } },
          { description: { contains: keywordsQuery, mode: "insensitive" } },
        ];
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: limitNum,
          include: {
            category: true,
            organization: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.product.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      res.json({
        success: true,
        data: {
          products,
          searchInfo: {
            originalQuery: searchQuery,
            interpretation: aiResult.interpretation,
            filters: aiResult.filters,
            aiSuccess: aiResult.aiSuccess,
            fallbackUsed: aiResult.fallbackUsed,
          },
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
