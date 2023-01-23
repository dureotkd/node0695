const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const port = 4000;
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');

const session = require('express-session');
const cookieParser = require('cookie-parser');

const ip = require('ip');

const model = require('./model/core');
const Model = new model();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: 'THISSECRET',
    resave: false,
    saveUninitialized: true,
  }),
);
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '_' + Date.now() + '.png');
  },
});
const upload = multer({ storage });

const testUserSeq = 1;

app.use(async (req, res, next) => {
  req.session.loginUser = {
    seq: 1,
    sex: 'man',
  };

  if (testUserSeq) {
    const testUser = await Model.excute({
      sql: `SELECT * FROM user WHERE seq = ${testUserSeq}`,
      type: 'row',
    });

    req.session.loginUser = testUser;
  }

  const { loginUser } = req.session;

  const path_array = req.path.split('/');
  const req_name = path_array[path_array.length - 1];
  const 로그인필요없는요청 = ['login', 'logout', 'join'];

  // if (로그인필요없는요청.includes(req_name) === false && empty(loginUser)) {
  //   res.status(401).send("");
  //   return;
  // }

  next();
});

// ===================================== 소켓 =================================

const io = socketIo(server, {
  cors: {
    origin: '*',
  },
});

const socketDB = {
  room: {},
};

io.on('connection', (socket) => {
  const socket_id = socket.id;

  console.log('소켓서버시작', socket_id);

  socket.on('disconnect', () => {
    delete socketDB.room[socket_id];
    console.log('소켓서버종료');
  });
});

// ===================================== 소켓 =================================

app.get('/', (req, res) => {
  res.send({
    name: '성민',
    age: 30,
  });
});

app.post('/login', async (req, res) => {
  res.send(req.session);
});

app.post('/join', async (req, res) => {
  const UserModel = require('./model/user/userModel');
  const { phoneNumber, nickname, age, sex, local, charm, interest } = req.body;

  const lastInsertSeq = await UserModel.insert({
    phoneNumber,
    nickname,
    age,
    sex,
    local,
    charm,
    interest,
  });

  req.body.seq = lastInsertSeq;
  req.session.loginUser = req.body;
  req.session.save();

  res.send(req.session.loginUser);
});

app.get('/charm', async (req, res) => {
  const charmList = await Model.excute({
    sql: 'SELECT * FROM charm',
    type: 'all',
  });
  const charmListData = charmList.map((item) => {
    item.check = false;
    item.value = item.seq;
    return item;
  });

  res.send(charmListData);
});

app.get('/interest', async (req, res) => {
  const interestList = await Model.excute({
    sql: 'SELECT * FROM interest',
    type: 'all',
  });

  const interestListData = interestList.map((item) => {
    item.check = false;
    item.value = item.seq;
    return item;
  });

  res.send(interestListData);
});

app.get('/sms/cert', async (req, res) => {
  const { certNumber = '', inputInfo = '' } = req.query;

  const result = {
    code: 'success',
    message: '',
  };

  const nowIp = ip.address();

  const WHERE = [
    `type = 'sms'`,
    `ip = '${nowIp}'`,
    `info= '${inputInfo}'`,
    `number = '${certNumber}'`,
  ];

  const sql = `
  SELECT 
    COUNT(*) as cnt 
  FROM 
    cert 
  WHERE 
    ${WHERE.join(' AND ')} 
  ORDER BY regDate DESC 
  LIMIT 1`;

  const { cnt } = await Model.excute({
    sql: sql,
    type: 'row',
  });

  if (cnt === 0) {
    result.code = 'fail';
    result.message = '인증번호가 다릅니다';
  }

  res.send(result);
});

app.get('/matching', async (req, res) => {
  const { loginUser } = req.session;

  const 현재매칭중인회원들쿼리 = `
  SELECT 
    * ,
    a.seq AS matchingSeq
  FROM 
    matching a , user b
  WHERE 
  ${[
    'a.userSeq = b.seq',
    "state = 'W'",
    `a.userSeq != ${loginUser.seq}`,
    `b.sex != '${loginUser.sex}'`,
  ].join(' AND ')} 
  ORDER BY 
    a.regDate ASC`;

  const 현재매칭중인회원 = await Model.excute({
    sql: 현재매칭중인회원들쿼리,
    type: 'all',
  });

  res.send(현재매칭중인회원);
});

app.post('/sms/cert', async (req, res) => {
  let { phoneNumber } = req.body;

  const CertModel = require('./model/cert/certModel');

  const result = {
    code: 'success',
    message: '',
  };

  const certNumber = get_random_number(4);
  const nowDate = get_now_date();
  const nowIp = ip.address();

  if (!phoneNumber) {
    result.code = 'fail';
    result.message = '에러~';

    res.send(result);
    return;
  }

  await sendSms({
    from: '01056539944',
    content: `인증번호 ${certNumber}`,
    messages: [
      {
        to: phoneNumber,
      },
    ],
  });

  await CertModel.insert({
    type: 'sms',
    info: phoneNumber,
    number: certNumber,
    regDate: nowDate,
    ip: nowIp,
  });

  res.send(result);
});

// 0795059010868
app.post('/email/cert', async (req, res) => {
  const { email } = req.body;

  const CertModel = require('./model/cert/certModel');

  const nowDate = get_now_date();
  const nowIp = ip.address();
  const certNumber = get_random_number(4);

  for (let data of [email]) {
    await CertModel.insert({
      type: 'mail',
      info: data,
      number: certNumber,
      regDate: nowDate,
      ip: nowIp,
    });
  }

  await sendMail({
    to: [`${email}@narasarang.or.kr`],
    subject: '군개팅 - [군인을 위한 소개팅] 인증번호입니다',
    text: `인증번호 ${certNumber}`,
  });

  res.send({
    code: 'success',
  });
});

app.get('/email/cert', async (req, res) => {
  const { certNumber = '', inputInfo = '' } = req.query;

  const result = {
    code: 'success',
    message: '',
  };

  const nowIp = ip.address();

  const WHERE = [
    `type = 'mail'`,
    `ip = '${nowIp}'`,
    `info= '${inputInfo}'`,
    `number = '${certNumber}'`,
  ];

  const sql = `
  SELECT 
    COUNT(*) as cnt 
  FROM 
    cert 
  WHERE 
    ${WHERE.join(' AND ')} 
  ORDER BY regDate DESC 
  LIMIT 1`;

  const { cnt } = await Model.excute({
    sql: sql,
    type: 'row',
  });

  if (cnt === 0) {
    result.code = 'fail';
    result.message = '인증번호가 다릅니다';
  }

  res.send(result);
});

server.listen(port, () => {
  const dir = './uploads';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});

// 0795059010868
async function sendMail({ to, subject, text }) {
  const nodemailer = require('nodemailer');
  const mailAddress = 'dureotkd123@naver.com';
  const mailPassword = '@sungmin671201@';
  //#1. Transporter 객체 생성
  let transporter = nodemailer.createTransport({
    host: 'smtp.naver.com',
    secure: true, //다른 포트를 사용해야 되면 false값을 주어야 합니다.
    port: 465, //다른 포트를 사용시 여기에 해당 값을 주어야 합니다.
    auth: {
      user: mailAddress,
      pass: mailPassword,
    },
  });

  const resTo = to.join(',');

  //#3. 메일 전송, 결과는 info 변수에 담아 집니다.
  let info = await transporter.sendMail({
    from: `"군개팅" <dureotkd123@naver.com>`,
    to: resTo,
    // to: "받는사람1@주소.com, 받는사람2@주소.com",
    // cc: "참조1@주소.com, 참조2@주소.com",
    // bcc: "숨은참조1@주소.com, 숨은참조2@주소.com",
    subject: subject,
    text: text, //텍스트로 보냅니다.
    //html:'<div>HTML형식으로 보낼 때 사용됩니다.</div>',  //html은 가렸습니다.
  });

  //#4. 전송 후 결과 단순 출력
  for (let key in info) {
    console.log('키 : ' + key + ', 값 : ' + info[key]);
  }
}

/**
 *
 * Naver SMS API
 */
async function sendSms(options) {
  const axios = require('axios');
  const CryptoJS = require('crypto-js');

  const date = Date.now().toString();
  const SERVICE_ID = 'ncp:sms:kr:260593297699:military-garting';
  const SECRET_KEY = 'BaTdpzYpdkZ9AQO2puRQFl4cp5S6uFaaSAlrKDde';
  const ACCESS_KEY = 'Cs1Oz7GhrZdTTb6Jq63O';

  const method = 'POST';
  const space = ' ';
  const newLine = '\n';
  const url2 = `/sms/v2/services/${SERVICE_ID}/messages`;

  const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, SECRET_KEY);
  hmac.update(method);
  hmac.update(space);
  hmac.update(url2);
  hmac.update(newLine);
  hmac.update(date);
  hmac.update(newLine);
  hmac.update(ACCESS_KEY);
  const hash = hmac.finalize();
  const SIGNATURE = hash.toString(CryptoJS.enc.Base64);

  await axios
    .post(
      `https://sens.apigw.ntruss.com/sms/v2/services/${SERVICE_ID}/messages`,
      {
        type: 'SMS',
        countryCode: '82',
        ...options,
      },
      {
        headers: {
          'Contenc-type': 'application/json; charset=utf-8',
          'x-ncp-iam-access-key': ACCESS_KEY,
          'x-ncp-apigw-timestamp': date,
          'x-ncp-apigw-signature-v2': SIGNATURE,
        },
      },
    )
    .then((res) => {})
    .catch((err) => {
      console.log(err);
    });
}

function get_random_number(max) {
  let a = [];

  for (let i = 0; i < max; i++) {
    const c = parseInt(Math.random() * 9);
    a.push(c);
  }

  return a.join('');
}

function get_now_date() {
  const today = new Date();

  const year = today.getFullYear();
  const month = ('0' + (today.getMonth() + 1)).slice(-2);
  const day = ('0' + today.getDate()).slice(-2);

  const hour = today.getHours();
  const min = today.getMinutes();
  const sec = today.getSeconds();

  const dateString = `${year}-${month}-${day} ${hour}:${min}:${sec}`;

  return dateString;
}

function timeForToday(value) {
  const today = new Date();
  const timeValue = new Date(value);

  const betweenTime = Math.floor((today.getTime() - timeValue.getTime()) / 1000 / 60);
  if (betweenTime < 1) return '방금전';
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
    value == '' ||
    value == null ||
    value == undefined ||
    (value != null && typeof value == 'object' && !Object.keys(value).length)
  ) {
    return true;
  } else {
    return false;
  }
};

const wait = async (duration) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true);
    }, duration);
  });
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
