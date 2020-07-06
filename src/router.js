const Router = require('@koa/router')

const { db } = require('../db')
const { validate_fid, gen_count_body } = require('./gd')
const { send_count, send_help, send_choice, send_task_info, sm, extract_fid, extract_from_text, reply_cb_query, tg_copy, send_all_tasks } = require('./tg')

const { AUTH, ROUTER_PASSKEY, TG_IPLIST, COPY_TARGET2, COPY_TARGET3 } = require('../config')
const { tg_whitelist } = AUTH

const counting = {}
const router = new Router()

router.get('/api/gdurl/count', async ctx => {
  if (!ROUTER_PASSKEY) return ctx.body = 'gd-utils started successfully'
  const { query, headers } = ctx.request
  let { fid, type, update, passkey } = query
  if (passkey !== ROUTER_PASSKEY) return ctx.body = 'invalid passkey'
  if (!validate_fid(fid)) throw new Error('Invalid share ID')

  let ua = headers['user-agent'] || ''
  ua = ua.toLowerCase()
  type = (type || '').toLowerCase()
  // todo type=tree
  if (!type) {
    if (ua.includes('curl')) {
      type = 'curl'
    } else if (ua.includes('mozilla')) {
      type = 'html'
    } else {
      type = 'json'
    }
  }
  if (type === 'html') {
    ctx.set('Content-Type', 'text/html; charset=utf-8')
  } else if (['json', 'all'].includes(type)) {
    ctx.set('Content-Type', 'application/json; charset=UTF-8')
  }
  ctx.body = await gen_count_body({ fid, type, update, service_account: true })
})

router.post('/api/gdurl/tgbot', async ctx => {
  const { body } = ctx.request
  console.log('ctx.ip', ctx.ip) //  You can only allow the IP of the tg server
  console.log('tg message:', body)
  if (TG_IPLIST && !TG_IPLIST.includes(ctx.ip)) return ctx.body = 'invalid ip'
  ctx.body = '' //  Release the connection early
  const message = body.message || body.edited_message

  const { callback_query } = body
  if (callback_query) {
    const { id, data } = callback_query
    const chat_id = callback_query.from.id
    const [action, fid] = data.split(' ')
    if (action === 'count') {
      if (counting[fid]) return sm({ chat_id, text: fid + ' Counting , please wait' })
      counting[fid] = true
      send_count({ fid, chat_id }).catch(err => {
        console.error(err)
        sm({ chat_id, text: fid + 'Statistics failed：' + err.message })
      }).finally(() => {
        delete counting[fid]
      })
    } else if (action === 'copy') {
      tg_copy({ fid, chat_id }).then(task_id => {
        task_id && sm({ chat_id, text: `Start copying, task ID: ${task_id} can enter /task ${task_id}query progress`  })
      })
    } else if (action === 'copy2') {
      const target = COPY_TARGET2
      tg_copy({ fid, target, chat_id }).then(task_id => {
        task_id && sm({ chat_id, text: `Start copying, task ID: ${task_id} can enter /task ${task_id} query progress` })
      })
    } else if (action === 'copy3') {
      const target = COPY_TARGET3
      tg_copy({ fid, target, chat_id }).then(task_id => {
        task_id && sm({ chat_id, text: `Start copying, task ID: ${task_id} can enter /task  ${task_id} query progress` })
      })
    }
    return reply_cb_query({ id, data }).catch(console.error)
  }

  const chat_id = message && message.chat && message.chat.id
  const text = message && message.text && message.text.trim()
  let username = message && message.from && message.from.username
  username = username && String(username).toLowerCase()
  let user_id = message && message.from && message.from.id
  user_id = user_id && String(user_id).toLowerCase()
  if (!chat_id || !text || !tg_whitelist.some(v => {
    v = String(v).toLowerCase()
    return v === username || v === user_id
  })) return console.warn('abnormal request' )

  const fid = extract_fid(text) || extract_from_text(text)
  const no_fid_commands = ['/task', '/help']
  if (!no_fid_commands.some(cmd => text.startsWith(cmd)) && !validate_fid(fid)) {
    return sm({ chat_id, text: 'Share ID not recognized' })
  }
  if (text.startsWith('/help')) return send_help(chat_id)
  if (text.startsWith('/count')) {
    if (counting[fid]) return sm({ chat_id, text: fid + ' Counting , please wait' })
    try {
      counting[fid] = true
      const update = text.endsWith(' -u')
      await send_count({ fid, chat_id, update })
    } catch (err) {
      console.error(err)
      sm({ chat_id, text: fid + 'Statistics failed:' + err.message })
    } finally {
      delete counting[fid]
    }
  } else if (text.startsWith('/copy')) {
    const target = text.replace('/copy', '').replace(' -u', '').trim().split(' ').map(v => v.trim())[1]
    if (target && !validate_fid(target)) return sm({ chat_id, text: `Target ID ${target} format is incorrect`   })
    const update = text.endsWith(' -u')
    tg_copy({ fid, target, chat_id, update }).then(task_id => {
      task_id && sm({ chat_id, text: `Start copying, task ID: ${task_id} can enter /task ${task_id} query progress`  })
    })
  } else if (text.startsWith('/task')) {
    let task_id = text.replace('/task', '').trim()
    if (task_id === 'all') {
      return send_all_tasks(chat_id)
    }
    task_id = parseInt(task_id)
    if (!task_id) {
      const running_tasks = db.prepare('select id from task where status=?').all('copying')
      if (!running_tasks.length) return sm({ chat_id, text: 'There are currently no tasks in progress' })
      return running_tasks.forEach(v => send_task_info({ chat_id, task_id: v.id }).catch(console.error))
    }
    send_task_info({ task_id, chat_id }).catch(console.error)
  } else if (text.includes('drive.google.com/') || validate_fid(text)) {
    return send_choice({ fid: fid || text, chat_id }).catch(console.error)
  } else {
    sm({ chat_id, text: 'This command is not  currently supported' })
  }
})

module.exports = router
