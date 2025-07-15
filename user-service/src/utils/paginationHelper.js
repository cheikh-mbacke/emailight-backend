// ============================================================================
// 📁 src/utils/paginationHelper.js - Helper de pagination réutilisable
// ============================================================================

/**
 * 🔧 Helper de pagination pour standardiser la pagination dans tous les services
 */
class PaginationHelper {
  /**
   * Valide et normalise les paramètres de pagination
   */
  static validatePaginationParams(params = {}) {
    const {
      page = 1,
      limit = 20,
      offset,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    // Validation de la page
    const validatedPage = Math.max(1, parseInt(page) || 1);

    // Validation de la limite
    const maxLimit = 100; // Limite maximale pour éviter les surcharges
    const validatedLimit = Math.min(
      maxLimit,
      Math.max(1, parseInt(limit) || 20)
    );

    // Calcul de l'offset
    const calculatedOffset = offset
      ? parseInt(offset)
      : (validatedPage - 1) * validatedLimit;

    // Validation du tri
    const validSortOrders = ["asc", "desc", "1", "-1"];
    const validatedSortOrder = validSortOrders.includes(sortOrder.toString())
      ? sortOrder
      : "desc";

    return {
      page: validatedPage,
      limit: validatedLimit,
      offset: Math.max(0, calculatedOffset),
      sortBy,
      sortOrder: validatedSortOrder,
    };
  }

  /**
   * Construit l'objet de tri MongoDB
   */
  static buildSortObject(sortBy, sortOrder) {
    const sort = {};
    const order = sortOrder === "desc" || sortOrder === "-1" ? -1 : 1;
    sort[sortBy] = order;
    return sort;
  }

  /**
   * Construit les métadonnées de pagination
   */
  static buildPaginationMetadata(total, page, limit, offset) {
    const totalPages = Math.ceil(total / limit);
    const currentPage = page;
    const hasNext = currentPage < totalPages;
    const hasPrev = currentPage > 1;
    const nextPage = hasNext ? currentPage + 1 : null;
    const prevPage = hasPrev ? currentPage - 1 : null;

    return {
      page: currentPage,
      limit,
      offset,
      total,
      totalPages,
      hasNext,
      hasPrev,
      nextPage,
      prevPage,
      // Informations sur les résultats actuels
      startIndex: offset + 1,
      endIndex: Math.min(offset + limit, total),
      // Informations sur les résultats
      showing: Math.min(limit, total - offset),
      of: total,
    };
  }

  /**
   * Construit les liens de pagination (pour API REST)
   */
  static buildPaginationLinks(baseUrl, pagination, queryParams = {}) {
    const { page, totalPages, hasNext, hasPrev, nextPage, prevPage } =
      pagination;

    const links = {
      self: this.buildUrl(baseUrl, page, queryParams),
      first: this.buildUrl(baseUrl, 1, queryParams),
      last: this.buildUrl(baseUrl, totalPages, queryParams),
    };

    if (hasPrev) {
      links.prev = this.buildUrl(baseUrl, prevPage, queryParams);
    }

    if (hasNext) {
      links.next = this.buildUrl(baseUrl, nextPage, queryParams);
    }

    return links;
  }

  /**
   * Construit une URL avec les paramètres de pagination
   */
  static buildUrl(baseUrl, page, queryParams = {}) {
    const url = new URL(baseUrl, "http://localhost");

    // Ajouter les paramètres de pagination
    url.searchParams.set("page", page.toString());

    // Ajouter les autres paramètres de requête
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== "page") {
        url.searchParams.set(key, value.toString());
      }
    });

    return url.pathname + url.search;
  }

  /**
   * Applique la pagination à une requête MongoDB
   */
  static applyPaginationToQuery(query, paginationParams) {
    const { limit, offset, sortBy, sortOrder } = paginationParams;

    return query
      .skip(offset)
      .limit(limit)
      .sort(this.buildSortObject(sortBy, sortOrder));
  }

  /**
   * Construit la réponse paginée standardisée
   */
  static buildPaginatedResponse(data, total, paginationParams, options = {}) {
    const { page, limit, offset } = paginationParams;
    const { baseUrl, queryParams, includeLinks = true } = options;

    const pagination = this.buildPaginationMetadata(total, page, limit, offset);

    const response = {
      data,
      pagination,
      meta: {
        timestamp: new Date(),
        totalResults: total,
        resultsPerPage: limit,
        currentPage: page,
      },
    };

    // Ajouter les liens si demandé et si baseUrl fourni
    if (includeLinks && baseUrl) {
      response.links = this.buildPaginationLinks(
        baseUrl,
        pagination,
        queryParams
      );
    }

    return response;
  }

  /**
   * Valide les paramètres de filtrage
   */
  static validateFilterParams(params = {}, allowedFilters = []) {
    const validatedFilters = {};

    Object.entries(params).forEach(([key, value]) => {
      if (
        allowedFilters.includes(key) &&
        value !== undefined &&
        value !== null
      ) {
        validatedFilters[key] = value;
      }
    });

    return validatedFilters;
  }

  /**
   * Construit une requête de recherche avec filtres
   */
  static buildSearchQuery(filters = {}, searchFields = []) {
    const query = {};

    // Filtres de base
    Object.entries(filters).forEach(([key, value]) => {
      if (key !== "query" && value !== undefined && value !== null) {
        query[key] = value;
      }
    });

    // Recherche textuelle
    if (filters.query && searchFields.length > 0) {
      const searchConditions = searchFields.map((field) => ({
        [field]: { $regex: filters.query, $options: "i" },
      }));
      query.$or = searchConditions;
    }

    return query;
  }

  /**
   * Calcule les statistiques de pagination
   */
  static calculatePaginationStats(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    return {
      totalItems: total,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
      startItem: total > 0 ? startItem : 0,
      endItem,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}

export default PaginationHelper;
