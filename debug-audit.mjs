import fs from 'node:fs'

const token = process.env.AUDIT_TOKEN
const cached = process.env.AUDIT_CACHED
const routes = [
  '/admin/dashboard', '/admin/hackathons', '/admin/events', '/admin/registrations',
  '/admin/announcements', '/admin/users', '/admin/analytics', '/admin/faculty', '/admin/activity',
  '/dashboard', '/events',
]

const targets = await (await fetch('http://127.0.0.1:9222/json/list')).json()
const page = targets.find(t => t.type === 'page')
const ws = new WebSocket(page.webSocketDebuggerUrl)
let id = 0
const pending = new Map()
const logs = []

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const msgId = ++id
  pending.set(msgId, { resolve, reject })
  ws.send(JSON.stringify({ id: msgId, method, params }))
})

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
    return
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    logs.push(`EXCEPTION: ${msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text}`)
  }
  if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(msg.params.type)) {
    const text = msg.params.args.map(a => a.value ?? a.description ?? '').join(' ')
    logs.push(`CONSOLE ${msg.params.type}: ${text}`)
  }
}

await new Promise(resolve => { ws.onopen = resolve })
await send('Runtime.enable')
await send('Page.enable')
await send('Log.enable')

const sleep = ms => new Promise(r => setTimeout(r, ms))

await send('Page.navigate', { url: 'http://127.0.0.1:5173/admin/login' })
await sleep(2500)
await send('Runtime.evaluate', {
  expression: `localStorage.setItem('campus_admin_token', ${JSON.stringify(token)});
  localStorage.setItem('campus_admin_profile', ${JSON.stringify(cached)});`,
})

for (const route of routes) {
  logs.length = 0
  await send('Page.navigate', { url: `http://127.0.0.1:5173${route}` })
  await sleep(2600)
  const result = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const root = document.getElementById('root');
      const h1 = document.querySelector('h1');
      return {
        path: location.pathname,
        rootChildren: root ? root.children.length : 0,
        heading: h1 ? h1.innerText.slice(0, 80) : null,
        textLength: (document.body.innerText || '').length,
        loadingSpinners: document.querySelectorAll('.animate-spin').length,
      };
    })()`,
  })
  const value = result.result.value
  console.log(`${route} -> ${JSON.stringify(value)}`)
  if (logs.length) console.log(`  ERRORS: ${[...new Set(logs)].join(' | ')}`)
}

ws.close()
