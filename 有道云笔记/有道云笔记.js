//有道云笔记

var user = {
    cookie_location: 'B6',
    msgResult_location: 'B8',
    msgContent_location: 'C8',
    today_location: 'D8',
    cookie: '',
    msgResult: '',
    msgContent: ''
  }
  
  const myDate = new Date() //获取当前时间
  const year = myDate.getFullYear()//年
  const month = myDate.getMonth() + 1//月
  const day = myDate.getDate()//日
  const today = year + "-" + month + "-" + day
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
  
  checkIn()//执行签到
  
  //写入消息日志
  msgSheet.Range(user.msgResult_location).Value = user.msgResult;
  msgSheet.Range(user.msgContent_location).Value = user.msgContent;
  msgSheet.Range(user.today_location).Value = today
  
  
  
  //签到函数
  function checkIn() {
    user.cookie = sheet.Range(user.cookie_location).Text;
    if (user.cookie != '') {
      let url = 'https://note.youdao.com/yws/mapi/user?method=checkin';
      let headers = {
        'cookie': user.cookie,
        'User-Agent': 'YNote',
        'Host': 'note.youdao.com'
      }
      let resp = HTTP.post(url, {}, { headers });
      if (resp.status == 200) {
        //签到成功
        resp = resp.json()
        total = resp['total'] / 1048576
        space = resp['space'] / 1048576
        addMsg(userInfo().name + ' 签到成功，本次获取 ' + space + ' M, 总共获取 ' + total + ' M')
        user.msgResult = '✅'
      } else {
        //签到失败
        addMsg('签到失败 ')
        user.msgResult = '❌'
      }
    } else {
      //未填写cookie,不处理
    }
  }
  
  function userInfo() {
    let url = 'https://note.youdao.com/yws/api/self?method=get'
    let headers = {
      'cookie': user.cookie,
      'User-Agent': 'YNote',
      'Host': 'note.youdao.com'
    }
    let resp = HTTP.get(url, { headers });
    if (resp.status == 200) {
      return resp.json()
    } else {
      console.error('获取个人信息异常')
      console.error(resp.text())
    }
  }
  
  //添加消息
  function addMsg(msg) {
    console.log(msg)
    if (user.msgContent == '') {
      user.msgContent = msg;
    } else {
      user.msgContent += '\n' + msg
    }
  }