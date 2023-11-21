const schedule = require('node-schedule');
const sddrctpr = require("./sddrctpr");

async function sctythPr() {
    //daybook
    // const bkjson1 = {
    //     bknm: "예약이름",
    //     sw: "daybook",
    //     dayweek: "", //sw-daywk
    //     date: "2023-11-18", //sw-daybook
    //     hour: 13,
    //     minute: 52,
    // }
    // const daybkA = await scResult(bkjson1, function scfunc() {
    //     bkmailalram(bkjson1, etcval);
    // });

    //wkrepeat
    const bkjson2 = {
        bknm: "sddoorchk",
        sw: "daywk",
        dayweek: [0, 1, 2, 3, 4, 5, 6], //sw-daywk
        //date: "2023-11-18",  //sw-daybook
        hour: 23,
        minute: 30,
    }
    const weekbkB = await scResult(bkjson2, async function scfunc() {
        let chkstr = "";
        let addprfunc = "";
        let addprfuncrst = "";
        const drstatechk = await sddrctpr.smtbgdlstatePr();
        if (drstatechk == "open") {
            chkstr = "문이 열려있어서 자동잠금 실행을 시도하였습니다."
            addprfunc = "smtbgdldvcPr";
            addprfuncrst = await dlchkClosePr();

        } else if (drstatechk == "closed") {
            chkstr = "문이 닫혀있습니다."
        }

        const etcjson = {
            prfuncnm: "drstatechk",
            prfuncrst: drstatechk,
            prfuncmsg: chkstr,
            addprfunc: addprfunc,
            addprfuncrst: addprfuncrst
        }
        bkmailalram(bkjson2, etcjson);
    });
    if (weekbkB == true) {
        console.log("schedule book Success! Run...")
    } else {
        console.log("Schedule Book Failed!")
    }

}

async function dlchkClosePr(){
    const drctrst = await sddrctpr.smtbgdldvcPr("closed");
    if (drctrst.result == "0002") {
        const drctrst2 = await sddrctpr.smtbgdldvcPr("closed");
        if (drctrst2.result == "0002") {
            return "2번시도, 실행실패!(code:" + drctrst2.result + ")";

        } else if (drctrst2.result == "0000") {
            return "2번시도, 실행성공!(code:" + drctrst2.result + ")";
        } else {
            return "2번시도, 실행실패!(code:" + drctrst2.result + ")";
        }

    } else if (drctrst.result == "0000") {
        return "1번만에 실행성공!(code:" + drctrst.result + ")";
    } else {
        return "1번시도 실행실패!(code:" + drctrst.result + ")";
    }
}

async function scResult(bkjson, func) {
    const rule = new schedule.RecurrenceRule();
    if (bkjson.sw == "daybook") {
        const targetDateA = new Date(bkjson.date); //원하는 날짜에!
        rule.year = targetDateA.getFullYear();
        rule.month = targetDateA.getMonth();
        rule.date = targetDateA.getDate();
        rule.hour = bkjson.hour;
        rule.minute = bkjson.minute;
        rule.tz = 'Asia/Seoul';
    } else if (bkjson.sw == "daywk") {
        rule.dayOfWeek = bkjson.dayweek;  //요일반복주기!
        rule.hour = bkjson.hour;
        rule.minute = bkjson.minute;
        rule.tz = 'Asia/Seoul';
    }

    const job = schedule.scheduleJob(rule, () => func());
    if (job) {
        //console.log("*[예약성공] bkname:" + bkjson.bknm);
        //console.log(bkjson);
        //console.log("/예약함수:" + func.name);
        //console.log("/----------------");
        return true;
    } else {
        //console.log("*[예약실패] bkname:" + bkjson.bknm + "(시간 지났을 수 있음)");
        //console.log(bkjson);
        //console.log("/예약함수:" + func.name);
        //console.log("/----------------");
        return false;
    }
}

async function bkmailalram(ipjson, etcjson) {
    let bkdateWkStr = "";
    let rpweekday = await dayweekcv(ipjson.dayweek);
    if (ipjson.sw == "daywk") {
        bkdateWkStr = "/반복요일 : " + rpweekday + "\n";
    } else if (ipjson.sw == "daybook") {
        bkdateWkStr = "/예약일자 : " + ipjson.date + "\n";
    }
    let bkhour = ipjson.hour;
    let bkmin = ipjson.minute;
    let rstmsgadd = "없음\n";
    if (etcjson.prfuncrst == "open") {
        rstmsgadd = "*추가실행함수명 : " + etcjson.addprfunc + "\n" +
            "*추가실행함수결과 : " + etcjson.addprfuncrst + "\n";
    }
    var sendemjson = {
        to: process.env.sdadminnvml,
        subject: "[" + ipjson.bknm + "] 시간예약 실행test!",
        message: "[" + ipjson.bknm + "] 시간예약 실행test!--------\n" +
            "/실행함수명 : " + etcjson.prfuncnm + "\n" +
            "/실행함수결과 : " + etcjson.prfuncrst + "\n" +
            "/결과메시지 : " + etcjson.prfuncmsg + "\n" +
            "---추가실행내역---\n" +
            rstmsgadd +
            "\n" +
            "*실행예약내역 --------- \n" +
            "/예약이름 : " + ipjson.bknm + "\n" +
            bkdateWkStr +
            "/예약시간 : " + addLeadingZero(bkhour) + ":" + addLeadingZero(bkmin) + "\n"
    }
    sddrctpr.sendemailPr(sendemjson);
}

function addLeadingZero(number) {
    return number < 10 ? '0' + number : '' + number;
}
async function dayweekcv(weekarray) {
    const hgDayWeek = ["일", "월", "화", "수", "목", "금", "토"]
    let newdayweek = [];
    for (let i = 0; i < weekarray.length; i++) {
        newdayweek.push(hgDayWeek[weekarray[i]]);
    }
    return newdayweek;
}

//sctythPr();

module.exports = { sctythPr }