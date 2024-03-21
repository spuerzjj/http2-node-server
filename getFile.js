const path = require('path')
const fs = require('fs')

const BASE_PATH = path.resolve(__dirname, './frontend')

function getAbsUrl(url) {
  return path.join(BASE_PATH, url)
}

function getFile(url) {
  try {
    const fd = fs.openSync(getAbsUrl(url), 'r')
    const stat = fs.fstatSync(fd)
    const headers = {
      //   'Cache-Control': 'no-cache',
      'cache-control': 'max-age=5',
      //   'content-length': stat.size,
      'last-modified': stat.mtime.toUTCString(),
      Server: 'zjj',
      'content-type': 'text/html; charset=utf-8'
    }

    return {
      fd,
      stat,
      headers
    }
  } catch (error) {
    return {
      fd: null
    }
  }
}

module.exports = { getFile }
