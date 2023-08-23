// ==UserScript==
// @name         吾爱消息检查
// @namespace    https://www.52pojie.cn/
// @version      0.1.0
// @description  吾爱消息检查，每5分钟检查一次
// @author       lei
// @background
// @crontab      */5 * * * *
// @grant        GM_log
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_cookie
// @connect      www.52pojie.cn
// ==/UserScript==

return new Promise((resolve, reject) => {
    const myDate = new Date()

    //获取Cookie
    GM_cookie("list", { domain: "www.52pojie.cn" }, (cookies, error) => {
        if (!error) {
            // 步骤 3: 使用GM_xmlhttpRequest发送请求到plugin.php
            const requestUrl = 'https://www.52pojie.cn/plugin.php?id=noti&inajax=yes&action=checknew&type=3_3_1&h=eb04b630&time=' + myDate.getTime() + '&handlekey=getMsg&m=0&f=' + Math.random();

            // 构造请求头
            const headers = {
                "Cookie": cookies.map(cookie => `${cookie.name}=${cookie.value}`).join("; ")
            };

            // 发送请求
            GM_xmlhttpRequest({
                method: "GET",
                url: requestUrl,
                headers: headers,
                onload: function (response) {
                    const responseBody = response.response;
                    // 处理响应
                    const json = parseJSONFromCDATANode(responseBody)
                    GM_log('吾爱新响应：' + response.responseText);
                    if (json.msg != '') {
                        sendNotification(msg);
                    }
                    resolve("ok");
                },
                onerror: function (error) {
                    reject("请求错误:", error);
                }
            });
        }
    });

});

// 在脚本猫后台脚本中使用浏览器通知 API 发送通知
    function sendNotification(message) {
        // 检查浏览器是否支持通知
        if ('Notification' in window) {
            // 请求通知权限
            Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                // 创建通知
                const notification = new Notification('新消息', {
                body: message,
                icon: 'https://img1.baidu.com/it/u=3501036957,3997158055&fm=253&fmt=auto&app=138&f=JPEG?w=256&h=256' // 设置通知图标
                });
            }
            });
        }
    }

//提取XML中的JSON
function parseJSONFromCDATANode(xmlText) {
    // 提取CDATA节点内容
    const cdataStart = '<![CDATA[';
    const cdataEnd = ']]>';
    const cdataStartIndex = xmlText.indexOf(cdataStart);
    const cdataEndIndex = xmlText.indexOf(cdataEnd, cdataStartIndex + cdataStart.length);

    if (cdataStartIndex !== -1 && cdataEndIndex !== -1) {
        const cdataContent = xmlText.substring(cdataStartIndex + cdataStart.length, cdataEndIndex);

        try {
            // 解析JSON
            const json = JSON.parse(cdataContent);
            return json;
        } catch (error) {
            console.error("解析JSON出错:", error);
            return null;
        }
    } else {
        console.error("未找到CDATA节点");
        return null;
    }
}