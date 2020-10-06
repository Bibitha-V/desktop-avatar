'use strict'
const { ipcRenderer } = window.require('electron')
const { h } = require('@tpp/htm-x')
const req = require('@tpp/req')

const db = require('./db.js')
const logger = require('./logger.js')

import "./main.scss"

/*    understand/
 * main entry point - it all starts here
 */
function main() {
  let cont = document.getElementById("cont")
  login(cont, userinfo => {
    console.log(userinfo)
  })

  ipcRenderer.invoke("get-logname").then(name => {
    let messages = messagePane(name, cont)
    toolbar(messages, cont)
  })

}

/*    way/
 * draw the message pane and show messages
 */
function messagePane(logname, cont) {
  let messages = h('.messages')
  cont.appendChild(messages)

  let title = h(".title", "Messages")
  let closebtn = h(".btn", {
    onclick: () => messages.classList.remove("visible")
  }, "X")

  let logs = h(".logs")

  messages.c(title, closebtn, logs)

  db.get(logname, msgs => {
    msgs.forEach(msg => {
      logs.appendChild(msg_1(msg))
      logs.scrollTop = logs.scrollHeight;
      if(msg.err) {
        let cl = messages.classList
        if(!cl.contains("visible")) {
          cl.add("visible")
          setTimeout(() => cl.remove("visible"), 1000)
        }
      }
    })
  }, (err, end) => {
    if(err) console.error(err)
    if(end) return 5 * 1000
    return 500
  })

  return messages

  function msg_1(m) {
    let tm = ""
    let dt = ""
    let t = new Date(m.t)
    if(t) {
      const mons = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ]
      tm = p2(t.getHours()) + ":" + p2(t.getMinutes())
      dt = t.getDate() + "/" + mons[t.getMonth()]
    }
    let msg = m.msg || ""
    let err = m.err ? h('.padded', m.err) : ""
    return h(".log").c(
      h(".time", tm), h(".date", dt),
      h(".msg", msg), h(".err", err)
    )
  }

  function p2(v) {
    if(v < 10) return "0"+v;
    return v
  }
}

/*    way/
 * put a "settings" and "hamburger" button
 */
function toolbar(messages, cont) {
  let tb = h(".toolbar")
  let settings = h("img.settings", {
    src: "./settings.svg",
    onclick: () => ipcRenderer.invoke("show-settings")
  })
  let hamburger = h("img.hamburger", {
    src: "./hamburger.svg",
    onclick: () => messages.classList.add("visible")
  })

  cont.appendChild(tb)
  tb.c(settings, hamburger)

}

/*    way/
 * show the login page in the given container, and - after
 * login, send the details back using the callback.
 */
function login(cont, cb) {
  let form = h(".loginForm")
  cont.innerHTML = ""
  cont.appendChild(form)

  let title = h(".title", "Login")
  let inputs = h(".inputs")
  let name = h("input.name", {
    autofocus: true,
    placeholder: "Email or Username",
    onkeydown: e => {
      if(e.keyCode == 13
        || e.key == "Enter"
        || e.code == "Enter") {
        e.preventDefault()
        pw.focus()
      }
    },
  })
  let pw = h("input.name", {
    type: "password",
    placeholder: "Password",
    onkeydown: e => {
      if(e.keyCode == 13
        || e.key == "Enter"
        || e.code == "Enter") {
        e.preventDefault()
        submit_1()
      }
    },
  })

  let submit = h(".submit", {
    tabindex: 0,
    onclick: submit_1,
    onkeydown: e => {

      if(e.keyCode == 13
        || e.key == "Enter"
        || e.code == "Enter") {
        e.preventDefault()
        submit_1()
      }
      if(e.keyCode == 32
        || e.key == "Space"
        || e.code == "Space") {
        e.preventDefault()
        submit_1()
      }

    },
  },"Login")

  form.c(
    title,
    inputs.c( name, pw ),
    submit
  )


  function submit_1() {
    ipcRenderer.invoke("get-settings").then(settings => {
      if(!settings || !settings.serverURL || !settings.serverURL.trim()) {
        alert("Please set the server URL in settings")
        ipcRenderer.invoke("show-settings")
        return
      }
      let usr = name.value
      let pwd = pw.value
      if(!usr) {
        form.classList.add('err')
        name.focus()
        setTimeout(() => form.classList.remove('err'), 1000)
        return
      }
      if(!pwd) {
        form.classList.add('err')
        pw.focus()
        setTimeout(() => form.classList.remove('err'), 1000)
        return
      }
      let u = dappURL(settings.serverURL) + "/login"
      req.post(u, { usr, pwd }, (err, resp, status) => {
        if(status != 200 && !err) {
          err = `login: response status: ${status}`
          if(resp) err += " " + resp
        }
        if(err) {
          logger.err("login failed", err)
          alert("login failed")
          name.focus()
          return
        }
        console.log(resp)
      })
    })
  }

}

function dappURL(u) {
  u = u.trim()
  if(!u.startsWith("http")) {
    if(u[0] == "/") u = "http:/" + u
    else u = "http://" + u
  }
  if(!u.endsWith("/")) u += "/"
  return u + "dapp/v2"
}

main()
