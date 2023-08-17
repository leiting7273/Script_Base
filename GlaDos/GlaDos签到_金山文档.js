const gladosSheet = Application.Sheets("GlaDos")  //Bilibili工作表
const emailSheet = Application.Sheets("发信邮箱配置")   //发信邮箱配置工作表
const myDate = new Date() //获取当前时间
// const glsdosUsedRowEnd = gladosSheet.UsedRange.RowEnd //用户使用表格的最后一行
// const endRow = getEndRow()  //END标位置，默认7
const currentDate = myDate.getFullYear() + "-" + (myDate.getMonth() + 1) + "-" + myDate.getDate();  //提取当日日期

// 遍历签到
var cookie, isSignIn, lastDate, leftDays, isEmail, userEmail, isWeChat, pushToken
var result, msg
for (let row = 2; "" != (isSignIn = gladosSheet.Range("D" + row).Text); row++) {
  cookie = gladosSheet.Range("A" + row).Text  //获取用户cookie
  // isSignIn = gladosSheet.Range("D" + row).Text  //获取是否自动签到
  lastDate = gladosSheet.Range("F" + row).Text  //获取已签日期
  leftDays = gladosSheet.Range("H" + row).Text  //获取剩余天数
  isEmail = gladosSheet.Range("I" + row).Text  //获取是否邮箱通知
  userEmail = gladosSheet.Range("K" + row).Text  //获取收件箱
  isWeChat = gladosSheet.Range("N" + row).Text  //获取是否微信通知
  pushToken = gladosSheet.Range("P" + row).Text  //获取pushplus_token

  if (isSignIn != "是") continue //跳过不签到用户

  if (cookie == "") { //未填写cookie不签到 
    console.log("用户A" + row + "未填写cookie")
    continue
  }

  if (leftDays == "0") {
    console.log("用户A" + row + "会员过期")
    continue
  }

  if (lastDate == currentDate) {  //今日已签不签到
    console.log("用户A" + row + "今日已签，不签到")
    continue
  }

  result = signIn("用户A" + row, cookie)  //签到
  leftDays = getLeftDays(cookie)//获取剩余天数
  // console.log(result)

  msg = getMsg(result)  //获取签到结果信息
  msg = msg + " [会员剩余" + leftDays + "天]"
  console.log(msg)  //打印到控制台

  if (result.code == 0) {  //更新信息
    gladosSheet.Range("F" + row).Value = currentDate
    gladosSheet.Range("H" + row).Value = leftDays
  }

  if (isEmail == "是") {  //发邮件
    sendEmail(userEmail, msg)
  }

  if (isWeChat == "是") { //微信通知
    sendWeChat(pushToken, "GlaDos签到通知", msg)
  }
}

//发起签到请求,返回json结果
function signIn(user, cookie) {
  let resp = HTTP.post(
    "https://glados.rocks/api/user/checkin",
    {
      "token": "glados.one"
    },
    {
      "headers": { "Cookie": cookie }
    }
  );
  if (resp.status !== 200) { console.log(user + "签到异常"); throw new Error("fetch err! status is " + resp.status()) }//服务器响应错误
  let res = resp.json();//获取返回的JSON
  return res
}

//解析签到结果并返回通知信息
function getMsg(res) {
  let code = res.code
  let message = res.message
  if (code == 0) return "签到成功！获得1天会员时长[" + message + "]"
  else if (code == -2) return "未登录，请更新cookie[" + message + "]"
  else if (code == 1) {
    if (message == "oops, token error") {
      return "签到token错误，请检查！[" + message + "]"
    } else if (message == "Please Try Tomorrow") {
      return "已签到，请明天再试！[" + message + "]"
    }
  }
  return "签到失败，意外的错误[code:" + code + ",message:" + message + "]"
}

/*获取会员剩余天数 */
function getLeftDays(cookie) {
  let headers = { "cookie": cookie }
  let resp = HTTP.get("https://glados.rocks/api/user/status", { headers })
  if (resp.status !== 200) {
    console.error("获取剩余天数失败")
    throw new Error("err! status is " + resp.status())
  } else {
    let res = resp.json()  //返回json
    // console.log(res)
    if (res.code != 0) return -1
    let leftDays = parseInt(res.data.leftDays)
    // console.log(leftDays)
    return leftDays
  }
}

//获取END标行号
// function getEndRow() {
//   for (let row = 3; row <= glsdosUsedRowEnd; row++) {
//     if (gladosSheet.Range("A" + row).Text == "END") return row
//   }
//   console.error("END标缺失！")
//   return 7
// }


//邮件通知
function sendEmail(userEmail, message) {
  /*获取发件邮箱配置*/
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
      from: "GlaDos签到<" + sEmail + ">",
      to: userEmail,
      subject: "GlaDos签到通知 [" + currentDate + "]",
      text: message
    });
  } catch (error) { console.error(error) }
}

//微信通知
function sendWeChat(pushToken, title, content) {
  let url = "http://www.pushplus.plus/send" //请求地址
  let data = { "token": pushToken, "title": title, "content": content } //将消息内容装入data
  let headers = { "content-type": "application/json" }  //headers
  try {
    let resp = HTTP.post(url, data, headers) //发送请求
    let res = resp.json()  //返回json
    return res
  } catch (error) { console.error(error) }

  // console.log(res)
}