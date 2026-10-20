import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import proxyaddr from "proxy-addr";
import { pool } from "./config/db.js";
import authRoutes from "./modules/auth/auth.routes.js";
import profileRoutes from "./modules/profiles/profile.routes.js";
import playerRoutes from "./modules/profiles/player.routes.js";
import gameRoutes from "./modules/games/game.routes.js";
import gameReviewRoutes from "./modules/reviews/game-review.routes.js";
import reviewRoutes from "./modules/reviews/review.routes.js";
import homeRoutes from "./modules/home/home.routes.js";
import favoriteRoutes from "./modules/favorites/favorite.routes.js";
import rankingRoutes from "./modules/rankings/ranking.routes.js";
import gameStatusRoutes from "./modules/game-statuses/game-status.routes.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const trustedProxyCidrs = (process.env.TRUSTED_PROXY_CIDRS || "172.23.0.0/16")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const isTrustedProductionProxy = proxyaddr.compile(trustedProxyCidrs);

app.set(
  "trust proxy",
  process.env.NODE_ENV === "production" ? isTrustedProductionProxy : false,
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:4173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "PlayLog API is running" });
});
if (process.env.NODE_ENV !== "production") {
  app.get("/api/db-test", async (_req, res) => {
    try {
      const result = await pool.query<{ database: string }>(
        "SELECT current_database() AS database",
      );
      res.json({ status: "ok", database: result.rows[0]?.database });
    } catch (error) {
      console.error("Database connection failed", error);
      res
        .status(500)
        .json({ status: "error", message: "Database connection failed" });
    }
  });
}

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/games", gameReviewRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/rankings", rankingRoutes);
app.use("/api/status", gameStatusRoutes);

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (
      error instanceof SyntaxError &&
      "status" in error &&
      error.status === 400
    ) {
      res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: "Request body 必須是有效的 JSON",
      });
      return;
    }
    next(error);
  },
);

app.listen(PORT, () => {
  console.log(`PlayLog API running at http://localhost:${PORT}`);
});
