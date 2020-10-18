'use strict'

let USERS = {}

function set(uis) {
  let users = USERS
  USERS = {}
  if(uis) {
    uis.forEach(ui => {
      USERS[ui.id] = Object.assign({ ui }, users[ui.id])
    })
  }
}

function get(id) {
  let r = USERS[id]
  if(r) r.proxy = UIPS[id]
  return r
}

let UIPS = {}
function setips(uips) {
  UIPS = {}
  if(uips) {
    uips.forEach(m => UIPS[m[0]] = m[1])
  }
}

module.exports = {
  set,
  get,
  setips,
}
