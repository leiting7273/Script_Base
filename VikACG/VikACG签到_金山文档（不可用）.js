const myDate = new Date() //获取当前时间
const year = myDate.getFullYear()//年
const month = myDate.getMonth() + 1//月
const day = myDate.getDate()//日
const today = year + "-" + month + "-" + day
const sheet = Application.Sheets('VikACG')//表格
const emailSheet = Application.Sheets("发信邮箱配置")   //发信邮箱配置工作表

//执行签到,行号2
checkIn(2)


/*单账户签到
**输入行号
**输出 -2：请求失败 -1：不签到 0：已签到 1：签到失败 2：签到成功
**
*/
function checkIn(row) {
  let cookie, isCheckIn, lastDate, isEmail, userEmail, isWeChat, pushToken
  cookie = sheet.Range('A' + row).Text
  isCheckIn = sheet.Range('E' + row).Text
  lastDate = sheet.Range('G' + row).Text
  isEmail = sheet.Range('I' + row).Text
  userEmail = sheet.Range('L' + row).Text
  isWeChat = sheet.Range('O' + row).Text
  pushToken = sheet.Range('R' + row).Text
  let flag = 999
  let msg = '签到异常，请检查日志'  //待发送的信息
  let b2_token = getCookie(cookie, 'b2_token')

  if (isCheckIn != '是') {
    console.log('用户A' + row + '不签到')
    flag = -1 //不签到
  }
  if (today == lastDate) {
    console.log('用户A' + row + '今日已签到')
    flag = 0  //已签到
  }

  //检查积分
  let resp = HTTP.post('https://www.vikacg.com/wp-json/b2/v1/getUserMission',
    {
      'count': 0,
      'paged': 1
    },
    {
      headers: {
        'authorization': 'Bearer ' + b2_token,
        'referrer': 'https://www.vikacg.com/mission/today'
      }
    })
  if (resp.status != 200) {
    console.log('用户A' + row + '发送请求失败')
    flag = -2  //请求失败
  }

  let json = resp.json()
  let data = json.mission
  let checkinDate = data.date//服务器上次签到时间yyyy-mm-dd hh:MM:ss
  let my_credit = data.my_credit//目前积分
  let always = data.always

  if (checkGetMission != 0) {  //请求返回异常
    console.log('用户A' + row + "签到时间：" + checkinDate + "，签到获得积分：" + checkGetMission + "，目前积分：" + my_credit)
    console.log('用户A' + row + '今天已经签到，如有问题请尝试手动签到')
    flag = 0
  }
  console.log('用户A' + row + "目前积分：" + my_credit)

  resp = HTTP.post('https://www.vikacg.com/wp-json/b2/v1/userMission',
    {},
    {
      headers: {
        'authorization': 'Bearer ' + b2_token,
        'referrer': 'https://www.vikacg.com/mission/today'
      }
    })
  if (resp.status != 200) {
    console.log('用户A' + row + '签到失败')
    flag = 1  //签到失败
  }

  let json2 = resp.json()
  let date2 = json.date
  let credit2 = json.credit
  let my_credit2 = json.mission.my_credit
  if (flag == 999) {
    msg = date + " 签到成功，获得积分：" + credit + " 目前积分：" + my_credit
  }

  //发送邮箱
  if (isEmail == '是') {
    console.log(sendEmail(userEmail, msg))
  } else { console.log("用户A" + row + "不发送邮件通知") }

  //发送微信
  if (isWeChat == '是') {
    console.log(sendWeChat(pushToken, 'VikACG签到', msg))
  } else { console.log("用户A" + row + "不发送微信通知") }
}

//微信通知
function sendWeChat(pushToken, title, content) {
  let url = "http://www.pushplus.plus/send" //请求地址
  let data = { "token": pushToken, "title": title, "content": content } //将消息内容装入data
  let headers = { "content-type": "application/json" }  //headers
  let resp = HTTP.post(url, data, headers) //发送请求

  if (resp.status !== 200) { throw new Error("err! status is " + resp.status()) }
  let res = resp.json()  //返回json
  // console.log(res)
  return res
}

//邮件通知
function sendEmail(userEmail, message) {
  const sHost = emailSheet.Range("B1").Text  //发件箱host
  const sPort = parseInt(emailSheet.Range("B2").Text)  //发件箱port
  const sEmail = emailSheet.Range("B3").Text  //发件箱
  const sPwd = emailSheet.Range("B4").Text  //发件箱SMTP授权码

  try {
    let mailer = SMTP.login({
      host: sHost,
      port: sPort,
      username: sEmail,
      password: sPwd,
      secure: true
    });
    mailer.send({
      from: "VikACG签到<" + sEmail + ">",
      to: userEmail,
      subject: "VikACG签到通知 [" + currentDate + "]",
      text: message
    });
  } catch (error) { console.error(error) }
}




//根据name获取cookie
function getCookie(allCookie, nm) {
  let cookieR = allCookie.replace(/\s+/g, '').split(';')  //横向切割cookie
  let cookieLength = cookieR.length
  for (let i = 0; i < cookieLength; i++) {
    let cookieC = cookieR[i].split('=') //纵向切割
    let name = cookieC[0]
    let value = cookieC[1]
    if (name == nm) {
      return value
    }
  }
  return null
}