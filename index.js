/**
 * @desc
 * @Author: bitqiang<bitqiang@outlook.net>
 * @date  2020/3/15 19:38
 */
const execa = require('execa')
const commit = execa.sync('git', ['rev-parse', 'HEAD']).stdout
const https = require("https");
class BasicPlugin {
  constructor(data={}) {
    this.type = data.type || 'network';
    let getNetworkTimeConfig = data.type || {};
    this.getNetworkTimeConfig = Object.assign(
      {},
      { url: "", cb: "", keyPath: "" },
      getNetworkTimeConfig
    );
  }

  apply(compiler) {
    const that = this;
    compiler.plugin("emit", async function(compilation, callback) {
      let time;
      // let data =  execa.sync('git', ['show', `${commit}`]).stdout
      // let data1 =  execa.sync('git', ['log', `${commit}`]).stdout
      // console.log('data1', data1)
      try {
        if (that.type === "network") {
          time = await getTime(that.getNetworkTimeConfig);
        }
      } catch (e) {
        console.warn("获取网络时间失败", e);
      }

      let versionInfo = "";
      try {
        const packageInfo = require(`${compilation.options.context}/package.json`);
        versionInfo = `版本号：${packageInfo.version}；`;
      } catch (e) {
        console.warn("e", e);
      }
      
      const now = format("yyyy-MM-dd hh:mm:ss", time);
      const result = `
      (function() {
        console.log("构建${
          time ? "【网络】" : "【本地】"
        }时间：${now}；${versionInfo || ""}git commit id：${commit}")
      })();
      `;
      const { publicPath } = compilation.outputOptions;
      const resultFileName = `js/${Date.now()}build-log.js`;
      const resultPath = publicPath
        ? `${publicPath}/${resultFileName}`
        : resultFileName;
      compilation.assets[resultFileName] = {
        source: function() {
          return result;
        },
        size: function() {
          return result.length;
        }
      };

      const assets = compilation.assets;
      for (var filename in assets) {
        // console.log("assets", assets);
        const suffix = getFileSuffix(filename);
        if (suffix === "html") {
          const asset = assets[filename];
          const content = asset.source();
          const ne1w = content.replace(
            '<head>',
            `<head>  <script type="text/javascript" src="${resultPath}"></script>`
          );
          compilation.assets[filename] = {
            source: function() {
              return ne1w;
            },
            size: function() {
              return ne1w.length;
            }
          };
        }
      }
      callback();
    });
  }
}

async function getTime({ url, cb, keyPath }) {
  if (!url) {
    const res = await sendHttp(
      "https://gitee.com/bitqiang2016/dataWarehouse/raw/master/webpack-show-version/data.js"
    );
    url = res.data.url;
    cb = res.data.cb;
    keyPath = res.data.keyPath;
  }
  const time = await sendHttp(url);
  // console.log("获取网络时间地址", url, time);
  if (cb) {
    return cb(time);
  } else {
    const path = keyPath.split(".");
    let result = time;
    path.forEach(item => (result = result[item]));
    // 小于这个说明是秒单位，需要乘以1000
    if (result < 158427165900) {
      result *= 1000;
    }
    return result;
  }
}

function sendHttp(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, res => {
        // console.log('状态码:', res.statusCode)
        // console.log('请求头:', res.headers)

        res.on("data", d => {
          // process.stdout.write(d)
          resolve(JSON.parse(d.toString()));
        });
      })
      .on("error", e => {
        reject(e);
        console.error(e);
      });
  });
}

function format(fmt, time = Date.now()) {
  const date = new Date(parseInt(time));
  var o = {
    "M+": date.getMonth() + 1, // 月份
    "d+": date.getDate(), // 日
    "h+": date.getHours(), // 小时
    "m+": date.getMinutes(), // 分
    "s+": date.getSeconds(), // 秒
    "q+": Math.floor((date.getMonth() + 3) / 3), // 季度
    S: date.getMilliseconds() // 毫秒
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(
      RegExp.$1,
      (date.getFullYear() + "").substr(4 - RegExp.$1.length)
    );
  }
  for (var k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length)
      );
    }
  }
  return fmt;
}


function getFileSuffix(filename) {
  const fileArr = filename.split(".");
  return fileArr[fileArr.length - 1];
}

module.exports = BasicPlugin;
