const routes = ['/dashboard', '/events']
const targets = await (await fetch('http://127.0.0.1:9222/json/list')).json()
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
let id = 0; const pending = new Map(); const logs = []
const send = (method, params={}) => new Promise((res, rej) => { const i=++id; pending.set(i,{res,rej}); ws.send(JSON.stringify({id:i,method,params})) })
ws.onmessage = e => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); return }
  if (m.method === 'Runtime.exceptionThrown') logs.push('EXCEPTION: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text))
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') logs.push('CONSOLE: ' + m.params.args.map(a => a.value ?? a.description ?? '').join(' '))
}
await new Promise(r => { ws.onopen = r })
await send('Page.enable'); await send('Runtime.enable')
const sleep = ms => new Promise(r => setTimeout(r, ms))
await send('Page.navigate', { url: 'http://127.0.0.1:5173/login' }); await sleep(2500)
await send('Runtime.evaluate', { expression: `
  const setVal = (el, v) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
  setVal(document.querySelector('input[type=email]'), 'student@university.edu');
  setVal(document.querySelector('input[type=password]'), 'CampusStudent2026!');
  document.querySelector('form').requestSubmit();
` })
await sleep(3500)
for (const route of routes) {
  logs.length = 0
  await send('Page.navigate', { url: 'http://127.0.0.1:5173' + route }); await sleep(4000)
  const r = await send('Runtime.evaluate', { returnByValue: true, expression: `(() => ({ path: location.pathname, text: (document.querySelector('main') || document.body).innerText.slice(0, 1200) }))()` })
  console.log('\n=== ' + route + ' -> ' + r.result.value.path + ' ===\n' + r.result.value.text)
  if (logs.length) console.log('ERRORS: ' + [...new Set(logs)].join(' | '))
}
ws.close()
