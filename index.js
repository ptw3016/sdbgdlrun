const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const sddrctpr = require("./sddrctpr");
const app = express();
const port = 3000;
const path = require('path');
const { type } = require('os');

require("dotenv").config();

const AMPNM = process.env.AMPNM;
const rtnbcreate = "/:id";

app.use(express.static('node_modules/bootstrap/dist'));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.static(__dirname)); // 현재 폴더를 정적 리소스로 사용


app.get("/admin/131313", async (req, res) => {
  const chkrtrst = await sddrctpr.chkrtnm();
  // console.log(chkrtrst);
  const sheetName = process.env.JhSt_NM;

  const udrange2 = `${sheetName}!BK3`;  //
  sddrctpr.sddrcupdate(udrange2, chkrtrst[0][0]);
  const udrange3 = `${sheetName}!BK4`;  //
  sddrctpr.sddrcupdate(udrange3, chkrtrst[1][0]);
  const value = new Date().getTime().toString() //고유아이디 만들기 예제
  const udrange = `${sheetName}!BK2`;  //
  await sddrctpr.sddrcupdate(udrange, value);

  const rtnbdel = "/drchkinad/" + chkrtrst[1][0];

  const rtnbredirect = "/drchkinad/" + value;
  app._router.stack = app._router.stack.filter(layer => {
    return layer.route ? layer.route.path !== rtnbdel : true;
  });
  res.redirect(rtnbredirect);
});


app.get("/", async (req, res) => {
  const chkrtrst = await sddrctpr.chkrtnm();
  // console.log(chkrtrst);
  const sheetName = process.env.JhSt_NM;

  const udrange2 = `${sheetName}!BK3`;  //
  sddrctpr.sddrcupdate(udrange2, chkrtrst[0][0]);
  const udrange3 = `${sheetName}!BK4`;  //
  sddrctpr.sddrcupdate(udrange3, chkrtrst[1][0]);
  const value = new Date().getTime().toString() //고유아이디 만들기 예제
  const udrange = `${sheetName}!BK2`;  //
  await sddrctpr.sddrcupdate(udrange, value);

  const rtnbdel = "/drchkin/" + chkrtrst[1][0];

  const rtnbredirect = "/drchkin/" + value;
  app._router.stack = app._router.stack.filter(layer => {
    return layer.route ? layer.route.path !== rtnbdel : true;
  });
  res.redirect(rtnbredirect);
});

app.get("/drchkinad/:id", async (req, res) => {
  const chkrtrst = await sddrctpr.chkrtnm();
  const stid1 = chkrtrst[0][0];
  const stid2 = chkrtrst[1][0];
  // console.log("1stid : " + chkrtrst[0][0]);
  // console.log("2ndid : " + chkrtrst[1][0]);
  const reqval = req.params
  const prrqval = reqval.id
  if (stid1 == prrqval || stid2 == prrqval) {
  } else {
    const htmlFilePath = path.join(__dirname, 'qrerror.html');
    res.sendFile(htmlFilePath);
    return;
  }

  const minutesDifference = await sddrctpr.timestampchk(prrqval);
  // console.log(`현재로부터 ${minutesDifference} 분이 지났습니다.`);
  if (minutesDifference <= 1) {
    fs.readFile(__dirname + '/sdbgdlprcsad.html', 'utf8', (err, data) => {
      if (err) {
        console.error('파일을 읽을 수 없습니다.');
        return res.status(500).send('서버 오류');
      }
      const dataForHiddenField = prrqval; // 
      data = data.replace('{{hiddenFieldData}}', dataForHiddenField);
      res.send(data);
    });
  } else {
    const htmlFilePath = path.join(__dirname, 'qrerror.html');
    res.sendFile(htmlFilePath);
  }
});

app.get("/drchkin/:id", async (req, res) => {
  const chkrtrst = await sddrctpr.chkrtnm();
  const stid1 = chkrtrst[0][0];
  const stid2 = chkrtrst[1][0];
  // console.log("1stid : " + chkrtrst[0][0]);
  // console.log("2ndid : " + chkrtrst[1][0]);
  const reqval = req.params
  const prrqval = reqval.id
  if (stid1 == prrqval || stid2 == prrqval) {
  } else {
    const htmlFilePath = path.join(__dirname, 'qrerror.html');
    res.sendFile(htmlFilePath);
    return;
  }

  const minutesDifference = await sddrctpr.timestampchk(prrqval);
  // console.log(`현재로부터 ${minutesDifference} 분이 지났습니다.`);
  if (minutesDifference <= 1) {
    fs.readFile(__dirname + '/sdbgdlprcs.html', 'utf8', (err, data) => {
      if (err) {
        console.error('파일을 읽을 수 없습니다.');
        return res.status(500).send('서버 오류');
      }
      const dataForHiddenField = prrqval; // 
      data = data.replace('{{hiddenFieldData}}', dataForHiddenField);
      res.send(data);
    });
  } else {
    const htmlFilePath = path.join(__dirname, 'qrerror.html');
    res.sendFile(htmlFilePath);
  }
});

app.get("/drchkin/qrerror", async (req, res) => {
  const htmlFilePath = path.join(__dirname, 'qrerror.html');
  res.sendFile(htmlFilePath);
});
app.post('/tokenchk', async (req, res) => {
  //먼저 timestamp와 password검증하고 오케이 되면 submit 실행해서 데이터 받아올 수 있게!

  try {
    const { body } = req;
    const pcchkinput = body.enteredCode;
    const pcstampchk = body.sgid;
    var rstmsg = "";
    var admsg = "";
    var msgsw = "";
    var logvalue = [
      [
      ]
    ];

    const minutesDifference = await sddrctpr.timestampchk(pcstampchk);
    // console.log("open1. timestampchk : " + minutesDifference);

    const pschkrst = await sddrctpr.chkpasscd(pcchkinput); //
    //console.log("open2. passchkcd : " + pschkrst.chkrst);

    if (minutesDifference > 1) {

      rstmsg = "QR코드 만료";
      admsg = "다시 QR코드를 스캔해주세요";
      msgsw = "qrerror";
      strst = "QR코드 만료"

      const clpltime = await sddrctpr.getCurrentTime();
      logvalue[0][0] = clpltime;
      logvalue[0][1] = "QR코드 만료";
      logvalue[0][2] = pcchkinput;
      logvalue[0][3] = pschkrst.chkrstnm;
      logvalue[0][4] = pschkrst.chkrstlv;

      var sendemjson = {
        to: process.env.sdadminnvml,
        subject: "sdbgdl 실행시도됨!",
        message: "sdbgdl 실행시도내역----\n" +
          "시간 : " + clpltime + "\n" +
          "시도결과 : QR 만료(입력 : " + pcchkinput + ")\n"
      }
      sddrctpr.sendemailPr(sendemjson);
      sddrctpr.sddrctlogappend(logvalue);

    } else if (pschkrst.chkrst == "chkpifaild") {
      const admsgplfail = `비밀번호가 만료되었습니다,<br> 재발급시 관리자에게 문의해 주십시오.<br> [관리자문의-${AMPNM}]`;
      rstmsg = `비밀번호가 만료되었습니다. `;
      admsg = admsgplfail;
      msgsw = "errorchk2";
      strst = ""

      const clpltime = await sddrctpr.getCurrentTime();
      logvalue[0][0] = clpltime;
      logvalue[0][1] = "비번만료";
      logvalue[0][2] = pcchkinput;
      logvalue[0][3] = pschkrst.chkrstnm;
      logvalue[0][4] = pschkrst.chkrstlv;

      var sendemjson = {
        to: process.env.sdadminnvml,
        subject: "sdbgdl 실행시도됨!",
        message: "sdbgdl 실행시도내역----\n" +
          "시간 : " + clpltime + "\n" +
          "시도결과 : 비밀번호 만료(입력 : " + pcchkinput + ")\n"
      }
      sddrctpr.sendemailPr(sendemjson);
      sddrctpr.sddrctlogappend(logvalue);

    } else if (pschkrst.chkrst == "chkok") {
      rstmsg = "";
      admsg = "";
      msgsw = "check";
      strst = "";

    } else {
      //console.log("open3. passchk Faild!");

      const admsgfail = `도어락을 여는 데 실패할 경우 다시 시도하고,<br> 계속해서 열리지 않을 경우 문의해 주십시오.<br> [관리자문의-${AMPNM}]`;
      rstmsg = `비밀번호가 틀렸습니다. `;
      admsg = admsgfail;
      msgsw = "errorchk";
      strst = ""
      const cltime = await sddrctpr.getCurrentTime();
      logvalue[0][0] = cltime;
      logvalue[0][1] = "비번틀림";
      logvalue[0][2] = pcchkinput;
      logvalue[0][3] = "-";
      logvalue[0][4] = "-";

      var sendemjson = {
        to: process.env.sdadminnvml,
        subject: "sdbgdl 실행시도됨!",
        message: "sdbgdl 실행시도내역----\n" +
          "시간 : " + cltime + "\n" +
          "시도결과 : 비밀번호 틀림(입력 : " + pcchkinput + ")\n"
      }
      sddrctpr.sendemailPr(sendemjson);
      sddrctpr.sddrctlogappend(logvalue);
    }
    const drchkstate = await sddrctpr.smtbgdlstatePr();
    res.json({ message: rstmsg, admsg: admsg, msgsw: msgsw, drstate: drchkstate });

  } catch (e) {
    console.error(e);
    var sendemjson = {
      to: process.env.sdadminnvml,
      subject: "sdbgdl 실행중 에러발생!!",
      message: "sdbgdl 실행중 에러발생!!" +
        "-------내용------\n" +
        e
    }
    sddrctpr.sendemailPr(sendemjson);

  }
});


app.get('/submit', async (req, res) => {
  let progress = 0;
  // Set the response headers for server-sent events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {

    //console.log(pcstampchk);
    var strst = "";
    progress = 20;
    res.write(`data: ${progress}\n\n`);
    var logvalue = [
      [
      ]
    ];

    // logvalue[0][3] = pschkrst.chkrstnm;
    // logvalue[0][4] = pschkrst.chkrstlv;
    progress = 30;
    // Send data to the client
    res.write(`data: ${progress}\n\n`);
    const drstatechk = await sddrctpr.smtbgdlstatePr();

    progress = 40;
    // Send data to the client
    res.write(`data: ${progress}\n\n`);


    if (drstatechk == "open") {
      console.log("open3. dlopen result : doorlock already open");
      rstmsg = "이미 도어락이 열려있습니다."
      msgsw = "precheck";
      drstate = "open";
      strst = "이미열림"

      progress = 51;
      res.write(`data: ${progress}\n\n`);
      res.write('event: end\n\n');
      res.end();
      return;
    } else {
      progress = 60;
      // Send data to the client
      res.write(`data: ${progress}\n\n`);
    }

    progress = 70;
    // Send data to the client
    res.write(`data: ${progress}\n\n`);
    const drctrst = await sddrctpr.smtbgdldvcPr("open");
    //console.log("open3. dlopen result : " + drctrst.result);

    if (drctrst.result == "0002") {
      //한번더 시도할때 보낼넘버..
      progress = 81;
      res.write(`data: ${progress}\n\n`);

      const drctrst2 = await sddrctpr.smtbgdldvcPr("open");
      if (drctrst2.result == "0000") {
        rstmsg = "도어락이 열렸습니다!!";
        admsg = `도어락을 여는 데 실패할 경우 다시 시도하고,<br> 계속해서 열리지 않을 경우 문의해 주십시오.<br> [관리자문의-${AMPNM}]`;
        msgsw = "check";
        drstate = drctrst2.state;
        strst = "열기성공"
        progress = 100;
        res.write(`data: ${progress}\n\n`);
      } else if (drctrst2.result == "0002") {

        rstmsg = "도어락에 문제가 있습니다.";
        admsg = `도어락을 여는 데 실패할 경우 다시 시도하고,<br> 계속해서 열리지 않을 경우 문의해 주십시오.<br> [관리자문의-${AMPNM}]`;
        msgsw = "errorchk";
        drstate = drctrst.state;
        strst = "0002/열기에러"
        progress = 89;
        res.write(`data: ${progress}\n\n`);
      }


    } else if (drctrst.result == "0000") {
      rstmsg = "도어락이 열렸습니다!!";
      admsg = `도어락을 여는 데 실패할 경우 다시 시도하고,<br> 계속해서 열리지 않을 경우 문의해 주십시오.<br> [관리자문의-${AMPNM}]`;
      msgsw = "check";
      drstate = drctrst.state;
      strst = "열기성공"
      progress = 100;
      res.write(`data: ${progress}\n\n`);

    } else {
      rstmsg = "도어락에 문제가 있습니다.";
      admsg = `도어락을 여는 데 실패할 경우 다시 시도하고,<br> 계속해서 열리지 않을 경우 문의해 주십시오.<br> [관리자문의-${AMPNM}]`;
      msgsw = "errorchk";
      drstate = drctrst.state;
      strst = "열기에러"
      progress = 83;
      res.write(`data: ${progress}\n\n`);

    }

    res.write('event: end\n\n');
    // Terminate the SSE session
    res.end();


  } catch (e) {
    console.log("Error! 잘못된 요청값입니다. 종료합니다!");   //요청에 대한 에러처리 다시해야함

    var emailsubject = "[sddrchk] 잘못된 요청으로 에러가 떳습니다. 종료합니다!";
    var emailcontent = "[sddrchk] 잘못된 요청으로 에러가 떳습니다. 종료합니다!\n\n";


    emailcontent += "-----error msg-----\n" +
      e.message + "\n" +
      "-----error stack-----\n" +
      e.stack;

    var sendemjson = {
      to: process.env.sdadminnvml,
      subject: emailsubject,
      message: emailcontent
    }
    //메일 전송
    sddrctpr.sendemailPr(sendemjson);
  }

});

app.post('/sddlstate', async (req, res) => {
  const drstatechk = await sddrctpr.smtbgdlstatePr();
  res.json({ drstatechk: drstatechk });
});

app.post('/sdddrclose', async (req, res) => {
  // Set the response headers for server-sent events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    var rstmsg = "";
    var admsg = "";
    var msgsw = "";
    var drstate = "";
    var strst = "";
    var logvalue = [
      [
      ]
    ];
    const drstatechk = await sddrctpr.smtbgdlstatePr();
    // return;
    if (drstatechk == "closed") {
      rstmsg = "이미 도어락이 잠겨있습니다."
      msgsw = "precheck";
      drstate = drstatechk;
      strst = "이미잠김"
      res.json({ message: rstmsg, admsg: admsg, msgsw: msgsw, drstate: drstate });
      return;
    }

    const drctclrst = await sddrctpr.smtbgdldvcPr("closed");
    console.log("close result: " + drctclrst.result);

    if (drctclrst.result == "0002") {
      rstmsg = "도어락에 문제가 있습니다.";
      admsg = `[관리자문의-${AMPNM}]`;
      msgsw = "errorchk";
      drstate = drctclrst.state;
      strst = "0002/잠금에러"
    } else if (drctclrst.result == "0000") {
      rstmsg = "도어락이 잠겼습니다!!";
      msgsw = "check";
      drstate = drctclrst.state;
      strst = "잠금성공"
    } else {
      rstmsg = "도어락에 문제가 있습니다.";
      admsg = `[관리자문의-${AMPNM}]`;
      msgsw = "errorchk";
      drstate = drctclrst.state;
      strst = "잠금에러"
    }
    const cltimecl = await sddrctpr.getCurrentTime();
    logvalue[0][0] = cltimecl;
    logvalue[0][1] = strst;
    logvalue[0][2] = "-";
    logvalue[0][3] = "관리자잠금";
    logvalue[0][4] = "-";

    res.json({ message: rstmsg, admsg: admsg, msgsw: msgsw, drstate: drstate });
    sddrctpr.sddrctlogappend(logvalue);
  } catch (e) {
    console.log("Error! 잘못된 요청값입니다. 종료합니다!");   //요청에 대한 에러처리 다시해야함

    var emailsubject = "[sddrchk] 잘못된 요청으로 에러가 떳습니다. 종료합니다!";
    var emailcontent = "[sddrchk] 잘못된 요청으로 에러가 떳습니다. 종료합니다!\n\n";


    emailcontent += "-----error msg-----\n" +
      e.message + "\n" +
      "-----error stack-----\n" +
      e.stack;

    var sendemjson = {
      to: process.env.sdadminnvml,
      subject: emailsubject,
      message: emailcontent
    }
    //메일 전송
    sddrctpr.sendemailPr(sendemjson);
  }

});

app.post("/rstlogappend", async (req, res) => {
  const { body } = req;
  const pcchkinput = body.enteredCode;
  const rstnum = body.rstnum;
  let strst = "";

  var logvalue = [
    [
    ]
  ];

  if (rstnum == 51) {
    strst = "이미열림" //실행결과
  } else if (rstnum == 83) {
    strst = "열기에러"
  } else if (rstnum == 89) {
    strst = "2번시도/열기에러"
  } else if (rstnum == 99) {
    strst = "2번시도/열기성공"
  } else if (rstnum == 100) {
    strst = "열기성공"
  }

  const pschkrst = await sddrctpr.chkpasscd(pcchkinput);
  const cltimecl = await sddrctpr.getCurrentTime();
  logvalue[0][0] = cltimecl;
  logvalue[0][1] = strst;
  logvalue[0][2] = pcchkinput;
  logvalue[0][3] = pschkrst.chkrstnm;
  logvalue[0][4] = pschkrst.chkrstlv;
  const logrst = sddrctpr.sddrctlogappend(logvalue);
  const drstatechk = await sddrctpr.smtbgdlstatePr();
  var sendemjson = {
    to: process.env.sdadminnvml,
    subject: "sdbgdl 실행시도됨!",
    message: "sdbgdl 실행시도내역----\n" +
      "시간 : " + cltimecl + "\n" +
      "시도결과 : " + strst + "\n" +
      "pcchkinput : " + pcchkinput + "\n" +
      "chkrstnm : " + pschkrst.chkrstnm + "\n" +
      "chkrstlv : " + pschkrst.chkrstlv + "\n" +
      "doorstate : " + drstatechk
  }
  sddrctpr.sendemailPr(sendemjson);

  res.json({ logrst: logrst });
});

app.get("/test", async (req, res) => {
  const htmlFilePath = path.join(__dirname, 'priceready.html');
  res.sendFile(htmlFilePath);
});

app.get("/test2", async (req, res) => {
  try {
    let pricereadyTotal = "";
    const priceready = await iphtmlPr("priceready.html");

    const stylescss = await iphtmlPr("styles.css");
    pricereadyTotal = await priceready.replace("/*{styles.css}*/", stylescss);

    var regex = /<@@(.*?)@@>/g;
    var matches = priceready.match(regex);

    for (let i = 0; i < matches.length; i++) {
      // 정규 표현식을 사용하여 '<@@'와 '@@>'를 제외한 내용 추출
      var extrCont = matches[i].replace(/<@@|@@>/g, '');
      const extrConthtml = await iphtmlPr(extrCont);
      pricereadyTotal = await pricereadyTotal.replace(`<@@${extrCont}@@>`, extrConthtml);

    }

    res.send(pricereadyTotal); // 클라이언트에 응답 보내기

  } catch (err) {
    console.error(err);
    res.status(500).send("서버 오류");

  }
});

async function iphtmlPr(htmlfile) {
  const filePath = path.join(__dirname, htmlfile);
  try {
    const htmlContent = await fs.promises.readFile(filePath, 'utf8'); // fs.promises.readFile 메소드 사용하기
    // HTML 파일의 내용을 읽어온 후, 원하는 위치에 포함시키기
    const includeLine = `${htmlContent}`;
    return includeLine;
  } catch (err) {
    throw err;
  }
}


app.get('/progress', (req, res) => {
  let progress = 0;
  let interval;
  // Set the response headers for server-sent events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Keep the connection open
  req.socket.setTimeout(0);

  // Flush the headers to establish SSE connection
  res.flushHeaders();

  if (!interval) {
    interval = setInterval(() => {
      if (progress === 100) {
        clearInterval(interval);
        interval = null;
        // Send an end event to the client
        res.write('event: end\n\n');
        // Terminate the SSE session
        res.end();

      } else {
        progress = Math.min(progress + 20, 100);
        // Send data to the client
        res.write(`data: ${progress}\n\n`);
      }
    }, 5000);
  }
});

app.get('/loadtest', (req, res) => {
  res.sendFile(__dirname + '/test2.html');
});


app.listen(port, () => {
  console.log(`sddlpr 서버 실행중...`);
});