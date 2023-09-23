const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const sddrctpr = require("./sddrctpr");
const app = express();
const port = 3000;
require("dotenv").config();

const AMPNM = process.env.AMPNM;

app.use(express.static('node_modules/bootstrap/dist'));
app.use(bodyParser.json());

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

  const rtnbdel = "/" + chkrtrst[1][0];
  const rtnbcreate = "/:id";
  const rtnbredirect = "/" + value;
  app._router.stack = app._router.stack.filter(layer => {
    return layer.route ? layer.route.path !== rtnbdel : true;
  });

  app.get(rtnbcreate, async (req, res) => {
    const rotmbrd = rtnbredirect.split("/");
    const minutesDifference = await sddrctpr.timestampchk(rotmbrd[1]);
    const reqval = req.params
    const prrqval = reqval.id

    //console.log(`현재로부터 ${minutesDifference} 분이 지났습니다.`);
    if (minutesDifference <= 1) {
      // const path = require('path');
      // const htmlFilePath = path.join(__dirname, 'sdbgdlprcs.html');
      // res.sendFile(htmlFilePath);

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
      res.send("다시 QR코드를 스캔해주세요.")
    }
  });
  res.redirect(rtnbredirect);
});

app.post('/submit', async (req, res) => {
  const { body } = req;
  const pcchkinput = body.enteredCode;
  const pcstampchk = body.sgid;
  //console.log(pcstampchk);
  var rstmsg = "";
  var admsg = "";
  var msgsw = "";
  var drstate = "";
  var strst = "";

  const minutesDifference = await sddrctpr.timestampchk(pcstampchk);
  const pschkrst = await sddrctpr.chkpasscd("시간", pcchkinput); //큐알로 방금 접속했는지도 확인해보기.. 위치는 어떻게..
  var logvalue = [
    [
    ]
  ];

  if (minutesDifference > 1) {
    //console.log("다시 QR코드를 스캔해주세요");
    rstmsg = "QR코드 만료";
    admsg = "다시 QR코드를 스캔해주세요";
    msgsw = "qrerror";
    drstate = "";
    strst = "QR코드 만료"
    res.json({ message: rstmsg, admsg: admsg, msgsw: msgsw, drstate: "" });
  }else if (pschkrst.chkrst == true) {
   
    logvalue[0][3] = "-";
    logvalue[0][4] = "-";

    const drctrst = await sddrctpr.smtbgdldvcPr("open");
    if (drctrst.result == "0001") {
      rstmsg = "이미 도어락이 열려있습니다."
      msgsw = "precheck";
      drstate = drctrst.state;
      strst = "이미열림"
      logvalue[0][3] = pschkrst.chkrstnm;
      logvalue[0][4] = pschkrst.chkrstlv;
    } else if (drctrst.result == "0002") {
      rstmsg = "도어락에 문제가 있습니다.";
      admsg = `도어락을 여는 데 실패할 경우 다시 시도하고,<br> 계속해서 열리지 않을 경우 문의해 주십시오.<br> [관리자문의-${AMPNM}]`;
      msgsw = "errorchk";
      drstate = drctrst.state;
      strst = "0002/열기에러"
    } else if (drctrst.result == "0000") {
      rstmsg = "도어락이 열렸습니다!!";
      admsg = `도어락을 여는 데 실패할 경우 다시 시도하고,<br> 계속해서 열리지 않을 경우 문의해 주십시오.<br> [관리자문의-${AMPNM}]`;
      msgsw = "check";
      drstate = drctrst.state;
      strst = "열기성공"
      logvalue[0][3] = pschkrst.chkrstnm;
      logvalue[0][4] = pschkrst.chkrstlv;

    } else {
      rstmsg = "도어락에 문제가 있습니다.";
      admsg = `도어락을 여는 데 실패할 경우 다시 시도하고,<br> 계속해서 열리지 않을 경우 문의해 주십시오.<br> [관리자문의-${AMPNM}]`;
      msgsw = "errorchk";
      drstate = drctrst.state;
      strst = "열기에러"
    }

    res.json({ message: rstmsg, admsg: admsg, msgsw: msgsw, drstate: drstate });
    const cltimest = await sddrctpr.getCurrentTime();
    logvalue[0][0] = cltimest;
    logvalue[0][1] = strst;
    logvalue[0][2] = pcchkinput;

    sddrctpr.sddrctlogappend(logvalue);

  } else {
    const drchkstate = await sddrctpr.smtbgdlstatePr();
    const admsgfail = `도어락을 여는 데 실패할 경우 다시 시도하고,<br> 계속해서 열리지 않을 경우 문의해 주십시오.<br> [관리자문의-${AMPNM}]`;
    res.json({ message: `비밀번호가 틀렸습니다. `, admsg: admsgfail, msgsw: "errorchk", drstate: drchkstate });
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
    //로그 준비
  }
});

app.post('/sddlstate', async (req, res) => {
  const drstatechk = await sddrctpr.smtbgdlstatePr();
  res.json({ drstatechk: drstatechk });
});

app.post('/sdddrclose', async (req, res) => {
  var rstmsg = "";
  var admsg = "";
  var msgsw = "";
  var drstate = "";
  var strst = "";
  var logvalue = [
    [
    ]
  ];
  const drctclrst = await sddrctpr.smtbgdldvcPr("closed")

  if (drctclrst.result == "0001") {
    rstmsg = "이미 도어락이 잠겨있습니다."
    msgsw = "precheck";
    drstate = drctclrst.state;
    strst = "이미잠김"
  } else if (drctclrst.result == "0002") {
    rstmsg = "도어락에 문제가 있습니다.";
    admsg = `[관리자문의-${AMPNM}]`;
    msgsw = "errorchk";
    drstate = drctclrst.state;
    strst = "0002/잠금에러"
  } else if (drctclrst.result == "0000") {
    rstmsg = "도어락이 잠겼습니다!!";
    msgsw = "check";
    drstate = drctclrst.state;
    strst = "잠금성공!"
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
});

app.listen(port, () => {
  console.log(`sddlpr 서버 실행중...`);
});
