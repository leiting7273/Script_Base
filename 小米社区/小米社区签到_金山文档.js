const myDate = new Date() //获取当前时间
const currentDate = myDate.getFullYear() + "-" + (myDate.getMonth() + 1) + "-" + myDate.getDate();  //提取当日日期
const xmSheet = Application.Sheets("小米社区")  //小米社区工作表
const emailSheet = Application.Sheets("发信邮箱配置")   //发信邮箱配置工作表
var weekDay = new Date().getDay() - 1
weekDay = weekDay < 0 ? 6 : weekDay //今天周几，周一是0，周日是6
const testCookie = xmSheet.Range("A2").Text

runByInfo();

//遍历执行
function runByInfo() {
  let cookie, isSignIn, isSendEmail, userEmail, isSendWeChat, pushToken, msg, accountCookie, getNewCookieUrl
  for (let row = 2; "" != (isSignIn = xmSheet.Range("E" + row).Text); row++) {
    cookie = xmSheet.Range("A" + row).Text  //用户签到凭据
    accountCookie = xmSheet.Range("G" + row).Text   //登录信息Cookie
    isSendEmail = xmSheet.Range("I" + row).Text //是否发送邮箱签到提醒
    userEmail = xmSheet.Range("L" + row).Text //接收邮箱地址
    isSendWeChat = xmSheet.Range("O" + row).Text  //是否发送微信公众号签到提醒
    pushToken = xmSheet.Range("R" + row).Text //pushplus_token
    getNewCookieUrl = 'https://api.vip.miui.com/page/login?destUrl=https%3A%2F%2Fweb.vip.miui.com%2Fpage%2Finfo%2Fmio%2Fmio%2FuserDevPlatform%3FisHideTitle%3D1%26app_version%3Ddev.220218&cUserId=' + getCookie(cookie, 'cUserId')

    if (isSignIn != "是") continue //不签到的用户跳过

    //{"time":0,"message":"success","entity":{"continueCheckInDays":2,"checkin7DaysDetail":[0,0,3,4,-1,-1,-1]},"status":200} 正确返回
    //{"code":401}  错误返回
    let checkInfo = getCheckInfo(cookie)  //获取本周签到信息
    if (checkInfo.code == 401 || checkInfo.status != 200) {
      cookie = getNewCookie(getNewCookieUrl, accountCookie) //获取新的签到cooKie
      if (cookie == -1 || cookie == '') {
        msg = '账号登录cookie异常'
        console.error('A' + row + msg)
        continue
      }
      xmSheet.Range("A" + row).Value = cookie  // 新签到Cookie自动写入表格
      checkInfo = getCheckInfo(cookie)
    }
    let statu = checkInfo.entity.checkin7DaysDetail[weekDay]
    let week = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
    if (statu > 0) { //今日已签到，跳过
      console.log("用户A" + row + week[weekDay] + "已签到，无需重复签到")
      continue
    }

    //{"time":0,"message":"success","entity":4,"status":200}
    //{"time":0,"message":"今天已签到了哦，明天再来吧","status":500}
    let res = checkIn(cookie)  //执行用户签到
    if (res.status != 200) {  //如果签到不成功
      if (res.status == 500) {
        console.log("用户A" + row + week[weekDay] + res.message)
      } else {
        console.log("用户A" + row + res.message)
        msg = res.message
      }
    }
    if(res.entity==null){
      msg = week[weekDay] + '签到失败'
    }else{
      msg = week[weekDay] + "签到成功，经验+" + res.entity
    }
    console.log("用户A" + row + msg)

    if (isSendEmail != "是") { console.log("用户A" + row + "不发送邮件通知") } //是否邮件通知
    else { sendEmail(userEmail, msg) }

    if (isSendWeChat != "是") { console.log("用户A" + row + "不发送微信通知") }  //是否微信通知
    else { sendWeChat(pushToken, "小米社区签到通知<" + currentDate + ">", msg) }

  }
}

//获取新的签到Cookie
//返回-1：用户账户登录Cookie已过期
//返回空字符串：响应头无set-cookie
// getNewCookie(,
//   xmSheet.Range("G2").Text)
function getNewCookie(url, accountCookie) {
  let newCookie = ''
  let resp = HTTP.get(url)  //发送请求1
  url = resp.headers.location
  resp = HTTP.fetch(url, {  //发送请求2，确认该账户已登录
    method: "GET",
    timeout: 2000,
    headers: { 'cookie': accountCookie }
  })
  url = resp.headers.location
  resp = HTTP.get(url)  //发送请求3，获取新的签到Cookie
  if (resp.status != 302) return -1 //如果响应码不是302，则用户账户登录Cookie已过期，返回-1
  for (let i = 0; i < resp.headers['set-cookie'].length; i++) { //拼接新签到Cookie
    str = resp.headers['set-cookie'][i]
    const indexEqual = str.indexOf('=');
    const indexSemicolon = str.indexOf(';');
    if (indexEqual === -1) continue;
    const name = str.substring(0, indexEqual);
    const value = indexSemicolon !== -1 ? str.substring(indexEqual + 1, indexSemicolon) : str.substring(indexEqual + 1);
    if (newCookie == '') {
      newCookie += name + '=' + value
    } else {
      newCookie += '; ' + name + '=' + value
    }
  }
  return newCookie
}

//查签到
// console.log(getCheckInfo(testCookie))
function getCheckInfo(cookie) {
  let url = 'https://api.vip.miui.com/mtop/planet/vip/user/getUserCheckinInfo' +
    "?miui_vip_ph=" + encodeURIComponent(getCookie(cookie, "miui_vip_ph"))//将miui_vip_ph放进参数
  // 发起网络请求
  let resp = HTTP.fetch(url,
    {
      method: "GET",
      timeout: 2000,
      headers: { 'Cookie': cookie }
    })
  let res = resp.json()
  return res
}

//执行签到
// console.log(checkIn(xmSheet.Range("A2").Text))
function checkIn(cookie) {
  let url = "https://api.vip.miui.com/mtop/planet/vip/user/checkin" +
    "?miui_vip_ph=" + encodeURIComponent(getCookie(cookie, "miui_vip_ph"))//将miui_vip_ph放进参数

  let resp = HTTP.fetch(url,
    {
      method: "POST",
      timeout: 2000,
      headers: { 'Cookie': cookie }
    })
  let res = resp.json()
  return res
}

//获取指定名称cookie
// console.log(getCookie(xmSheet.Range("A2").Text,'miui_vip_ph'))
function getCookie(allCookie, name) {
  let cookieR = allCookie.replace(/\s+/g, '').split(';')  //横向切割cookie
  let cookieLength = cookieR.length
  for (let i = 0; i < cookieLength; i++) {
    let cookieC = splitStringByFirstEqual(cookieR[i]) //纵向切割
    if (name == cookieC[0]) return cookieC[1]
  }
  return null
}

/*
  自定义字符串处理函数
  以'='切割字符串（仅第一个'='有效）
  返回数组
*/
function splitStringByFirstEqual(inputString) {
  const index = inputString.indexOf('=');
  if (index === -1) {
    return [inputString, ''];
  }
  const part1 = inputString.substring(0, index);
  const part2 = inputString.substring(index + 1);
  return [part1, part2];
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
      from: "小米社区签到<" + sEmail + ">",
      to: userEmail,
      subject: "小米社区签到通知 [" + currentDate + "]",
      text: message
    });
  } catch (error) { console.error(error) }
}
