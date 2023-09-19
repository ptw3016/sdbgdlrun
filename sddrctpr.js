const { SmartThingsClient, BearerTokenAuthenticator } = require('@smartthings/core-sdk')
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require("nodemailer");

require("dotenv").config();

const SMTPSTK = process.env.SMTPSTK;
const client = new SmartThingsClient(new BearerTokenAuthenticator(SMTPSTK))

const sdbgdrsr_dvId = process.env.sdbgdrsr_dvId;  //별관도어락센서
const sdbgdrfbon_dvId = process.env.sdbgdrfbon_dvId; //별관도어락fbt ON
const sdbgdrfboff_dvId = process.env.sdbgdrfboff_dvId; //별관도어락fbt OFF

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const REFRESH_TOKEN2 = process.env.REFRESH_TOKEN2;
const SHEET_ID = process.env.SHEET_ID;
const LogSt_NM = process.env.LogSt_NM;
const SdTitle = process.env.SdTitle;

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

async function smtbgdlstatePr() {

    try {
        let rstcode = {};
        const rtgetstatus = await client.devices.getStatus(sdbgdrsr_dvId);  //현재상태 확인 위해 한번검사!
        const rtgetresult = rtgetstatus.components.main.contactSensor.contact.value;
        console.log("smt 현재상태확인:" + rtgetresult);

        return rtgetresult;
    } catch (e) {
        console.error(error.message);
        var sendemjson = {
            to: process.env.sdadminnvml,
            subject: "sdbgdlstate 실행중 error",
            message: "----errormsg----\n" +
                error.message + "\n" +
                "----errorstack----\n" +
                error.stack + "\n"
        }
        sendemailPr(sendemjson);
    }
}
async function smtbgdldvcPr(drctval) {     //

    //console.log(devicesget.label+" "+doorctval + " 실행중..."); //장치이름 조회하기
    let rstcode = {};
    try {

        if (drctval == "open" || drctval == "closed") {
        } else {
            console.log("제어 value가 유효하지않음 종료!")
            rstcode = { result: "0003", state: "", tryct: "" };
            return rstcode;
        }
        var devicesget = await client.devices.get(sdbgdrsr_dvId)
        const doorctval = drctval;

        const rtgetstatus = await client.devices.getStatus(sdbgdrsr_dvId);  //현재상태 확인 위해 한번검사!
        const rtgetresult = rtgetstatus.components.main.contactSensor.contact.value;
        const getrttime = await getCurrentTime();
        console.log("현재(" + getrttime + ")상태확인:" + rtgetresult);
        console.log(drctval + "! 요청실행중...");

        //return;
        if (rtgetresult == doorctval) {
            console.log("현재상태가 '" + doorctval + "' 이므로 실행없이 종료!");
            rstcode = { result: "0001", state: doorctval, tryct: "" };
            return rstcode;
        }
        //return { result: "0000" };

        var totalct = 1  //fbt 최대 실행 횟수
        for (let i = 1; i <= totalct; i++) {
            var fbrunrst = await sdbgfbonoffPr();
            //console.log("fbt on/off " + i + "번째 요청결과_ on : " + fbrunrst.on + ", off : " + fbrunrst.off);
            if (fbrunrst.on == "0000" && fbrunrst.off == "0000") {
                await sleep(1200);  //딜레이 있을 수 있으니 1초 후 검사!
                const result = await retryUntilValue_dltb(sdbgdrsr_dvId, 15, doorctval);
                const attchk = result.attempt;
                if (result.rst === doorctval) {
                    console.log(`-장치 요청결과 : ${attchk}만에 '${result.rst}' 확인.`);
                    rstcode = { result: "0000", state: doorctval, tryct: i };
                    return rstcode;
                } else {
                    console.log(`-장치 요청결과 : ${attchk}회 시도 후 확인실패!.`);
                }
            } else {
                console.log(i + "번째 요청실패! 다시시도!");
            }
            if (i === totalct) {
                console.log(`문 ${doorctval}을 못했습니다. 최대 시도 횟수(${totalct})`);
                rstcode = { result: "0002", state: doorctval, tryct: "" };
                return rstcode;
            }
        }
    } catch (error) {
        console.error(error.message);
        var sendemjson = {
            to: process.env.sdadminnvml,
            subject: "sdbgdl 실행중 error",
            message: "----errormsg----\n" +
                error.message + "\n" +
                "----errorstack----\n" +
                error.stack + "\n"
        }
        sendemailPr(sendemjson);
    } finally {
        var sendemjson = {
            to: process.env.sdadminnvml,
            subject: "sdbgdl 실행시도됨!",
            message: "sdbgdl 실행시도내역----\n" +
                "시간 : " + await getCurrentTime() + "\n" +
                "시도결과 : result:" + rstcode.result + "\n" +
                "state:" + rstcode.state + "\n" +
                "tryct:" + rstcode.tryct
        }
        sendemailPr(sendemjson);
    }
}

async function retryUntilValue_dltb(dvid, maxAttempts, targetValue) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const getstatus = await client.devices.getStatus(dvid);
        const result = getstatus.components.main.contactSensor.contact.value;

        if (result === targetValue) {
            return { rst: result, attempt: attempt }
        }

        if (attempt === maxAttempts) {
            return { rst: "", attempt: attempt }
        }

        await sleep(1100);
    }
}

async function sdbgfbonoffPr() {
    const cmdstr = "on"  //ON 제어스위치
    const cmdstr2 = "on"  //OFF 제어스위치

    const deviceConfig = {
        component: 'main',
        capability: "switch",
        command: cmdstr
    }
    const deviceConfig2 = {
        component: 'main',
        capability: "switch",
        command: cmdstr2
    }

    var ectecmd = await client.devices.executeCommand(sdbgdrfbon_dvId, deviceConfig);
    var ectecmdrst = ectecmd.results[0].status;
    await sleep(1100);

    var ectecmd2 = await client.devices.executeCommand(sdbgdrfboff_dvId, deviceConfig2);
    var ectecmd2rst = ectecmd2.results[0].status;
    if (ectecmdrst == "ACCEPTED" && ectecmd2rst == "ACCEPTED") {
        return { on: "0000", off: "0000" }; //
    } else if (ectecmdrst == "ACCEPTED" && ectecmd2rst != "ACCEPTED") {
        return { on: "0000", off: "0001" };
    } else if (ectecmdrst != "ACCEPTED" && ectecmd2rst == "ACCEPTED") {
        return { on: "0001", off: "0000" };
    } else {
        return { on: "0001", off: "0001" };
    }
}

async function sendemailPr(sendemjson) {
    const authClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    authClient.setCredentials({ refresh_token: REFRESH_TOKEN });

    var to = sendemjson.to;
    var subject = sendemjson.subject;
    var message = sendemjson.message;

    const accessToken = await authClient.getAccessToken();
    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env.sdadmingmml,
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            refreshToken: REFRESH_TOKEN,
            accessToken: accessToken,
        },
    });
    const mailOptions = {
        from: SdTitle + ' <' + process.env.sdadminnvml + '>', // 발신자 정보
        to: to, // 수신자 정보
        subject: subject, // 제목
        text: message, // 내용 (텍스트)
        //html: "<b>html-이메일 테스트중</b>", // 내용 (HTML)
    };
    const result = await transport.sendMail(mailOptions);
    //console.log(result);
}


async function chkpasscd(timechk, pcchk) {
    // //스프레드시트 ID, 시트 이름, 가져올 범위를 설정합니다.
    try {
        const sheetName = process.env.DCSTNM;
        const range = 'A2:L';

        const authClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
        authClient.setCredentials({ refresh_token: REFRESH_TOKEN2 });
        const sheets = google.sheets({ version: 'v4', auth: authClient });
        const response = await sheets.spreadsheets.values.get({  //sheet get!
            spreadsheetId: SHEET_ID,
            range: `${sheetName}!${range}`,
        });
        const values = response.data.values;
        let chkrst = false;
        let chkrstnm = "";
        let chkrstlv = "";
        for (var i = 0; i < values.length; i++) {
            if (values[i][2] == pcchk) {
                chkrst = true;
                chkrstnm = values[i][1];
                chkrstlv = values[i][6];
                //console.log("일치항목 체크확인!:"+values[0][2]);

            }
        }
        return { chkrst: chkrst, chkrstnm: chkrstnm, chkrstlv: chkrstlv };
    } catch (error) {
        console.error(error.message);
        var sendemjson = {
            to: process.env.sdadminnvml,
            subject: "sdbgdl passchk 실행중 error",
            message: "----errormsg----\n" +
                error.message + "\n" +
                "----errorstack----\n" +
                error.stack + "\n"
        }
        sendemailPr(sendemjson);
    }
}

async function getCurrentTime() {

    // 1. 현재 시간(Locale)
    const curr = new Date();
    //console.log("현재시간(Locale) : " + curr + '<br>');

    // 2. UTC 시간 계산
    const utc =
        curr.getTime() +
        (curr.getTimezoneOffset() * 60 * 1000);

    // 3. UTC to KST (UTC + 9시간)
    const KR_TIME_DIFF = 9 * 60 * 60 * 1000;
    const now =
        new Date(utc + (KR_TIME_DIFF));

   // console.log("한국시간 : " + now);

    // const now = new Date();

    // 연도(yy)를 가져옵니다.
    const year = now.getFullYear().toString().slice(-2);
    
    // 월(MM)을 가져옵니다. 월은 0부터 시작하므로 1을 더하고, 2자리 숫자로 만듭니다.
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    // 일(dd)을 가져옵니다. 2자리 숫자로 만듭니다.
    const day = now.getDate().toString().padStart(2, '0');

    // 요일(ddd)을 가져옵니다.
    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = daysOfWeek[now.getDay()];

    // 시간(hh)을 가져옵니다.
    let hours = now.getHours();
    const isPM = hours >= 12;
    if (isPM) {
        hours -= 12;
    }
    hours = hours === 0 ? 12 : hours; // 0시를 12시로 표시합니다.
    const formattedHours = hours.toString().padStart(2, '0');

    // 분(mm)을 가져옵니다.
    const minutes = now.getMinutes().toString().padStart(2, '0');

    // 오전/오후(am/pm)를 가져옵니다.
    const amPm = isPM ? '오후' : '오전';

    // 최종 문자열을 반환합니다.
    return `${year}-${month}-${day}(${dayOfWeek}) ${amPm} ${formattedHours}:${minutes}`;

}

async function sddrctlogappend(VALUES) {
    const RANGE = `${LogSt_NM}!A:E`; // ex) Sheet1!A1:B2  //한글도가능

    const authClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    authClient.setCredentials({ refresh_token: REFRESH_TOKEN2 });
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    try {

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            //spreadsheetName: SHEET_NAME,
            range: RANGE,
            valueInputOption: 'USER_ENTERED',
            resource: { values: VALUES },
        });
        console.log(`시트에 행이 추가되었습니다.`);

        // const response = await sheets.spreadsheets.values.get({  //sheet get!
        //   spreadsheetId,
        //   range: `${sheetName}!${range}`,
        // });

    } catch (e) {

        console.error(e);
        var emailsubject = "sddrctpr Log 시트에 추가중 에러발생!!";
        var emailcontent = "sddrctpr Log 시트에 추가중 에러발생!!\n" +

            "-----error msg-----\n" +
            e.message + "\n" +
            "-----error stack-----\n" +
            e.stack;

        var sendemjson = {
            to: process.env.sdadminnvml,
            subject: emailsubject,
            message: emailcontent
        }
        //메일 전송
        sendemailPr(sendemjson); // 이메일 전송
    }

}


//smtbgdldvcPr("open");
//chkpasscd();
module.exports = { smtbgdldvcPr, sendemailPr, chkpasscd, smtbgdlstatePr, getCurrentTime, sddrctlogappend };