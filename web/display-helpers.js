'use strict'
const marked = require('marked')
const emoji = require('emojilib')

function userName(ui) {
  if(!ui) return "(no user)"
  let r = ui.title ? u.title + " " : ""
  if(ui.firstName && ui.lastName) {
    return r + ui.firstName + " " + ui.lastName
  }
  if(ui.firstName) return r + ui.firstName
  if(ui.lastName) return r + ui.lastName
  return "(no name)"
}

function timeZone(ui) {
  return ui.timeZone || "GMT"
}

function smiley() {
  return anEmoji("smile")
}

function anEmoji(keyword) {
  let options = []
  for(let k in emoji.lib) {
    let c = emoji.lib[k]
    if(c.keywords.indexOf(keyword)!=-1) {
      options.push(`:${k}:`)
    }
  }
  if(!options.length) return ""
  return options[Math.floor(Math.random()*options.length)]
}

function greeting() {
  let greetings = [
    "Hi there",
    "Hello",
    "Welcome",
    "Good to see you",
    "Hi",
  ]
  if(Math.random() > 0.9) {
    return greetings[Math.floor(Math.random()*greetings.length)]
  }
  let hh = (new Date()).getHours()
  if(hh >= 6 && hh < 12) return "Good Morning"
  if(hh >= 12 && hh < 16) return "Good Afternoon"
  return "Good Evening"
}

function md(txt) {
  return marked(txt)
}

/*    outcome/
 * Find emoji shortcodes and replace them with the HTML
 * equivalents
 */
function emojify(txt) {
  let rx = /:[a-z_]*:/g
  return txt.replace(rx, sc => {
    let e = sc.substring(1, sc.length-1)
    if(!emoji.lib[e]) return sc
    return "&#" + emoji.lib[e].char.codePointAt(0) + ";"
  })
}

function isJustEmojis(txt) {
  let rx = /:[a-z_]*:/g
  txt = txt.replace(rx, "")
  return !txt.trim()
}

module.exports = {
  userName,
  greeting,
  timeZone,
  md,
  emojify,
  smiley,
  anEmoji,
  isJustEmojis,
}