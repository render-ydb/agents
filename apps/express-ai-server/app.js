require("dotenv").config();

const express = require("express");
const cors = require("cors");
const logger = require("morgan");
const cookieParser = require("cookie-parser");

const chatRouter = require("./routes/chat");
const suggestionsRouter = require("./routes/suggestions");

const app = express();

// CORS - 允许前端跨域请求
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(logger("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

// 路由
app.use("/api/chat", chatRouter);
app.use("/api/suggestions", suggestionsRouter);

// 健康检查
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: req.app.get("env") === "development" ? err.message : "Internal Server Error",
  });
});

module.exports = app;
