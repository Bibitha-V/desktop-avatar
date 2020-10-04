'use strict'
const db = require('./db.js')

/*    understand/
 * We need a logfile to hold the messages of our current
 * run without interfering with other concurrent runs
 */
const LOG = `log-${(new Date()).toISOString()}-${process.pid}`

function name() { return LOG }

function msg(o) { db.put(o, LOG) }

function log(msg) {
  if(typeof msg == "string") msg = { msg }
  msg.t = (new Date()).toISOString()
  db.put(msg, LOG)
}

function err(msg, e) {
  if(typeof msg == "string") {
    if(!e) msg = { err: msg}
    else msg = { msg }
  }
  if(e) msg.err = e.stack ? e.stack : e.toString()
  msg.t = (new Date()).toISOString()
  db.put(msg, LOG)
}

function get(cb) {
  db.get(LOG, cb, (err, end) => {
    if(err) console.log(err)
    if(end) return 5 * 1000
    return 500
  })
}

module.exports = {
  name,
  log,
  err,
  msg,
  get,
}
