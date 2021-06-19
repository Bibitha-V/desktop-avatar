'use strict'
const bdb = require('baby-db')

const TASKS = {}
let maxid = 0
let ondone_

const taskdb = bdb('tasks.json')
taskdb.on('error', err => console.error(err))
taskdb.on('rec', rec => {
  if(!rec.id) throw `Missing id ${JSON.stringify(rec)}`
  if(!rec.action) throw `Missing action: ${JSON.stringify(rec)}`
  if(!rec.userid) throw `Missing user: ${JSON.stringify(rec)}`
  if(rec.id > maxid) maxid = rec.id
  if(TASKS[rec.id]) Object.assign(TASKS[rec.id], rec)
  else TASKS[rec.id] = rec
})
taskdb.on('done', () => {
  console.log('Task DB loaded...')
  ondone_ && ondone_()
})

function add(task) {
  task.id = ++maxid
  taskdb.add(task)
}

function getUserTasks(userid) {
  return TASKS.filter(t => t.userid == userid)
}

module.exports = {
  add,
  getUserTasks,
  ondone: cb => ondone_ = cb,
}
