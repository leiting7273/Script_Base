/**
 * 序言：本脚本用于B站直播自动签到以及大会员每月自动领B币（暂时不会自动兑换瓜子，月底前记得用掉）
 */
const biliSheet = Application.Sheets("BiliBili")  //Bilibili工作表
if (biliSheet == null) {
  console.error('未找到表格“BiliBili”')
  return
}
const msgSheet = Application.Sheets("【通知消息】") //【通知消息】工作表
if (msgSheet == null) {
  console.error('未找到表格“【通知消息】”')
  return
}
var msgResult = ''
var msgContent = ''

const myDate = new Date() //获取当前时间
const currentDate = myDate.getFullYear() + "-" + (myDate.getMonth() + 1) + "-" + myDate.getDate()  //提取当日日期
const dateNum = myDate.getFullYear() * 10000 + (myDate.getMonth() + 1) * 100 + myDate.getDate()
const tomorrow = new Date(myDate.getTime() + 24 * 60 * 60 * 1000)
const tomorrowNum = tomorrow.getFullYear() * 10000 + (tomorrow.getMonth() + 1) * 100 + tomorrow.getDate()
const last = new Date(myDate.getFullYear(), myDate.getMonth() + 1, 0).getDate()//本月天数

//执行签到
doCheckIn()

//写入消息日志
msgSheet.Range('B3').Value = msgResult;
msgSheet.Range('C3').Value = msgContent;
msgSheet.Range('D3').Value = myDate.getFullYear() + '-' + (myDate.getMonth() + 1).toString().padStart(2, '0') + '-' + myDate.getDate().toString().padStart(2, '0');


/**
 * 以下为函数实现
 * 
 */

//遍历签到
function doCheckIn() {
  var bliCookie, isSignIn, lastDay, is_Vip, month_ReDay, _csrf
  for (let row = 2; "" != (isSignIn = biliSheet.Range("E" + row).Text); row++) {
    bliCookie = biliSheet.Range("A" + row).Text  //用户凭据
    lastDay = biliSheet.Range("G" + row).Text   //签到日期
    is_Vip = biliSheet.Range("I" + row)
    month_ReDay = biliSheet.Range("K" + row)
    _csrf = biliSheet.Range("L" + row)

    if (isSignIn != "是") continue //不签到的用户跳过
    if (lastDay == currentDate) { //已签到的用户跳过
      addMsg("A" + row + "用户今日已签到，无需重复签到！")
      msgResult = '✅'
      continue
    }
    let res = signIn(bliCookie)  //执行用户签到
    addMsg(getInfo(bliCookie).uname + getMsg(row, res)) //获取通知信息

    if (month_ReDay.Text == "" || dateNum - month_ReDay.Value > last) {   //每月检查是否是年度大会员
      let isvip = getUserVip(bliCookie)
      if (isvip) { //本月没开会员，跳过
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
            addMsg("|领取本月B币券成功")
            month_ReDay.Value = dateNum
          } else {
            console.log("用户A" + row + res.message)
            addMsg("|领取本月B币券结果：" + res.message)
          }
        } else if (month_ReDay.Value + 100 < tomorrowNum && dateNum < month_ReDay.Value + 100) {  //过期前1天
          let balance = getUserWallet(bliCookie)
          if (balance > 0) {
            //兑换电池,暂未实现,仅提示
            addMsg("| B币券即将过期【重要提醒】" + "你的B币券余额" + balance + "还有不到一天就要过期啦")
          }
        }
      }
    }

  }
}

//获取用户个人信息
function getInfo(bliCookie) {
  let msg = ""
  let headers = { "cookie": bliCookie }
  let result = HTTP.get("https://api.bilibili.com/x/space/myinfo", { headers })
  if (result.status !== 200) { throw new Error("fetch err! status is " + resp.status()) }//服务器响应错误
  let reg = result.json()
  //console.log("------------------------------------")
  if (reg.code == -101) {
    msg = "cookie已失效"
    console.log(msg)
    return msg
  }
  let uid = reg.data.mid //用户id
  let uname = reg.data.name //用户名
  let level = reg.data.level_exp.current_level  //用户等级
  let current_exp = reg.data.level_exp.current_exp  //当前经验值
  let next_exp = reg.data.level_exp.next_exp  //下一级经验值
  let need_exp = next_exp - current_exp //升到下一级，需要的经验值
  let rate = (current_exp / next_exp * 100).toFixed(2) + '%'; //进度
  let coin = reg.data.coins //硬币数 
  msg = "用户id：" + uid + " 用户名：" + uname + " 等级：" + level + "，硬币数：" + coin + "，当前经验值：" + current_exp + "，升级还需" + need_exp + "，当前进度：" + rate
  result = {
    'uid': uid,
    'uname': uname,
    'level': level,
    'coin': coin,
    'current_exp': current_exp,
    'need_exp': need_exp,
    'rate': rate
  }
  return result
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
      msgResult = '✅'
      updateDate(row, currentDate)
      break
    case -101: msg = "未登录，请更新COOKIE！"
      msgResult = '❌'
      break
    case 1011040:
      msgResult = '❓'
      msg = res.message
      break
    default:
      msgResult = '❌'
      msg = "签到发生未知异常"
  }
  console.log("用户A" + row + msg)
  return msg
}

/**
 * 添加通知消息内容
 * 传入参数：内容
 */
function addMsg(content) {
  if (msgContent == '') {
    msgContent = content
  } else {
    msgContent += ' \n' + content
  }
}