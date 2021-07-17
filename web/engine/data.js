'use strict'
const kc = require('../../kafclient.js')
const chat = require('./chat.js')
const ww = require('./ww.js')

/*    understand/
 * the processed data
 */
const DB = {}

/*    way/
 * get the user data or the entire db
 */
function get(user) {
  if(!user) return DB
  else return DB[user.id]
}

/*    way/
 * start the data gathering process for each user
 */
function start(log, store, cb) {
  const users = store.getUsers()
  start_1(0)

  function start_1(ndx) {
    if(ndx >= users.length) return cb()
    startUserDB(users[ndx], log, store, () => start_1(ndx+1))
  }
}

/*    way/
 * connect and fetch all the existing data for the user,
 * then continue running to update data as the app runs
 */
function startUserDB(user, log, store, cb) {
  if(DB[user.id]) return

  const tasks = {}
  DB[user.id] = tasks

  const name = `User-${user.id}`
  log(`trace/engine/db/${name}`, "starting")
  const ctrl = kc.get(name, resp => {
    for(let i = 0;i < resp.length;i++) {
      if(!process(resp[i], tasks, log, store)) {
        ERR(name, resp[i], log, store)
        ctrl.stop = true
        return
      }
    }
  }, (err, end, from) => {
    if(err) return ERR(name, err, log, store)
    if(!end) return 10
    run(from, user, log, store)
    cb()
  })

}

/*    way/
 * periodically get data and process it
 */
function run(from, user, log, store) {
  const tasks = DB[user.id]
  const name = `User-${user.id}`
  log(`trace/engine/db/${name}`, "running")
  kc.get(name, resp => {
    resp.map(rec => process(rec, tasks, log, store))
  }, err => {
    if(err) return ERR(name, err, log, store)
    return 500 + (Math.random() * 1500)
  }, from)
}

/*    way/
 * process new tasks and their status updates
 */
function process(rec, tasks, log, store) {
  if(rec.e === "task/new") return new_task_1(rec)
  if(rec.e === "task/status") return task_status_1(rec)

  /*    way/
   * get the existing corresponding task that was inserted
   * into the task list, creating a new one if requested
   */
  function nsert_1(task, create) {
    const id = task.data && task.data.id
    if(!id) {
      log('err/db/task/noid', task)
      return
    }
    const ex = tasks[id]
    if(!ex && create) {
      const inserted = {
        got: 0,
        beg: 0,
        fin: 0,
        sent: 0,
        last: "new",
        steps: [ task ],
      }
      tasks[id] = inserted
      return inserted
    }
    ex.steps.push(task)
    return ex
  }

  /*    way/
   * process the various task statuses, updating the task
   * fields and last status
   */
  function task_status_1(task) {
    const code = task.data && task.data.code
    if(!code && code !== 0) {
      log('err/db/task/nocode', task)
      return
    }
    switch(code) {
      case 102: return task_updt_status_1("beg", "started", task)
      case 200: return task_updt_status_1("fin", "successful", task)
      case 202: return task_updt_status_1("sent", "closed", task)
      case 400: return task_updt_status_1("fin", "failed/bad-task", task)
      case 401: return task_updt_status_1("fin", "failed/captcha", task)
      case 403: return task_updt_status_1("fin", "failed/bad-user", task)
      case 424: return task_updt_status_1("fin", "failed/update-needed", task)
      case 429: return task_updt_status_1("fin", "failed/daily-limit", task)
      case 500: return task_updt_status_1("fin", "failed/error", task)
      case 501: return task_updt_status_1("fin", "failed/no-plugin", task)
      case 504: return task_updt_status_1("fin", "failed/timeout", task)
    }
    const msg = task.data && task.data.msg
    if(msg === "task/retry") return task_updt_status_1("got", "retry", task)
  }

  function task_updt_status_1(k, msg, task) {
    const inserted = nsert_1(task)
    if(!inserted) {
      log('err/db/task/missing', task)
      return
    }
    inserted.last = msg
    const t = tt_1(task)
    if(inserted[k] < t) inserted[k] = t
    store.event("status/add", task.data)
    return true
  }

  /*    way/
   * if this is a new task, save it against the lead, otherwise just
   * update the time at which we got it to the latest
   */
  function new_task_1(task) {
    const inserted = nsert_1(task, true)
    const t = tt_1(task)
    if(inserted.got < t) inserted.got = t
    store.event("task/add", task.data)
    return true
  }

  function tt_1(task) {
    return (new Date(task.t)).getTime()
  }
}

/*    understand/
 * helper function to print out the DB in a readable format
 */
function dbStr() {
  return JSON.stringify(DB, (k,v) => {
    if(k === "steps") return v.map(v => JSON.stringify(v).replace(/"/g, ""))
    if(["got", "beg", "fin", "sent"].indexOf(k) !== -1) {
      if(v) return (new Date(v)).toISOString()
    }
    return v
  }, 2)
}

/*    way/
 * log the error message, inform the user, then exit/crash
 */
function ERR(name, msg, log, store) {
  log("err/engine/db/start", msg)
  chat.say(store, `**DATA ERROR**!
Please check the data file:
    ${name}
for errors.

More details should be available in the log file: ${log.getName()}

`, () => ww.x.it())
}

module.exports = {
  start,
  dbStr,

  get,
}
