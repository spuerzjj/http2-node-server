const http2 = require('http2')
const fs = require('fs')

const { getFile } = require('./getFile')

// 1. 创建服务，需要用到openssl生成的两个秘钥文件
const server = http2.createSecureServer(
  {
    key: fs.readFileSync('./localhost-privkey.pem'),
    cert: fs.readFileSync('./localhost-cert.pem')
  },
  onRequest
)

/**
 *
 * @param {http2.Http2ServerRequest} request
 * @param {http2.Http2ServerResponse} response
 */
function onRequest(request, response) {
  const reqPath = request.url === '/' ? '/index.html' : request.url
  // client允许推消息
  if (reqPath === '/index.html' && response.stream.pushAllowed) {
    // 推送a.js的内容
    response.stream.pushStream(
      { ':path': '/a.js' },
      (err, pushStream, headers) => {
        if (err) {
          throw err
        } else {
          pushStream.respond({ ':status': 200 })
          pushStream.end('console.log(123)')
        }
      }
    )
  }

  // 返回index.html的内容
  const file = getFile(reqPath)

  if (file.fd) {
    response.stream.on('close', () => {
      fs.closeSync(file.fd)
    })

    // 协商缓存 比较last-modified，一致直接返回304告诉客户端自己去读缓存吧
    if (
      request.headers['if-modified-since'] === file.stat.mtime.toUTCString()
    ) {
      response.stream.respond({ ':status': 304 })
      response.stream.end()
    } else {
      // 不一致说明文件变了， 返回文件内容
      response.stream.respondWithFD(file.fd, file.headers)
    }
  } else {
    response.stream.respond({ ':status': 404 })
    response.stream.end('404')
  }
}

// 2. 启动服务
server.listen(8443, err => {
  if (err) {
    console.error(err)
    return
  }
  console.log(`Server listening on 8443`)
})
