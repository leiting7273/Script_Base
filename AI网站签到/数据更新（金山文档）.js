// 需脚本令牌调用此脚本

const sheet = Application.Sheets('其它');
const ashui = sheet.Range("C2");
const aigc = sheet.Range("C5");
const xiaoyu = sheet.Range("C7");
// const lingxi = sheet.Range("C9");

var res = {
  ashui: "",
  aigc: "",
  xiaoyu: "",
  // lingxi:""
}

if (Context.argv.ashui_token) { //更新阿水AI的token
  ashui.Value = Context.argv.ashui_token
  res.ashui = ashui.Text
}

if (Context.argv.aigc_token) {  //更新AIGC+的token
  aigc.Value = Context.argv.aigc_token
  res.aigc = aigc.Text
}

if (Context.argv.xiaoyu_token) {  //更新AIGC+的token
  xiaoyu.Value = Context.argv.xiaoyu_token
  res.xiaoyu = xiaoyu.Text
}

// if (Context.argv.lingxi_token) { 
//   lingxi.Value = Context.argv.lingxi_token
//   res.lingxi = lingxi.Text
// }

console.log(res)
