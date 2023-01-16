const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const app = express();
const server = http.createServer(app);
const port = 4000;
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");

const session = require("express-session");
const cookieParser = require("cookie-parser");

const model = require("./model/core");
const Model = new model();
// const UserModel = require("./model/user/userModel");

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: "THISSECRET",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "_" + Date.now() + ".png");
  },
});
const upload = multer({ storage });

app.use((req, res, next) => {
  const { loginUser } = req.session;

  const path_array = req.path.split("/");
  const req_name = path_array[path_array.length - 1];
  const 로그인필요없는요청 = ["login", "logout", "join"];

  // if (로그인필요없는요청.includes(req_name) === false && empty(loginUser)) {
  //   res.status(401).send("");
  //   return;
  // }

  next();
});

// ===================================== 소켓 =================================

const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

const socketDB = {
  room: {},
};

io.on("connection", (socket) => {
  const socket_id = socket.id;

  console.log("소켓서버시작", socket_id);

  socket.on("disconnect", () => {
    delete socketDB.room[socket_id];
    console.log("소켓서버종료");
  });
});

// ===================================== 소켓 =================================

app.get("/", (req, res) => {
  res.send({
    name: "성민",
    age: 30,
  });
});

app.get("/login", (req, res) => {
  res.send({
    name: "성민",
    age: 30,
  });
});

app.post("/login", (req, res) => {
  const body = req.body;

  console.log(body);

  res.send({
    name: "성민",
    age: 30,
  });
});

server.listen(port, () => {
  const dir = "./uploads";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});

function get_now_date() {
  const today = new Date();

  const year = today.getFullYear();
  const month = ("0" + (today.getMonth() + 1)).slice(-2);
  const day = ("0" + today.getDate()).slice(-2);

  const hour = today.getHours();
  const min = today.getMinutes();
  const sec = today.getSeconds();

  const dateString = `${year}-${month}-${day} ${hour}:${min}:${sec}`;

  return dateString;
}

function timeForToday(value) {
  const today = new Date();
  const timeValue = new Date(value);

  const betweenTime = Math.floor(
    (today.getTime() - timeValue.getTime()) / 1000 / 60
  );
  if (betweenTime < 1) return "방금전";
  if (betweenTime < 60) {
    return `${betweenTime}분전`;
  }

  const betweenTimeHour = Math.floor(betweenTime / 60);
  if (betweenTimeHour < 24) {
    return `${betweenTimeHour}시간전`;
  }

  const betweenTimeDay = Math.floor(betweenTime / 60 / 24);
  if (betweenTimeDay < 365) {
    return `${betweenTimeDay}일전`;
  }

  return `${Math.floor(betweenTimeDay / 365)}년전`;
}

// 넘어온 값이 빈값인지 체크합니다.
// !value 하면 생기는 논리적 오류를 제거하기 위해
// 명시적으로 value == 사용
// [], {} 도 빈값으로 처리
var empty = function (value) {
  if (
    value == "" ||
    value == null ||
    value == undefined ||
    (value != null && typeof value == "object" && !Object.keys(value).length)
  ) {
    return true;
  } else {
    return false;
  }
};

function replaceAllObject(obj, replace, str) {
  let res = {};

  for (let key in obj) {
    const x = obj[key];
    const r = x.replaceAll(replace, str);
    res[key] = r;
  }

  return res;
}
