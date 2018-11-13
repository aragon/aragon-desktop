const jsonStorage = require('electron-json-storage')

async function get (key) {
  return new Promise((resolve) => (
    jsonStorage.get(key, (_, data) => resolve(data))
  ))
}

async function set (key, json) {
  return new Promise((resolve) => (
    jsonStorage.set(key, json, resolve)
  ))
}

async function remove (key) {
  return new Promise((resolve) => (
    jsonStorage.remove(key, resolve)
  ))
}

async function has (key) {
  return new Promise((resolve) => (
    jsonStorage.has(key, (_, data) => resolve(data))
  ))
}

async function keys () {
  return new Promise((resolve) => (
    jsonStorage.keys((_, data) => resolve(data))
  ))
}

module.exports = { get, set, remove, has, keys }