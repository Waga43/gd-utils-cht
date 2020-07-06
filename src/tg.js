const Table = require('cli-table3')
const dayjs = require('dayjs')
const axios = require('@viegg/axios')
const HttpsProxyAgent = require('https-proxy-agent')

const { db } = require('../db')
const { gen_count_body, validate_fid, real_copy, get_name_by_id } = require('./gd')
const { AUTH, DEFAULT_TARGET } = require('../config')
const { tg_token } = AUTH
const gen_link = (fid, text) => `<a href="https://drive.google.com/drive/folders/${fid}">${text || fid}</a>`

if (!tg_token) throw new Error('Please set tg_token in config.js first)
const { https_proxy } = process.env
const axins = axios.create(https_proxy ? { httpsAgent: new HttpsProxyAgent(https_proxy) } : {})

const FID_TO_NAME = {}

async function get_folder_name (fid) {
  let name = FID_TO_NAME[fid]
  if (name) return name
  name = await get_name_by_id(fid)
  return FID_TO_NAME[fid] = name
}

module.exports = { send_count, send_help, sm, extract_fid, reply_cb_query, send_choice, send_task_info, send_all_tasks, tg_copy, extract_from_text }

function send_help (chat_id) {
  const text = `<pre>[Instructions]
***ingle file sharing is not supported***
Command | Description

/help | Back to this instruction

/count sourceID [-u] | Returns the document statistics of sourceID. sourceID can be the shared URL itself or the shared ID. If -u is added at the end of the command, the cache record is ignored and forced to be obtained online, which is suitable for sharing links that are updated after a period of time.

/copy sourceID targetID (optional) [-u] | Copy the sourceID file to targetID (a new folder will be created), if there is no targetID, it will be copied to the default location (DEFAULT_TARGET in config.js). If -u is added at the end of the command, the cache record will be ignored to force the source folder information to be obtained online. Returns the taskID of the copy task

/task taskID (optional) | Returns the progress information of the corresponding task. If taskID is not filled, the progress of all running tasks is returned. If all is filled, the list of all tasks is returned (history)
</pre>`
  return sm({ chat_id, text, parse_mode: 'HTML' })
}

function send_choice ({ fid, chat_id }) {
  return sm({
    chat_id,
    text: `Recognized to share ID ${fid}，please select an action`,
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'File Statistics', callback_data: `count ${fid}` }
        ],
        [
          { text: 'Start copying (default)', callback_data: `copy ${fid}` }
        ],
        [
          { text: 'Start copying (1)', callback_data: `copy2 ${fid}` }
        ],
        [
          { text: 'Start copying (2)'', callback_data: `copy3 ${fid}` }
        ]
      ]
    }
  })
}

async function send_all_tasks (chat_id) {
  let records = db.prepare('select id, status, ctime from task').all()
  if (!records.length) return sm({ chat_id, text: 'There are no task records in the database' })
  const tb = new Table({ style: { head: [], border: [] } })
  const headers = ['ID', 'status', 'ctime']
  records = records.map(v => {
    const { id, status, ctime } = v
    return [id, status, dayjs(ctime).format('YYYY-MM-DD HH:mm:ss')]
  })
  tb.push(headers, ...records)
  const text = tb.toString().replace(/─/g, '—')
  const url = `https://api.telegram.org/bot${tg_token}/sendMessage`
  return axins.post(url, {
    chat_id,
    parse_mode: 'HTML',
    text: `All copy tasks:\n<pre>${text}</pre>`
  }).catch(err => {
    // const description = err.response && err.response.data && err.response.data.description
    // if (description && description.includes('message is too long')) {
    if (true) {
      const text = [headers].concat(records).map(v => v.join('\t')).join('\n')
      return sm({ chat_id, parse_mode: 'HTML', text: `All copy tasks：\n<pre>${text}</pre>` })
    }
    console.error(err)
  })
}

async function get_task_info (task_id) {
  const record = db.prepare('select * from task where id=?').get(task_id)
  if (!record) return {}
  const { source, target, status, copied, mapping, ctime, ftime } = record
  const folder_mapping = mapping && mapping.trim().split('\n')
  const new_folder = folder_mapping && folder_mapping[0].split(' ')[1]
  const { summary } = db.prepare('select summary from gd where fid=?').get(source) || {}
  const { file_count, folder_count, total_size } = summary ? JSON.parse(summary) : {}
  const copied_files = copied ? copied.trim().split('\n').length : 0
  const copied_folders = folder_mapping ? (folder_mapping.length - 1) : 0
  let text = '任務ID：' + task_id + '\n'
  const folder_name = await get_folder_name(source)
  text += 'Source folder：' + gen_link(source, folder_name) + '\n'
  text += 'Destination location：' + gen_link(target) + '\n'
  text += 'New folder：' + (new_folder ? gen_link(new_folder) : 'Not yet created') + '\n'
  text += 'Task status：' + status + '\n'
  text += 'Creation time：' + dayjs(ctime).format('YYYY-MM-DD HH:mm:ss') + '\n'
  text += 'Completion time：' + (ftime ? dayjs(ftime).format('YYYY-MM-DD HH:mm:ss') : 'Unfinished') + '\n'
  var pct = copied_folders / (folder_count === undefined ? 'Unknown quantity' : folder_count)*100
  pct = pct.toFixed(2);
  text += 'Directory progress：' + copied_folders + '/' + (folder_count === undefined ? 'Unknown number' : folder_count) + ' - ' + pct + '%\n'
  pct = copied_files / (file_count === undefined ? '
Unknown quantity' : file_count)*100
  pct = pct.toFixed(2);
  text += 'File progress：' + copied_files + '/' + (file_count === undefined ? 'Unknown number' : file_count) + ' - ' + pct + '%\n'
  text += 'Total size：' + (total_size || 'Unknown size')
  const total_count = (folder_count || 0) + (file_count || 0)
  return { text, status, total_count }
}

async function send_task_info ({ task_id, chat_id }) {
  const { text, status, total_count } = await get_task_info(task_id)
  if (!text) return sm({ chat_id, text: 'There is no such task ID in database search：' + task_id })
  const url = `https://api.telegram.org/bot${tg_token}/sendMessage`
  let message_id
  try {
    const { data } = await axins.post(url, { chat_id, text, parse_mode: 'HTML' })
    message_id = data && data.result && data.result.message_id
  } catch (e) {
    console.log('fail to send message to tg', e.message)
  }
  // get_task_info is more cpu when the number of task files is too large, if it exceeds 50,000, it will not be updated every 10 seconds
  if (!message_id || status !== 'copying' || total_count > 50000) return
  const loop = setInterval(async () => {
    const url = `https://api.telegram.org/bot${tg_token}/editMessageText`
    const { text, status } = await get_task_info(task_id)
    if (status !== 'copying') clearInterval(loop)
    axins.post(url, { chat_id, message_id, text, parse_mode: 'HTML' }).catch(e => console.error(e.message))
  }, 10 * 1000)
}

async function tg_copy ({ fid, target, chat_id, update }) { // return task_id
  target = target || DEFAULT_TARGET
  if (!target) {
    sm({ chat_id, text: 'Please enter the destination ID or set the default copy destination ID in config.js(DEFAULT_TARGET)'  })
    return
  }

  let record = db.prepare('select id, status from task where source=? and target=?').get(fid, target)
  if (record) {
    if (record.status === 'copying') {
      sm({ chat_id, text: 'A task with the same source ID and destination ID is already in progress, query progress can be entered /task ' + record.id })
      return
    } else if (record.status === 'finished') {
      sm({ chat_id, text: `detected an existing task ${record.id}，and started  copying` })
    }
  }

  real_copy({ source: fid, update, target, not_teamdrive: true, service_account: true, is_server: true })
    .then(async info => {
      if (!record) record = {} // prevent infinite loop
      if (!info) return
      const { task_id } = info
      const row = db.prepare('select * from task where id=?').get(task_id)
      const { source, target, status, copied, mapping, ctime, ftime } = row
      const { summary } = db.prepare('select summary from gd where fid=?').get(source) || {}
      const { file_count, folder_count, total_size } = summary ? JSON.parse(summary) : {}
      const copied_files = copied ? copied.trim().split('\n').length : 0
      const copied_folders = mapping ? (mapping.trim().split('\n').length - 1) : 0

      let text = `Task  ${task_id} completed\n`
      const name = await get_folder_name(source)
      text += 'Source folder：' + gen_link(source, name) + '\n'
      text += 'Number of completed directories:' + copied_folders + '/' + folder_count + '\n'
      text += 'Number of completed files：' + copied_files + '/' + file_count + '\n'
      text += 'Total size：' + (total_size || 'Unknown size') + '\n'
      sm({ chat_id, text, parse_mode: 'HTML' })
    })
    .catch(err => {
      if (!record) record = {}
      console.error('Copy failed' , fid, '-->', target)
      console.error(err)
      sm({ chat_id, text: 'Copy failed, failed message：' + err.message })
    })

  while (!record) {
    record = db.prepare('select id from task where source=? and target=?').get(fid, target)
    await sleep(1000)
  }
  return record.id
}

function sleep (ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })
}

function reply_cb_query ({ id, data }) {
  const url = `https://api.telegram.org/bot${tg_token}/answerCallbackQuery`
  return axins.post(url, {
    callback_query_id: id,
    text: 'Start execution'  + data
  })
}

async function send_count ({ fid, chat_id, update }) {
  const table = await gen_count_body({ fid, update, type: 'tg', service_account: true })
  if (!table) return sm({ chat_id, parse_mode: 'HTML', text: gen_link(fid) + ' 資訊獲取失敗' })
  const url = `https://api.telegram.org/bot${tg_token}/sendMessage`
  const gd_link = `https://drive.google.com/drive/folders/${fid}`
  const name = await get_folder_name(fid)
  return axins.post(url, {
    chat_id,
    parse_mode: 'HTML',
    text: `<pre>source folder name：${name}
Source link: ${gd_link}
${table}</pre>`
  }).catch(async err => {
    // const description = err.response && err.response.data && err.response.data.description
    // const too_long_msgs = ['request entity too large', 'message is too long']
    // if (description && too_long_msgs.some(v => description.toLowerCase().includes(v))) {
    if (true) {
      const smy = await gen_count_body({ fid, type: 'json', service_account: true })
      const { file_count, folder_count, total_size } = JSON.parse(smy)
      return sm({
        chat_id,
        parse_mode: 'HTML',
        text: `link：<a href="https://drive.google.com/drive/folders/${fid}">${fid}</a>\n<pre>
The form is too long and exceeds the telegram message limit. Only the summary is displayed:
Directory name：${name}
Total files：${file_count}
Total number of directories：${folder_count}
Total size：${total_size}
</pre>`
      })
    }
    throw err
  })
}

function sm (data) {
  const url = `https://api.telegram.org/bot${tg_token}/sendMessage`
  return axins.post(url, data).catch(err => {
    // console.error('fail to post', url, data)
    console.error('fail to send message to tg:', err.message)
  })
}

function extract_fid (text) {
  text = text.replace(/^\/count/, '').replace(/^\/copy/, '').replace(/\\/g, '').trim()
  const [source, target] = text.split(' ').map(v => v.trim())
  if (validate_fid(source)) return source
  try {
    if (!text.startsWith('http')) text = 'https://' + text
    const u = new URL(text)
    if (u.pathname.includes('/folders/')) {
      const reg = /[^\/?]+$/
      const match = u.pathname.match(reg)
      return match && match[0]
    }
    return u.searchParams.get('id')
  } catch (e) {
    return ''
  }
}

function extract_from_text (text) {
  const reg = /https?:\/\/drive.google.com\/[^\s]+/g
  const m = text.match(reg)
  return m && extract_fid(m[0])
}
