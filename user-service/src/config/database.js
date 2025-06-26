const mongoose = require("mongoose");
const config = require("./env");

/**
 * Mongoose Configuration Options
 */
const mongooseOptions = {
  // Use new connection string parser
  useNewUrlParser: true,
  useUnifiedTopology: true,

  // Performance and timeout settings
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,

  // Optimization settings
  bufferMaxEntries: 0,
  bufferCommands: false,

  // Application name for monitoring purposes
  appName: "emailight-user-service",
};

// Default logger (fallback to console if no external logger is provided)
let logger = {
  db: (msg, data) => console.log(`🗃️ [BD] ${msg}`, data || ""),
  success: (msg, data) => console.log(`✅ [BD] ${msg}`, data || ""),
  error: (msg, error) => console.error(`❌ [BD] ${msg}`, error || ""),
  warn: (msg, data) => console.warn(`⚠️ [BD] ${msg}`, data || ""),
  debug: (msg, data) => console.log(`🔍 [BD] ${msg}`, data || ""),
  info: (msg, data) => console.log(`📡 [BD] ${msg}`, data || ""),
};

/**
 * Allows injecting an external logger
 */
const setLogger = (externalLogger) => {
  logger = externalLogger;
};

/**
 * Establish a connection to MongoDB
 */
const connectDB = async () => {
  try {
    logger.db("Connexion à MongoDB en cours...", {
      uri: config.MONGODB_URI.replace(/\/\/.*@/, "//***:***@"),
      options: {
        maxPoolSize: mongooseOptions.maxPoolSize,
        serverSelectionTimeoutMS: mongooseOptions.serverSelectionTimeoutMS,
      },
    });

    const conn = await mongoose.connect(config.MONGODB_URI, mongooseOptions);

    const connectionInfo = {
      database: conn.connection.db.databaseName,
      host: conn.connection.host,
      port: conn.connection.port,
      readyState: conn.connection.readyState,
    };

    logger.success("Connexion à MongoDB réussie", connectionInfo, {
      action: "database_connect",
    });

    return conn;
  } catch (error) {
    const errorContext = {
      action: "database_connect_failed",
      mongodb_uri: config.MONGODB_URI.replace(/\/\/.*@/, "//***:***@"),
      environment: config.NODE_ENV,
      error_code: error.code,
      error_name: error.name,
    };

    logger.error("Erreur de connexion à MongoDB", error, errorContext);

    if (config.NODE_ENV === "development") {
      logger.debug("Conseils de débogage MongoDB", {
        checks: [
          "Le conteneur 'emailight-mongodb' est-il en cours d’exécution ?",
          "Les identifiants sont-ils corrects ?",
          "Le réseau Docker est-il accessible ?",
          "Test : docker exec emailight-mongodb mongosh --eval \"db.adminCommand('ping')\"",
        ],
        error_details: {
          message: error.message,
          stack: error.stack?.split("\n").slice(0, 5),
        },
      });
    }

    throw new Error("Impossible de se connecter à la base de données");
  }
};

/**
 * Cleanly disconnect from MongoDB
 */
const disconnectDB = async () => {
  try {
    const connectionState = getConnectionStatus();

    if (connectionState.state !== "disconnected") {
      await mongoose.connection.close();
      logger.success("Connexion MongoDB fermée proprement", connectionState, {
        action: "database_disconnect",
      });
    } else {
      logger.debug("MongoDB déjà déconnecté", connectionState);
    }
  } catch (error) {
    logger.error("Erreur lors de la déconnexion de MongoDB", error, {
      action: "database_disconnect_failed",
    });
  }
};

/**
 * Setup Mongoose event handlers for connection lifecycle
 */
const setupConnectionEvents = () => {
  mongoose.connection.on("connected", () => {
    logger.db(
      "Mongoose connecté à MongoDB",
      {
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        database: mongoose.connection.name,
      },
      { action: "mongoose_connected" }
    );
  });

  mongoose.connection.on("error", (err) => {
    logger.error("Erreur de connexion Mongoose", err, {
      action: "mongoose_connection_error",
      connection_state: getConnectionStatus().state,
    });
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn(
      "Mongoose déconnecté de MongoDB",
      {
        previous_state: "connected",
        timestamp: new Date().toISOString(),
      },
      { action: "mongoose_disconnected" }
    );
  });

  mongoose.connection.on("reconnected", () => {
    logger.success("Mongoose reconnecté à MongoDB", getConnectionStatus(), {
      action: "mongoose_reconnected",
    });
  });

  mongoose.connection.on("reconnectFailed", () => {
    logger.error(
      "Échec de la reconnexion MongoDB",
      {
        attempts: "all_failed",
        connection_state: getConnectionStatus().state,
      },
      { action: "mongoose_reconnect_failed" }
    );
  });
};

/**
 * Returns current connection status
 */
const getConnectionStatus = () => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return {
    state: states[mongoose.connection.readyState] || "unknown",
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
    readyState: mongoose.connection.readyState,
  };
};

/**
 * MongoDB Health Check (ping)
 */
const healthCheck = async () => {
  try {
    const startTime = Date.now();
    await mongoose.connection.db.admin().ping();
    const responseTime = Date.now() - startTime;

    const healthData = {
      status: "healthy",
      message: "Base de données accessible",
      responseTime: `${responseTime}ms`,
      ...getConnectionStatus(),
    };

    if (responseTime > 1000) {
      logger.warn(
        "Temps de réponse lent de MongoDB",
        {
          responseTime: `${responseTime}ms`,
          threshold: "1000ms",
        },
        { action: "database_slow_response" }
      );
    }

    return healthData;
  } catch (error) {
    const healthData = {
      status: "unhealthy",
      message: error.message,
      error: error.name,
      ...getConnectionStatus(),
    };

    logger.error("Échec du test de santé MongoDB", error, {
      action: "database_health_check_failed",
      connection_state: getConnectionStatus().state,
    });

    return healthData;
  }
};

/**
 * Retrieve MongoDB performance metrics
 */
const getPerformanceMetrics = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return { available: false, reason: "Base de données non connectée" };
    }

    const stats = await mongoose.connection.db.stats();

    return {
      available: true,
      collections: stats.collections,
      dataSize: `${Math.round(stats.dataSize / 1024 / 1024)}MB`,
      storageSize: `${Math.round(stats.storageSize / 1024 / 1024)}MB`,
      indexes: stats.indexes,
      objects: stats.objects,
      avgObjSize: `${Math.round(stats.avgObjSize)}bytes`,
    };
  } catch (error) {
    logger.error(
      "Erreur lors de la récupération des métriques MongoDB",
      error,
      {
        action: "database_metrics_failed",
      }
    );

    return {
      available: false,
      reason: error.message,
    };
  }
};

/**
 * Utility: Log slow Mongoose queries (development only)
 */
const logSlowQueries = () => {
  mongoose.set("debug", (collectionName, method, query, doc) => {
    const startTime = Date.now();

    if (
      config.NODE_ENV === "development" ||
      process.env.VERBOSE_LOGS === "true"
    ) {
      logger.debug(
        "Requête Mongoose",
        {
          collection: collectionName,
          method,
          query: JSON.stringify(query).substring(0, 200),
          executionTime: `${Date.now() - startTime}ms`,
        },
        { action: "mongoose_query" }
      );
    }
  });
};

// Automatically configure event listeners on import
setupConnectionEvents();

// Enable slow query logging in development
if (config.NODE_ENV === "development") {
  logSlowQueries();
}

// Export public functions
module.exports = {
  connectDB,
  disconnectDB,
  getConnectionStatus,
  healthCheck,
  getPerformanceMetrics,
  setLogger,
};
