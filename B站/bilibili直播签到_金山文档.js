const biliSheet = Application.Sheets("BiliBili")  //Bilibili工作表
const emailSheet = Application.Sheets("发信邮箱配置")   //发信邮箱配置工作表
const myDate = new Date() //获取当前时间
const currentDate = myDate.getFullYear() + "-" + (myDate.getMonth() + 1) + "-" + myDate.getDate()  //提取当日日期
const dateNum = myDate.getFullYear() * 10000 + (myDate.getMonth() + 1) * 100 + myDate.getDate()
const tomorrow = new Date(myDate.getTime() + 24 * 60 * 60 * 1000)
const tomorrowNum = tomorrow.getFullYear() * 10000 + (tomorrow.getMonth() + 1) * 100 + tomorrow.getDate()
const last = new Date(myDate.getFullYear(), myDate.getMonth() + 1, 0).getDate()//本月天数

doCheckIn()//执行签到

//遍历签到
function doCheckIn() {
  var bliCookie, isSignIn, lastDay, isSendEmail, userEmail, isSendWeChat, pushToken, is_Vip, month_ReDay, _csrf
  for (let row = 2; "" != (isSignIn = biliSheet.Range("E" + row).Text); row++) {
    bliCookie = biliSheet.Range("A" + row).Text  //用户凭据
    //isSignIn = biliSheet.Range("E" + row).Text  //是否自动签到
    lastDay = biliSheet.Range("G" + row).Text   //签到日期
    isSendEmail = biliSheet.Range("I" + row).Text //是否发送邮箱签到提醒
    userEmail = biliSheet.Range("L" + row).Text //接收邮箱地址
    isSendWeChat = biliSheet.Range("O" + row).Text  //是否发送微信公众号签到提醒
    pushToken = biliSheet.Range("R" + row).Text //pushplus_token
    is_Vip = biliSheet.Range("W" + row)
    month_ReDay = biliSheet.Range("Y" + row)
    _csrf = biliSheet.Range("Z" + row)

    if (isSignIn != "是") continue //不签到的用户跳过
    if (lastDay == currentDate) { //已签到的用户跳过
      console.log("A" + row + "用户今日已签到，无需重复签到！")
      continue
    }
    let res = signIn(bliCookie)  //执行用户签到
    let msg = getMsg(row, res) //获取通知信息

    if (month_ReDay.Text == "" || dateNum - month_ReDay.Value > last) {   //每月检查是否是年度大会员
      let isvip = getUserVip(bliCookie)
      if (!isvip) continue //本月没开会员，跳过
      is_Vip.Value = "是"
      _csrf.Value = getCsrf(bliCookie)  //读出cookie中的csrf令牌
      let havbq = havBq(bliCookie)
      if (havbq[0].state == 0) {  //查询是否有未领取的B币券
        let res = getBq(bliCookie, 1)  //领B币券
        for (let i = 2; i <= havbq.length; i++) {  //领其它福利
          getBq(bliCookie, i)
        }
        if (res.code == 0) {
          console.log("用户A" + row + "领取B币券成功")
          msg += "|领取本月B币券成功"
          month_ReDay.Value = dateNum
        } else {
          console.log("用户A" + row + res.message)
          msg += "|领取本月B币券结果：" + res.message
        }
      } else if (month_ReDay.Value+100<tomorrowNum&&dateNum<month_ReDay.Value+100) {  //过期前1天
          let balance = getUserWallet(bliCookie)
          if (balance > 0) {
            //兑换电池,暂未实现,仅提示
            sendWeChat(pushToken, "B币券即将过期【重要提醒】", "<font color=Red>**你的B币券余额"+balance+"还有不到一天就要过期啦**</font>")
          }
        }
    }

    /**发送签到结果给用户 */
    if (isSendEmail != "是") { console.log("用户A" + row + "不发送邮件通知") } //是否邮件通知
    else { sendEmail(userEmail, msg) }

    if (isSendWeChat != "是") { console.log("用户A" + row + "不发送微信通知") }  //是否微信通知
    else { sendWeChat(pushToken, "Bilibili签到通知<" + currentDate + ">", msg) }
  }
}

//生成订单
function createOrder(cookie, money) {
  let url = "https://api.live.bilibili.com/xlive/revenue/v1/order/createQrCodeOrder"
  let headers = {
    cookie: cookie
  }
  let data = {
    platform: 'pc',
    build: 0,
    pay_cash: money * 1000
  }
  let resp = HTTP.post(url, data, { headers })
  let res = resp.json()
  return res
}

//查询用户B币券余额,返回数字
// console.log(getUserWallet(biliSheet.Range("A" + 2).Text))
function getUserWallet(cookie) {
  let timestamp = new Date().getTime()
  let url = "https://pay.bilibili.com/paywallet/wallet/getUserWallet"
  let data = {
    panelType: 3,
    platformType: 3,
    timestamp: timestamp,
    traceId: timestamp,
    version: '1.0'
  }
  let headers = {
    'content-type': 'application/json',
    'cookie': cookie
  }
  let resp = HTTP.post(url, data, { headers })
  let res = resp.json()
  return res.data.couponBalance
}

//查询是否是年度大会员
// console.log(getUserVip(biliSheet.Range("A" + 2).Text))
function getUserVip(bliCookie) {
  let headers = { "cookie": bliCookie }
  let result = HTTP.get("https://api.bilibili.com/x/space/v2/myinfo", { headers })
  let res = result.json()
  if (res.code == 0)
    return res.data.profile.vip.label.label_theme == "annual_vip"
  return false
}

//获取csrf令牌
// console.log(getCsrf(biliSheet.Range("A" + 2).Text))
function getCsrf(bliCookie) {
  let a = bliCookie.replace(/\s+/g, '').split(';')  //横向切割cookie
  cookieLength = a.length
  for (let i = 0; i < cookieLength; i++) {
    let b = a[i].split('=') //纵向切割
    let name = b[0]
    let value = b[1]
    if (name == 'bili_jct') {
      return value
    }
  }
  return "null"
}

//领B币券
//{"code":0,"message":"0","ttl":1}
//bili_jct
// console.log(getBq(biliSheet.Range("A" + 2).Text, 1))
function getBq(bliCookie, type) {
  let csrf = getCsrf(bliCookie)
  let resp = HTTP.fetch("https://api.bilibili.com/x/vip/privilege/receive?csrf=" + csrf + "&type=" + type,
    {
      method: "POST",
      timeout: 2000,
      headers: {
        cookie: bliCookie
      }
    })
  let res = resp.json()
  return res
}

//查B币券
// console.log(havBq(biliSheet.Range("A" + 2).Text))
function havBq(bliCookie) {
  let headers = { "cookie": bliCookie }
  let result = HTTP.get("https://api.bilibili.com/x/vip/privilege/my?csrf=26354d46f5827690f2298364e6b7317a", { headers })
  let res = result.json()
  let hav
  if (res.code == 0) {
    hav = res.data.list
    return hav
  }
  return null
}

//查询硬币数
function getCoins(bliCookie) {
  let headers = { "cookie": bliCookie }
  let result = HTTP.get("https://account.bilibili.com/site/getCoin?csrf=26354d46f5827690f2298364e6b7317a", { headers })
  let res = result.json()
  if (res.code == 0)
    return res.data.money
  return -1
}

//更新日期
function updateDate(row, date) {
  biliSheet.Range("G" + row).Value = date
}

//发送B站签到请求
function signIn(bliCookie) {
  let headers = { "cookie": bliCookie }
  let result = HTTP.get("https://api.live.bilibili.com/sign/doSign", { headers })
  if (result.status !== 200) { throw new Error("fetch err! status is " + resp.status()) }//服务器响应错误
  let res = result.json()
  // console.log(res)
  return res
}

//解析签到结果并返回通知信息
function getMsg(row, res) {
  let code = res.code //状态码
  let msg = ""  //待推送给用户的信息
  switch (code) { //解析code
    case 0: msg = "今日签到成功，获取奖励：" + res.data.text
      updateDate(row, currentDate)
      break
    case -101: msg = "未登录，请更新COOKIE！"
      break
    case 1011040: msg = res.message
      break
    default: msg = "签到发生未知异常"
  }
  console.log("用户A" + row + msg)
  return msg
}

//微信通知
function sendWeChat(pushToken, title, content) {
  let url = "http://www.pushplus.plus/send" //请求地址
  let data = { "token": pushToken, "title": title, "content": content, "template": "markdown" } //将消息内容装入data
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
      from: "Bilibili签到<" + sEmail + ">",
      to: userEmail,
      subject: "Bilibili签到通知 [" + currentDate + "]",
      text: message
    });
  } catch (error) { console.error(error) }
}