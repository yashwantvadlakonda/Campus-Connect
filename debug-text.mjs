const token = process.env.AUDIT_TOKEN, cached = process.env.AUDIT_CACHED
const targets = await (await fetch('http://127.0.0.1:9222/json/list')).json()
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
let id = 0; const pending = new Map()
const send = (method, params={}) => new Promise((res, rej) => { const i=++id; pending.set(i,{res,rej}); ws.send(JSON.stringify({id:i,method,params})) })
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result) } }
await new Promise(r => { ws.onopen = r })
await send('Page.enable'); await send('Runtime.enable')
const sleep = ms => new Promise(r => setTimeout(r, ms))
await send('Page.navigate', { url: 'http://127.0.0.1:5173/admin/login' }); await sleep(2000)
await send('Runtime.evaluate', { expression: `localStorage.setItem('campus_admin_token', ${JSON.stringify(token)}); localStorage.setItem('campus_admin_profile', ${JSON.stringify(cached)});` })
for (const route of ['/admin/hackathons', '/admin/registrations', '/admin/announcements']) {
  await send('Page.navigate', { url: 'http://127.0.0.1:5173' + route }); await sleep(2800)
  const r = await send('Runtime.evaluate', { returnByValue: true, expression: 'document.querySelector("main")?.innerText' })
  console.log('\n=== ' + route + ' ===\n' + r.result.value)
}
ws.close()
