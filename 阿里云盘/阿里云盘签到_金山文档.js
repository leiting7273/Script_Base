const aliSheet = Application.Sheets("阿里云盘") //阿里云盘工作表
const emailSheet = Application.Sheets("发信邮箱配置") //发信邮箱配置工作表
// const aliUsedRowEnd = aliSheet.UsedRange.RowEnd //用户使用表格的最后一行
// const endRow = getEndRow()  //END标行号

const currentDate = new Date()
const data_time = currentDate.toLocaleDateString() //当前时间
const currentDay = currentDate.getDate(); // 获取当前日期的天数
const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate(); // 获取当月的最后一天的日期

//遍历签到
function signIn() {
  let aliToken  //refresh_token
  let isSignIn  //是否签到
  let isGetRewards //是否领取奖励
  let isSendEmail //是否发送邮箱签到提醒
  let recEmail  //接收邮箱地址
  let isSendWeChat  //是否发送微信公众号签到提醒
  let pushToken //pushplus_token

  for (let row = 2; "" != (isSignIn = aliSheet.Range("E" + row).Text); row++) {
    aliToken = aliSheet.Range("A" + row).Text
    // isSignIn = aliSheet.Range("E" + row).Text
    isGetRewards = aliSheet.Range("G" + row).Text
    isSendEmail = aliSheet.Range("I" + row).Text
    recEmail = aliSheet.Range("L" + row).Text
    isSendWeChat = aliSheet.Range("O" + row).Text
    pushToken = aliSheet.Range("R" + row).Text

    if (isSignIn == "是" && aliToken != "") {
      let logMessage = ""
      let rewardMessage = ""
      let resp = HTTP.post("https://auth.aliyundrive.com/v2/account/token",
        JSON.stringify({
          "grant_type": "refresh_token",
          "refresh_token": aliToken
        })
      )
      if (resp.status !== 200) { throw new Error("fetch err! status is " + resp.status()) }//服务器响应错误
      let data = resp.json() // 将响应数据解析为 JSON 格式
      let access_token = data['access_token']; // 获取访问令牌
      let phone = data["user_name"]; // 获取用户名

      if (access_token == undefined) { // 如果访问令牌未定义
        console.log("单元格【A" + row + "】内的token值错误，程序执行失败，请重新复制正确的token值")
        continue // 跳过当前行的后续操作
      }

      try {
        let access_token2 = 'Bearer ' + access_token  // 构建包含访问令牌的请求头
        //签到
        let data2 = HTTP.post("https://member.aliyundrive.com/v1/activity/sign_in_list",
          JSON.stringify({ "_rx-s": "mobile" }),
          { headers: { "Authorization": access_token2 } }
        )
        if (data2.status !== 200) { throw new Error("fetch err! status is " + resp.status()) }//服务器响应错误
        data2 = data2.json(); // 将响应数据解析为 JSON 格式
        let signin_count = data2['result']['signInCount']; // 获取签到次数
        logMessage = "账号：" + phone + " - 签到成功，本月累计签到 " + signin_count + " 天"

        if (isGetRewards == "是") {
          try {// 领取奖励
            let data3 = HTTP.post(
              "https://member.aliyundrive.com/v1/activity/sign_in_reward?_rx-s=mobile",
              JSON.stringify({ "signInDay": signin_count }),
              { headers: { "Authorization": access_token2 } }
            );
            data3 = data3.json(); // 将响应数据解析为 JSON 格式
            let rewardName = data3["result"]["name"]; // 获取奖励名称
            let rewardDescription = data3["result"]["description"]; // 获取奖励描述
            rewardMessage = " " + rewardName + " - " + rewardDescription;
          } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
              let errorMessage = error.response.data.error; // 获取错误信息
              if (errorMessage.includes(" - 今天奖励已领取")) {
                rewardMessage = " - 今天奖励已领取";
                console.log("账号：" + phone + " - " + rewardMessage);
              } else {
                console.log("账号：" + phone + " - 奖励领取失败：" + errorMessage);
              }
            } else {
              console.log("账号：" + phone + " - 奖励领取失败");
            }
          }
        } else { rewardMessage = " - 奖励待领取" }

        //领取月末奖励
        if (currentDay === lastDayOfMonth) {
          // 发起网络请求-获取token
          let data = HTTP.post("https://auth.aliyundrive.com/v2/account/token",
            JSON.stringify({
              "grant_type": "refresh_token",
              "refresh_token": aliToken
            })
          );
          data = data.json(); // 将响应数据解析为 JSON 格式
          let access_token1 = data['access_token']; // 获取访问令牌

          if (access_token1 === undefined) { // 如果访问令牌未定义
            console.log("单元格【A" + row + "】内的token值错误，程序执行失败，请重新复制正确的token值");
            continue; // 跳过当前行的后续操作
          }

          try {
            let access_token3 = 'Bearer ' + access_token1; // 构建包含访问令牌的请求头
            // 领取奖励
            let data4 = HTTP.post(
              "https://member.aliyundrive.com/v1/activity/sign_in_reward?_rx-s=mobile",
              JSON.stringify({ "signInDay": lastDayOfMonth }),
              { headers: { "Authorization": access_token3 } }
            );
            data4 = data4.json(); // 将响应数据解析为 JSON 格式
            var claimStatus = data4["result"]["status"]; // 获取奖励状态
            var day = lastDayOfMonth; // 获取最后一天的日期

            if (claimStatus === "CLAIMED") {
              console.log("账号：" + phone + " - 第 " + day + " 天奖励领取成功");
            } else {
              console.log("账号：" + phone + " - 第 " + day + " 天奖励领取失败");
            }
          } catch {
            console.log("单元格【A" + row + "】内的token签到失败");
            continue; // 跳过当前行的后续操作
          }
        }

        console.log(logMessage + rewardMessage)

        //微信通知
        if (isSendWeChat == "是") {
          let result = sendWeChat(pushToken,
            "阿里云盘签到通知 - " + data_time,
            logMessage + rewardMessage
          )
          if (result.code != 200) {
            console.log("签到结果推送至微信失败: " + result.msg)
          } else {
            console.log("签到结果已推送至微信");
            // console.log(result);
          }
        }

        //邮箱通知
        if (isSendEmail == "是") {
          try {
            sendEmail(recEmail, logMessage + rewardMessage)
          } catch (error) {
            console.log("账号：" + phone + " - 发送邮件失败：" + error)
          }
        }
      } catch {
        console.log("单元格【A" + row + "】内的token签到失败");
        continue; // 跳过当前行的后续操作
      }
    }
  }
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
function sendEmail(recEmail, message) {
  const sHost = emailSheet.Range("B1").Text  //发件箱host
  const sPort = parseInt(emailSheet.Range("B2").Text)  //发件箱port
  const sEmail = emailSheet.Range("B3").Text  //发件箱
  const sPwd = emailSheet.Range("B4").Text  //发件箱SMTP授权码

  let mailer = SMTP.login({
    host: sHost,
    port: sPort,
    username: sEmail,
    password: sPwd,
    secure: true
  });
  mailer.send({
    from: "阿里云盘签到<" + sEmail + ">",
    to: recEmail,
    subject: "阿里云盘签到通知 - " + data_time,
    text: message
  });
}

//获取END标行号
// function getEndRow() {
//   for (let row = 3; row < aliUsedRowEnd; row++) {
//     if (aliSheet.Range("A" + row).Text == "END") return row
//   }
//   console.error("END标缺失！")
//   return 7
// }


//执行签到
if (hasSheet(aliSheet) && hasSheet(emailSheet))
  signIn()
else console.error("工作表缺失！")

//验证工作表是否存在，返回bool
function hasSheet(sheet) { return sheet != null }