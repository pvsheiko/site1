import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {POST as submit} from '../app/api/lead/route';
import {POST as callback} from '../app/api/telegram/route';
import {validateLead,messageFor,validOrigin} from '../lib/leads';
const sample=()=>({id:randomUUID(),name:'Тест клиента',contact:'@testclient',message:'Новая коллекция',consent:true,page:'/',utm:{utm_source:'test'}});
const secretNames=['SUPABASE_URL','SUPABASE_SECRET_KEY','TELEGRAM_BOT_TOKEN','TELEGRAM_CHAT_ID','TELEGRAM_WEBHOOK_SECRET','TELEGRAM_ADMIN_USER_ID'];
async function isolated(run:()=>Promise<void>,handler?:(url:string,init?:RequestInit)=>Response){
 const old=Object.fromEntries(secretNames.map(k=>[k,process.env[k]]));const original=global.fetch;
 Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_SECRET_KEY:'test-server-key',TELEGRAM_BOT_TOKEN:'test-bot-token',TELEGRAM_CHAT_ID:'123',TELEGRAM_WEBHOOK_SECRET:'test-webhook-secret'});delete process.env.TELEGRAM_ADMIN_USER_ID;
 global.fetch=async(input,init)=>{if(!handler)throw new Error('Network forbidden in test');return handler(String(input),init)};
 try{await run()}finally{global.fetch=original;for(const key of secretNames){if(old[key]===undefined)delete process.env[key];else process.env[key]=old[key]}}
}
const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
function request(body:unknown){return new Request('https://studio.example/api/lead',{method:'POST',headers:{'content-type':'application/json',origin:'https://studio.example','x-real-ip':randomUUID()},body:JSON.stringify(body)})}
test('validates contact formats, consent and lengths',()=>{for(const contact of ['+375 29 123-45-67','@fashion_client','brand@example.com'])assert(validateLead({...sample(),contact}));for(const changes of [{contact:'123'},{consent:false},{name:'a'},{message:'x'.repeat(2001)},{page:'//evil.example'}])assert.equal(validateLead({...sample(),...changes}),null)});
test('invalid input, foreign origin and honeypot never access services',async()=>isolated(async()=>{assert.equal((await submit(request({...sample(),consent:false}))).status,400);const r=request(sample());r.headers.set('origin','https://evil.example');assert.equal((await submit(r)).status,403);assert.equal((await submit(request({...sample(),website:'spam'}))).status,200)}));
test('missing keys never report successful delivery',async()=>isolated(async()=>{delete process.env.SUPABASE_SECRET_KEY;assert.equal((await submit(request(sample()))).status,503)}));
test('saves lead, notifies owner with buttons and records receipt',async()=>{const input=sample();let saves=0,sends=0,receipts=0;const lead={...input,status:'new',created_at:'2026-10-20T12:00:00Z'};await isolated(async()=>{const r=await submit(request(input));assert.equal(r.status,200);assert.equal(saves,1);assert.equal(sends,1);assert.equal(receipts,1)},(url,init)=>{if(url.endsWith('/rpc/submit_lead')){saves++;const b=JSON.parse(init!.body as string);assert.equal(b.p_contact,input.contact);assert(b.p_ip_hash);return response([lead])}if(url.endsWith('/rpc/claim_lead_notification'))return response([lead]);if(url.includes('/sendMessage')){sends++;const b=JSON.parse(init!.body as string);assert.equal(b.chat_id,'123');assert.equal(b.reply_markup.inline_keyboard[0][0].callback_data,`lead:${input.id}:in_progress`);return response({ok:true,result:{message_id:7}})}if(url.includes('/rest/v1/leads')){receipts++;return response(null,200)}throw new Error('Unexpected request')})});
test('retry of delivered lead does not notify twice',async()=>isolated(async()=>{assert.equal((await submit(request(sample()))).status,200)},url=>{assert(url.endsWith('/rpc/submit_lead'));return response([{telegram_sent_at:'2026-10-20T12:00:00Z'}])}));
test('database rate limit is returned without Telegram send',async()=>isolated(async()=>{assert.equal((await submit(request(sample()))).status,429)},url=>{assert(url.endsWith('/rpc/submit_lead'));return response({message:'LEAD_RATE_LIMIT',code:'P0001'},400)}));
test('Telegram failure leaves a saved lead accepted',async()=>{const lead={...sample(),status:'new',created_at:'2026-10-20T12:00:00Z'};await isolated(async()=>{assert.equal((await submit(request(lead))).status,200)},url=>{if(url.includes('/rpc/'))return response([lead]);if(url.includes('/sendMessage'))return response({ok:false},500);return response(null)})});
test('database failure falls back to Telegram without invalid status buttons',async()=>isolated(async()=>{assert.equal((await submit(request(sample()))).status,200)},(url,init)=>{if(url.includes('/rest/'))return response({message:'Unavailable'},503);const body=JSON.parse(init!.body as string);assert.equal(body.reply_markup,undefined);return response({ok:true,result:{message_id:9}})}));
test('both channels failing returns error, not success',async()=>isolated(async()=>{assert.equal((await submit(request(sample()))).status,502)},()=>response({ok:false,message:'Unavailable'},503)));
function update(body:unknown,secret='test-webhook-secret'){return new Request('https://studio.example/api/telegram',{method:'POST',headers:{'x-telegram-bot-api-secret-token':secret},body:JSON.stringify(body)})}
const click=(id:string,chat=123,from=123)=>({callback_query:{id:'test',data:`lead:${id}:in_progress`,from:{id:from},message:{message_id:7,chat:{id:chat}}}});
test('webhook rejects wrong secret and ignores outsiders without any API calls',async()=>isolated(async()=>{const id=randomUUID();assert.equal((await callback(update(click(id),'wrong'))).status,403);for(const r of [update(click(id,123,999)),update(click(id,999,123))])assert.equal((await callback(r)).status,200)}));
test('owner changes status in database and Telegram message',async()=>{const id=randomUUID();let changed=false;await isolated(async()=>{assert.equal((await callback(update(click(id)))).status,200);assert(changed)},(url,init)=>{if(url.includes('/rest/')){const b=JSON.parse(init!.body as string);assert.equal(b.status,'in_progress');changed=true;return response({...sample(),id,status:'in_progress',created_at:'2026-10-20T12:00:00Z'})}return response({ok:true})})});
test('/leads lists stored leads only for the configured owner',async()=>{let listed=false;await isolated(async()=>{assert.equal((await callback(update({message:{text:'/leads',chat:{id:123},from:{id:123}}}))).status,200);assert(listed)},url=>{if(url.includes('/rest/')){listed=true;return response([])}return response({ok:true})})});
test('Telegram message stays within limit and uses Minsk time',()=>{const text=messageFor({...sample(),status:'new',message:'x'.repeat(2000),created_at:'2026-10-20T12:00:00Z'});assert(text.length<=4000);assert.match(text,/15:00/)});

test('accepts same browser host behind a bound server, rejects foreign origin',()=>{
 const r=new Request('http://0.0.0.0:3001/api/lead',{headers:{host:'127.0.0.1:3001',origin:'http://127.0.0.1:3001'}});assert(validOrigin(r));
 r.headers.set('origin','https://evil.example');assert.equal(validOrigin(r),false);
 r.headers.set('origin','not-a-url');assert.equal(validOrigin(r),false);
});

test('bot setup rejects missing secret and anonymous callers',async()=>{
 const {POST}=await import('../app/api/telegram/setup/route');
 await isolated(async()=>{process.env.TELEGRAM_WEBHOOK_SECRET='a'.repeat(32);const r=new Request('https://studio.example/api/telegram/setup',{method:'POST',body:'{"action":"connect"}'});assert.equal((await POST(r)).status,403);delete process.env.TELEGRAM_WEBHOOK_SECRET;assert.equal((await POST(r)).status,503)});
});
test('chat discovery returns IDs without private messages or bot token',async()=>{
 const {POST}=await import('../app/api/telegram/setup/route');
 await isolated(async()=>{process.env.TELEGRAM_WEBHOOK_SECRET='a'.repeat(32);const r=new Request('https://studio.example/api/telegram/setup',{method:'POST',headers:{authorization:'Bearer '+'a'.repeat(32)},body:'{"action":"chats"}'});const res=await POST(r);assert.equal(res.status,200);const text=await res.text();assert(!text.includes('private message'));assert(!text.includes('test-bot-token'));assert.deepEqual(JSON.parse(text),{chats:[{chat_id:123,type:'private',user_id:123}]})},()=>response({ok:true,result:[{message:{chat:{id:123,type:'private'},from:{id:123},text:'private message'}}]}));
});
