const express = require("express");
let app = express();
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

var expressWs = require("express-ws")(app);
/********************************/
const { createClient } = require("@supabase/supabase-js");
const supabaseUrl = "https://yjqtpadsahfkxoiebttk.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqcXRwYWRzYWhma3hvaWVidHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjYyNTcyNTUsImV4cCI6MTk4MTgzMzI1NX0.wk6sfKMMzT-v3opgVKngcm48oZGUJxjii6pLbnEX5L8";
const supabase = createClient(supabaseUrl, supabaseKey);
/********************************/
const PORT = process.env.PORT || 3000;
/********************************/
// const fs = require('fs');
// let swear_words = [];
// fs.readFile('./archive/swear-words.txt', 'utf8', (err, data) => {
//   if (err) {
//     console.error(err);
//     return;
//   }
//   swear_words = data.split("\n");
//   // console.log(swear_words);
// });
// import moment from 'moment';
// var moment = require("moment");
var moment = require('moment-timezone');
moment().tz("America/Los_Angeles").format();
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
  // console.log("middleware");
  req.testing = "testing";
  return next();
});

app.get("/ready_server", async function (req, res, next) {
  // const { data, error } = await supabase.from("message").select();
  // console.log(data)

  var now = moment().tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss');
  //  console.log(now)

  let count = 0
  websocket.aWss.clients.forEach(v => count++)
  // console.error(error)
  return res.json({ now: now, client: count });
});

app.get("/clearcache", async function (req, res, next) {
  websocket.special = false
  websocket.chat = false
  websocket.aWss = null
  websocket.live = false
  websocket.temp = []
  websocket.temppin = null
  websocket.limit = 100
  return res.json({ success: true });
});

app.get("/avatar", async function (req, res, next) {
  return res.json({ success: true, url: websocket.url, islive: websocket.islive });
});

app.post("/url", async function (req, res, next) {
  console.log(req.body)
  websocket.url = req.body.url;
  return res.json({
    success: true, newUrl: websocket.url
  });
});
app.get("/url", async function (req, res, next) {
  return res.json({ success: true, currentUrl: websocket.url });
});
app.get("/tell", async function (req, res, next) {
  let tell_client = 0
  let msg = { method: "liveUrl", data: { success: true, url: websocket.url } }
  websocket.aWss.clients.forEach(function each(client) {
    tell_client++;
    client.send(JSON.stringify(msg));
  });
  return res.json({ success: true, url: websocket.url, tell: tell_client });
});

app.post("/islive", async function (req, res, next) {
  console.log(req.body)
  websocket.islive = req.body.islive;
  let tell_client = 0
  let msg = { method: "islive", data: { success: true, islive: websocket.islive } }
  websocket.aWss.clients.forEach(function each(client) {
    tell_client++;
    client.send(JSON.stringify(msg));
  });
  return res.json({ success: true, islive: websocket.islive, tell: tell_client });
});
app.get("/islive", async function (req, res, next) {
  return res.json({ success: true, islive: websocket.islive });
});
app.get("/tell_islive", async function (req, res, next) {
  let tell_client = 0
  let msg = { method: "islive", data: { success: true, islive: websocket.islive } }
  websocket.aWss.clients.forEach(function each(client) {
    tell_client++;
    client.send(JSON.stringify(msg));
  });
  return res.json({ success: true, islive: websocket.islive, tell: tell_client });
});


// function checkword(text) {
// console.log(text)
//   // sentences.forEach((v,i)=>{
//   let neg = 0;
//   let pos = 0;
//   // console.log(v,i)
//   let temp = text;
//   text = text.split(" ");
//   // console.log(text);
//   text.forEach((t) => {
//       swear_words.forEach((v, i) => {
//           temp = temp.replace(v, "***");
//       });
//   });

//   // console.log(temp);

//   return temp;
//   // })
// }
var Filter = require('bad-words'),
  filter = new Filter();
// swear_words.forEach((v, i) => {
//  filter.addWords(v);
// });



const websocket = {
  url: '',
  islive: false,
  ws: '',
  special: false,
  chat: false,
  aWss: null,
  live: false,
  temp: [],
  temppin: null,
  limit: 100,
  init: () => {
    websocket.aWss = expressWs.getWss("/");
    websocket.aWss.on("connection", async function (ws) {
      // console.log("ONCONNECT");
      if (websocket.temp.length == 0) {
        const { data, error } = await supabase
          .from("message")
          .select()
          .limit(websocket.limit)
          .order("id", { ascending: false });
        console.error(error)
        websocket.temp = data;
      }

      if (!websocket.temppin) {
        const { data, error } = await supabase
          .from("pin_message")
          .select()
          .eq("active", "true")
          .limit(1)
          .order("id", { ascending: false });
        console.error(error)
        websocket.temppin = data ? data[0] : {};
        websocket.temppin ? (websocket.temppin.pin = true) : {};
      }

      ws.send(JSON.stringify({ method: "temp", data: websocket.temp }));
      ws.send(JSON.stringify({ method: "temppin", data: websocket.temppin }));
      ws.send(JSON.stringify({ method: "special", data: websocket.special }));
      ws.send(JSON.stringify({ method: "chat", data: websocket.chat }));
      ws.send(JSON.stringify({ method: "live", data: websocket.live }));
      ws.send(JSON.stringify({ method: "liveUrl", data: { success: true, url: websocket.url } }));
      ws.send(JSON.stringify({ method: "islive", data: { success: true, islive: websocket.islive } }));

      //       let i =0
      //       let interval = setInterval(() => {
      //         var now = moment().tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss');
      //         if(i == 0){
      //           i++
      //           console.log(now)
      //         }

      //         if (now >= "2022-11-08 06:20:00") {
      //           websocket.live = true
      //           ws.send(JSON.stringify({ method: "live", data: { 'status': websocket.live, time: now } }));
      //           clearInterval(interval)
      //         }
      //       }, 1000)
    });
    app.ws("/", function (ws, req) {
      ws.on("message", function (msg) {
        // console.log(msg);
        switch (msg.method) {
          case "pin":
            websocket.events.pin(msg);
            break;
          case "unpin":
            websocket.events.unpin(msg);
            break;
          case "sticker":
            websocket.events.sticker(msg);
            break;
          case "special":
            websocket.events.special(msg);
            break;
          case "message":
            websocket.events.message(msg);
            break;
          case "chat":
            websocket.events.chat(msg);
            break;
          case "live":
            websocket.events.live(msg);
            break;
          case "liveUrl":
            msg = { method: "liveUrl", data: { success: true, url: websocket.url } }
            break;
        }
        websocket.aWss.clients.forEach(function each(client) {
          if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify(msg));
          }
        });
      });
      //       console.log("socket", req.testing);
    });
  },
  events: {
    pin: async (msg) => {
      try {
        msg.message = filter.clean(msg.message); //Don't be an ******
        // msg.message = checkword(msg.message)
      } catch (error) {

      }


      // checkword(msg.message)
      const { data, error } = await supabase
        .from("pin_message")
        .insert([{ user: msg.user, message: msg.message, active: true }]);
      console.error(error)
      websocket.temppin = data[0];
      websocket.temppin.pin = true;
      msg = websocket.temppin;
    },
    unpin: async (msg) => {
      const { data, error } = await supabase
        .from("pin_message")
        .update({ active: false })
        .eq("active", "true");
      console.error(error)
      websocket.temppin = { id: 0 };
    },
    sticker: async (msg) => { },
    special: async (msg) => {
      websocket.special = msg.data
    },
    chat: async (msg) => {
      websocket.chat = msg.data
    },
    live: async (msg) => {
      //       console.log(msg)
      websocket.live = msg.data
    },
    message: async (msg) => {
      //  console.log(msg)
      try {
        msg.message = filter.clean(msg.message); //Don't be an ******
        //              msg.message = checkword(msg.message)
      } catch (error) {

      }

      // checkword(msg.message)
      // console.log(msg)
      let obj = { user: msg.user, message: msg.message, image: msg.image, unique: msg.unique };
      const { data, error } = await supabase.from("message").insert([obj]);
      if (!error) {
        if (websocket.temp.length >= websocket.limit) {
          // websocket.temp.splice(0, 1);
          websocket.temp.pop();
        }
        // console.log(data)
        websocket.temp = [data[0], ...websocket.temp];
        // data[0].concat(websocket.temp)
        // websocket.temp.push(data[0]);
        msg = data[0];
      } else {
        console.error(error);
      }
    },
  },
};


app.listen(PORT, () => console.log(`Listening on ${PORT}`));

let app2 = express();
app2.use(express.urlencoded({ extended: true }))
app2.use(express.json())

var expressWs = require("express-ws")(app2);

const PORT2 = process.env.PORT2 || 5555;
app2.listen(PORT2, () => console.log(`Listening on ${PORT2}`));

module.exports = { app, app2 };
// module.exports = app2;