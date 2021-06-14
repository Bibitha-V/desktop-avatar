'use strict'
const dh = require('./display-helpers.js')

/*    understand/
 * react to chat messages
 */
function init(store) {
  let shown = 0
  store.react('user.msgs', msgs => {
    if(!msgs || !msgs.length) return
    if(shown > msgs.length) shown = 0
    say_1()

    function say_1() {
      if(shown >= msgs.length) return
      chat(msgs[shown++], say_1)
    }

  })
}

/*    understand/
 * add some helper messages
 */
const say = {
  foldersFailed: [
    'ERR',
    `Failed to create required data folders ${dh.anEmoji("sad")}`,
  ],

  settingsFailed: [
    `Failed to load settings - cannot start ${dh.anEmoji("sad")}`,
    `Please create a "settings.json" file under "desktop-avatar-docker-db/"`,
    `Something like this:`,
    `
{
  "serverURL": "",
  "timeout": 40000,
  "maxbrowsers": 2,
  "userips": [],
  "userList": ""
}`,
  ],

  loginFailed: [
    `Login failed ${dh.anEmoji("sad")}`
  ],

  dbFailed: [
    'ERR',
    `Failed to start db! ${dh.anEmoji("surprise")}`,
  ],
}

/*    way/
 * convert the messages to a proper function
 */
for(let k in say) {

  const msgs = Array.isArray(say[k]) ? say[k] : [say[k]]
  say[k] = (err, cb) => say_(cb, err, msgs, 0)

  /*    way/
   * chat each message to the user (converting ERR to show the error)
   */
  function say_(cb, err, msgs, ndx) {
    if(ndx >= msgs.length) {
      if(cb) cb()
      return
    }
    const msg = msgs[ndx]
    if(msg === 'ERR') {
      console.error(err)
      say_(cb, err, msgs, ndx+1)
    } else {
      if(ndx == msgs.length -1) {
        chat(msg)
        say_(cb, err, msgs, ndx+1)
      } else {
        chat(msg, () => say_(cb, err, msgs, ndx+1))
      }
    }
  }
}


/*    way/
 * show the txt (with emoji's) on the user's console,
 * using a slight (random) delay if the user has
 * a callback.
 */
function chat(msg, cb) {
  if(typeof msg === 'string') msg = { chat: msg }
  if(!msg.t) msg.t = (new Date()).toISOString()
  if(!msg.chat) return
  if(typeof msg.chat !== "string") msg.chat = JSON.stringify(msg.chat)
  if(!msg.from) msg.from = "desktop-avatar"

  const txt = dh.emojifyConsole(msg.chat)
  console.log(`${msg.from} (${msg.t}): ${txt}`)
  if(cb) setTimeout(cb, Math.random() * 1000 + 200)
}

module.exports = {
  init,
  say
}