# webpack-show-version-plugin

## 用途

用于构建后在控制台显示构建信息的 webpack 插件

## 用法

#### 在 webpack plugins 引入此插件如

```javascript
module.exports = {
  configureWebpack: {
    plugins: [
      new WebpackShowVersionPlugin()
    ]
  }
}
```


#### 自定义网络时间请求地址 或者使用本地时间

```javascript
const WebpackShowVersionPlugin = require("webpack-show-version-plugin");

new WebpackShowVersionPlugin({
  type: "local", // 支持 network(默认)、local

  // 网络获取时间如果需要自定义从某个api获取时间可以通过如下参数传递
  getNetworkTimeConfig: {
    url: "", // 仅支持get的简单请求
    keyPath: "result.timestamp", // 获取的到response的时间戳的键路径
    cb: "" // 如果需要自己处理，可以传入一个callback,进行处理，优先使用callback,将不会使用keyPath进行处理
  }
});
```
