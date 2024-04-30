// ==UserScript==
// @name         金山云文档数据更新
// @namespace    https://www.kdocs.cn/
// @version      0.1.0
// @description  更新阿水AI Token，AIGC+ Token
// @author       Lei
// @match        https://ai.xiabb.chat/*
// @match        https://go.aigcplus.cc/*
// @match        https://www.tishi.top/*
//// @match        https://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_log
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';
    //请填写脚本令牌和文档webhook地址
    var webhook = "";
    var scriptToken = "";

    //检测本地存储token是否更新
    // 保存原始的setItem方法
    var originalSetItem = window.localStorage.setItem;

    // 重写setItem方法
    window.localStorage.setItem = function (key, value) {
        // 输出参数的键值对到控制台
        if (key == "_token_") {
            // 获取当前网站的域名
            var domain = window.location.hostname;
            if (domain == "ai.ashuiai.com") {
                let ashui_token = JSON.parse(value)["data"]
                updataKdocs(ashui_token, "", "", "")
            // } else if (/.*\.aigcplus\..*/.test(domain)) {
            //     let aigc_token = JSON.parse(value)["data"]
            //     updataKdocs("", aigc_token, "", "")
            } else {
                log("检测到_token_更新，但不是已知网站域名：" + domain)
                log('localStorage.setItem被调用，参数key为：', key, '，参数value为：', value);
            }
        } else if (key == "token") {
            // 获取当前网站的域名
            var domain = window.location.hostname;
            if (domain == "www.tishi.top") {
                let xiaoyu_token = JSON.parse(value)
                updataKdocs("", "", xiaoyu_token, "")
            } else {
                log("检测到_token_更新，但不是已知网站域名：" + domain)
                log('localStorage.setItem被调用，参数key为：', key, '，参数value为：', value);
            }
        }else if(key == "userStore"){
            // 获取当前网站的域名
            var domain = window.location.hostname;
            if (domain == "my.aigcplus.org") {
                let aigc_token = JSON.parse(value)
                aigc_token = xiaoyu_token['auth']['token']
                updataKdocs("", aigc_token, "", "")
            } else {
                log("检测到_token_更新，但不是已知网站域名：" + domain)
                log('localStorage.setItem被调用，参数key为：', key, '，参数value为：', value);
            }
        }
        // 调用原始的setItem方法
        originalSetItem.apply(this, arguments);
    };



})();

function updataKdocs(ashui_token, aigc_token, xiaoyu_token, lingxi_token) {
    //更新token
    if (ashui_token != "") {
        let msg = "更新阿水AI token: " + ashui_token
        console.log(msg)
        showTip(msg)
    }

    if (aigc_token != "") {
        let msg = "更新AIGC+ token: " + aigc_token
        console.log(msg)
        showTip(msg)
    }

    if (xiaoyu_token != "") {
        let msg = "更新提示语AI token: " + xiaoyu_token
        console.log(msg)
        showTip(msg)
    }

    if (lingxi_token != "") {
        let msg = "更新灵犀百通 token: " + lingxi_token
        console.log(msg)
        showTip(msg)
    }

    var kdocs_webhook = GM_getValue("kdocs_webhook", "")     //文档与脚本webhook地址
    var airscript_token = GM_getValue("airscript_token", "") //脚本令牌
    if (kdocs_webhook == "" || airscript_token == "") {
        kdocs_webhook = prompt("请输入文档与脚本webhook地址：", webhook);
        GM_setValue("kdocs_webhook", kdocs_webhook);
        airscript_token = prompt("请输入脚本令牌：", scriptToken);
        GM_setValue("airscript_token", airscript_token);

        if (kdocs_webhook == "" || airscript_token == "") {
            showTip("已取消脚本执行")
            return null
        }
    }

    var data = {
        "Context": {
            "argv": {
                "ashui_token": ashui_token,
                "aigc_token": aigc_token,
                "xiaoyu_token": xiaoyu_token,
                "lingxi_token": lingxi_token,
            }
        }
    }
    GM_xmlhttpRequest({
        method: "POST",
        url: kdocs_webhook,
        anonymous: true,
        crossDomain: true,
        headers: {
            "Content-Type": "application/json",
            'AirScript-Token': airscript_token,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Origin": "",
        },
        data: JSON.stringify(data),
        onload: function (response) {
            if (response.status == 200) {
                // 发送成功
                let json = JSON.parse(response.responseText)
                let result = JSON.parse(json["data"]["logs"][2]["args"][0])
                log(result);
            } else {
                log("执行失败，请查看响应内容");
                log(response.status);
                // log(response.responseHeaders);
                log(response.responseText);
            }
            log('执行完成')
        },
        "onerror": function (error) {
            log('请求错误:' + error)
        }
    })
}

function log(str) {
    console.log(str);
    GM_log(str)
    showTip(str)
}

//悬浮窗
function showTip(text, backgroundColor= "green", autoDisappearTime= "3000") {
    var floatingTip = document.createElement('div');
    floatingTip.style.position = 'fixed';
    floatingTip.style.bottom = '20px';
    floatingTip.style.right = '20px';
    floatingTip.style.maxWidth = '300px'; // 设置最大宽度为300px
    floatingTip.style.padding = '10px';
    floatingTip.style.backgroundColor = backgroundColor;
    floatingTip.style.color = '#fff';
    floatingTip.style.borderRadius = '5px';
    floatingTip.style.boxShadow = '2px 2px 5px rgba(0, 0, 0, 0.3)';
    floatingTip.textContent = text;
    floatingTip.style.wordWrap = 'break-word'; // 文本过长时自动换行
    floatingTip.style.maxHeight = '100%'; // 高度自适应
    floatingTip.style.overflow = 'auto'; // 如果内容过长，显示滚动条
    document.body.appendChild(floatingTip);

    if (autoDisappearTime) {
        setTimeout(function() {
            floatingTip.style.opacity = '0';
            setTimeout(function() {
                document.body.removeChild(floatingTip);
            }, 1000);
        }, autoDisappearTime);
    }
}