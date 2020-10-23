'use strict'

/*    understand/
 * if we have a server URL to connect to RETURN from this
 * sub-procedure otherwise let it proceed to do other
 * things (bring up the settings window / set a default)
 */
function checkServerURL({vars, store, RETURN}) {
  let serverURL = store.get("settings.serverURL")
  if(serverURL) {
    if(serverURL.endsWith("/")) {
      serverURL = serverURL.substring(0, serverURL.length)
    }
    vars.serverURL = serverURL
    return RETURN
  } else {
    return {
      chat: "I need the server URL to be set so I can connect to the server.\n\nI get all sorts of information from it. Please set the serverURL for me to proceed",
    }
  }
}

/*    way/
 * ask the main process to bring up the settings window
 */
function openSettingsWindow() {
  window.show.settings()
  return {}
}

/*    way/
 * periodically check if the user has provided us with
 * a serverURL (this will be pulled in as we poll the
 * settings logfile)
 */
function waitForServerURL(env, cb) {
  let serverURL = env.store.get("settings.serverURL")
  if(serverURL) {
    if(serverURL.endsWith("/")) {
      serverURL = serverURL.substring(0, serverURL.length-2)
    }
    env.vars.serverURL = serverURL
    cb()
  } else {
    setTimeout(() => {
      waitForServerURL(env, cb)
    }, 1000)
  }
}

module.exports = [
  checkServerURL,
  openSettingsWindow,
  waitForServerURL,
  env => env.RETURN,
]