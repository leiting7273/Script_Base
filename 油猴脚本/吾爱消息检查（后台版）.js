// ==UserScript==
// @name         吾爱消息检查（后台版）
// @namespace    https://www.52pojie.cn/
// @version      0.1.0
// @description  吾爱消息检查
// @author       lei
// @background
// @crontab      */5 * * * *
// @grant        GM_log
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @grant        GM_openInTab
// @grant        GM_cookie
// @connect      www.52pojie.cn
// ==/UserScript==

return new Promise((resolve, reject) => {

    // 获取 Cookie
    const cookieDetails = {
        domain: "www.52pojie.cn",
    };

    const requestUrl = 'https://www.52pojie.cn/plugin.php?id=noti&inajax=yes&action=checknew&type=3_3_1&h=eb04b630&time=' + new Date().getTime() + '&handlekey=getMsg&m=0&f=' + Math.random();
    GM_log('开始检查新消息')

    GM_cookie("list", { domain: cookieDetails.domain }, function(cookies) {
        // 构建 Cookie 字符串
        const allCookies = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
            if (allCookies) {
                // 发送 GET 请求
                GM_xmlhttpRequest({
                    method: "GET",
                    url: requestUrl,
                    headers: {
                        "Cookie": allCookies,
                        // Add any other headers you need
                    },
                    onload: function(response) {
                        const responseBody = response.responseText;
                        GM_log('响应结果：' + responseBody)
                        const json = parseJSONFromCDATANode(responseBody);
                        if (json && json.msg && json.msg != "") {
                            const msg = json.msg
                            console.log(msg)
                            msg.forEach(item => {
                                GM_log(item)
                                if (item.data && item.data.content) {
                                    const content = item.data.content;
                                    console.log(content)
                                    const strippedContent = removeLastLinkAndTags(content);
                                    if (strippedContent !== "") {
                                        showNotification(strippedContent);
                                    }
                                }
                            });
                        } else {
                            GM_log('无新消息')
                        }
                        resolve('检查完成');
                    },
                    onerror: function(error) {
                        reject("请求错误:", error);
                    }
                });
            } else {
                console.log("未找到指定的 Cookie");
                reject('未找到指定的 Cookie');
            }
        resolve('检查完成');
    });
});

//解析XML
function parseJSONFromCDATANode(xmlText) {
    const cdataStart = '<![CDATA[';
    const cdataEnd = ']]>';
    const cdataStartIndex = xmlText.indexOf(cdataStart);
    const cdataEndIndex = xmlText.indexOf(cdataEnd, cdataStartIndex + cdataStart.length);

    if (cdataStartIndex !== -1 && cdataEndIndex !== -1) {
        const cdataContent = xmlText.substring(cdataStartIndex + cdataStart.length, cdataEndIndex);

        try {
            return JSON.parse(cdataContent);
        } catch (error) {
            console.error("解析JSON出错:", error);
            return null;
        }
    } else {
        console.error("未找到CDATA节点");
        return null;
    }
}

//移除html元素
function removeLastLinkAndTags(html) {
    const lastLinkRegex = /<a [^>]*href=["'][^"']*["'][^>]*>[^<]*<\/a>[^<]*$/;
    const strippedContent = html.replace(lastLinkRegex, "").replace(/<[^>]*>/g, "").trim();
    return strippedContent;
}

function showNotification(message) {
    GM_notification({
        title: '52新消息',
        text: message,
        timeout: 5000,
        onclick: () => {
            // 点击通知时打开链接
            GM_openInTab('https://www.52pojie.cn', { active: true });
        }
    });
}
