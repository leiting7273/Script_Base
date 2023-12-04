var user = {
    row: null,
    uid: null,
    uname: null,
    pwd: null,
    login_token: null,
    msgRes: '',
    msgContent: '',
    checkNum: 0,
    totalValue: 0,
    availableValue: 0
  }
  
  const sheet = Application.Sheets('其它');
  const msgSheet = Application.Sheets('【通知消息】');
  if (!(sheet && msgSheet)) {
    throw new Error('工作表不完整，请检查')
  }
  
  //获取登录token
  user.login_token = sheet.Range('C2').Text
  if(user.login_token=='') return
  
  //签到请求
  let url = 'https://api.xiabb.chat/chatapi/marketing/signin'
  let auth = 'Bearer ' + user.login_token
  let resp = HTTP.post(url, {}, {
    headers: {
      'Accept':'application/json, text/plain, */*',
      'Authorization': auth,
      'Content-Type':'application/json',
      'Referer':'https://ai.xiabb.chat/',
      'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    }
  })
  
  if (resp.status != 200) {
  
    console.error('签到请求发生异常，状态码：', resp.status)
    console.error('签到请求发生异常，响应：', resp.text)
  
  } else {
    let json = resp.json()
    if (json.code != 200 && json.code != 400) {
  
      if (json.code == 401) {
        user.msgRes = '❌'
  
        addMsg('登录token过期，请重新登录')
      } else {
        user.msgRes = '❓'
  
        console.log('签到请求响应异常，code：', json.code)
        addMsg('签到请求响应异常：' + json.message)
      }
  
    } else {
  
      user.msgRes = '✅'
  
      if (json.code == 200) {
        user.checkNum = json.result
        addMsg('签到成功,连续签到 ' + user.checkNum + '+天')
      } else {
        addMsg(json.message)
      }
  
      getInfo() //更新信息
      addMsg('用户：' + user.uname)
  
      let perc = user.availableValue * 100 / user.totalValue
      addMsg('对话余额：' + perc.toFixed(1) + '%(' + user.availableValue + '/' + user.totalValue + ')')
    }
  }
  
  const now = new Date()
  msgSheet.Range('B6').Value = user.msgRes
  msgSheet.Range('C6').Value = user.msgContent
  msgSheet.Range('D6').Value = now.getFullYear() + '-' + (now.getMonth() + 1).toString().padStart(2, '0') + '-' + now.getDate().toString().padStart(2, '0');
  
  
  //获取用户信息
  function getInfo() {
    let url = 'https://api.xiabb.chat/chatapi/auth/memberInfo'
    let auth = 'Bearer ' + user.login_token
    let resp = HTTP.get(url, { headers: { 'Authorization': auth } })
    if (resp.status != 200) {
      console.error('获取信息请求发生异常，状态码：', resp.status)
      console.error('获取信息请求发生异常，响应：', resp.text)
    } else {
      let info = resp.json()
      user.uname = info.result.nickName
      user.totalValue = info.result.wallets[1].totalValue
      user.availableValue = info.result.wallets[1].availableValue
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