const myDate = new Date() //获取当前时间
const year = myDate.getFullYear()//年
const month = myDate.getMonth() + 1//月
const day = myDate.getDate()//日
const today = year + "/" + month + "/" + day
const sheet = Application.Sheets('其它')//表格
if (sheet == null) {
  console.error('未找到表格“其它”')
  return
}

const msgSheet = Application.Sheets("【通知消息】") //【通知消息】工作表
if (msgSheet == null) {
  console.error('未找到表格“【通知消息】”')
  return
}

var user = {
  // row: 0,
  cookie: sheet.Range("B5").Text,
  msgResult: '',
  msgContent: ''
}
if (user.cookie == "") return

checkIn()

//写入消息日志
msgSheet.Range('B9').Value = user.msgResult
msgSheet.Range('C9').Value = user.msgContent
msgSheet.Range('D9').Value = today  //myDate.getFullYear() + '-' + (myDate.getMonth() + 1).toString().padStart(2, '0') + '-' + myDate.getDate().toString().padStart(2, '0');


//添加消息
function addMsg(msg) {
  console.log(msg)
  if (user.msgContent == '') {
    user.msgContent = msg;
  } else {
    user.msgContent += '\n' + msg
  }
}

/**
 * 获取所有Cookie
 */
function getCookies() {
  let cookies = user.cookie;
  let cookieR = cookies.replace(/\s+/g, '').split(';')  //横向切割cookie
  let cookieLength = cookieR.length
  let res = '{'
  for (let i = 0; i < cookieLength; i++) {
    let cookieC = splitStringByFirstEqual(cookieR[i]) //纵向切割
    if (res == '{') {
      res += '"' + cookieC[0] + '":"' + cookieC[1] + '"'
    } else {
      res += ',"' + cookieC[0] + '":"' + cookieC[1] + '"'
    }
  }
  res += '}'
  res = JSON.parse(res);
  res = { 'string': cookies, 'json': res }
  return res;

  function splitStringByFirstEqual(inputString) {
    const index = inputString.indexOf('=');
    if (index === -1) {
      return [inputString, ''];
    }
    const part1 = inputString.substring(0, index);
    const part2 = inputString.substring(index + 1);
    return [part1, part2];
  }
}

//签到函数
function checkIn() {
  Time.sleep(2000);

  let cookie_json = getCookies(user.cookie).json;
  let url1 = "https://www.52pojie.cn/CSPDREL2hvbWUucGhwP21vZD10YXNrJmRvPWRyYXcmaWQ9Mg==?wzwscspd=MC4wLjAuMA=="
  let url2 = 'https://www.52pojie.cn/home.php?mod=task&do=apply&id=2&referer=%2F'
  let url3 = 'https://www.52pojie.cn/home.php?mod=task&do=draw&id=2'

  try {
    htVC_2132_saltkey = cookie_json['htVC_2132_saltkey']
    htVC_2132_auth = cookie_json['htVC_2132_auth']
    cookie = "htVC_2132_saltkey=" + htVC_2132_saltkey + "; htVC_2132_auth=" + htVC_2132_auth + ";"
    let headers = {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "zh-CN,zh;q=0.9",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Cookie": user.cookie,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
    }

    let res = HTTP.fetch(url1, {
      method: "get",
      headers: headers
    })

    let cookie_set = res.headers['set-cookie']
    user.cookie = user.cookie + cookie_set
    Time.sleep(1000)

    headers["Cookie"] = user.cookie
    let res2 = HTTP.fetch(url2, {
      method: "get",
      headers: headers
    })

    cookie_set = res2.headers['set-cookie']
    user.cookie = user.cookie + cookie_set
    Time.sleep(1000)

    headers["Cookie"] = user.cookie
    let res3 = HTTP.fetch(url3, {
      method: "get",
      headers: headers
    })

    if (res3.status == 200) {
      addMsg("签到完成")
      user.msgResult = '✅'
    } else {
      addMsg("签到响应异常")
      user.msgResult = '❌'
    }
  } catch {
    addMsg("cookie有误，请重新填写")
    user.msgResult = '❌'
  }
}