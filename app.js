// const moment = require('moment-timezone');
// moment.tz.setDefault("Asia/Bangkok");
const PORT = process.env.PORT || 3000;
/********************************/
const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
/********************************/
const { createServer } = require("http");
const httpServer = createServer(app);
/********************************/
const io = require("./models/socket")(httpServer);
exports.io = io

/********************************/
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,PATCH,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With"
  );
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Last-Modified", new Date());
  res.header("Date", new Date());
  next();
});

app.use(function (req, res, next) {
  req.middleware = "middleware";
  return next();
});

const web = require('./routes/web');
app.use('/web', web);

const service = require('./routes/service');
app.use('/service', service);

function calculates(game) {
  game.sum = 0
  game.answer.forEach((v, i) => {
    v.score.total = v.score.default + v.score.vote
    game.sum += v.score.total
  });
  game.answer.forEach((v, i) => {
    v.score.percent = Math.round((v.score.total / game.sum) * 100).toFixed(0)
    v.score.percent2digit = ((v.score.total / game.sum) * 100).toFixed(2)
  });
}
exports.calculates = calculates

httpServer.listen(PORT, () => {
  const { game } = require("./define");
  game.data.lists.forEach(v => {
    calculates(v)
  });
  console.log(`Listening on ${PORT}`)
});