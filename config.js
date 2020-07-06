// How many milliseconds of a single request does not respond after a timeout (the reference value, if it continuously times out, the next time it is adjusted to twice the previous time)
const TIMEOUT_BASE = 7000
// The maximum timeout setting, such as a certain request, the first 7s timeout, the second 14s, the third 28s, the fourth 56s, the fifth time is not 112s but 60s, the same is true for subsequent
const TIMEOUT_MAX = 60000

const LOG_DELAY = 5000 // Log output interval in milliseconds
const PAGE_SIZE = 1000 // Each network request reads the number of files in the directory. The larger the value, the more likely it will time out, and it must not exceed 1000

const RETRY_LIMIT = 7 // If a request fails, the maximum number of retries allowed
const PARALLEL_LIMIT = 20 // The number of parallel network requests can be adjusted according to the network environment

const DEFAULT_TARGET = '' // Required, copy the default destination ID, if you do not specify the target, it will be copied here, it is recommended to fill in the team disk ID

const AUTH = { // If you have a json authorization file for the service account, you can copy it to the sa directory instead of client_id/secret/refrest_token
  client_id: 'your_client_id',
  client_secret: 'your_client_secret',
  refresh_token: 'your_refresh_token',
  expires: 0, // can be left blank
  access_token: '', // can be left blank
  tg_token: 'bot_token', // Your telegram robot's token, please refer to https://core.telegram.org/bots#6-botfather
  tg_whitelist: ['your_tg_username'] // your tg username(t.me/username), the bot will only execute the commands sent by the users in this list
}

//-------------------MOD-------------------
const SA_PATH = '../sa' //sa path configuration, given an absolute path or a relative path with src as the current path, the default is'../sa'
const COPY_TARGET2 = '' //The default is''
const COPY_TARGET3 = '' //The default is''

module.exports = { AUTH, PARALLEL_LIMIT, RETRY_LIMIT, TIMEOUT_BASE, TIMEOUT_MAX, LOG_DELAY, PAGE_SIZE, DEFAULT_TARGET, SA_PATH, COPY_TARGET2, COPY_TARGET3 }
