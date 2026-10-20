// No token, credential value or raw API error is printed.
import { existsSync } from 'node:fs';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const command=process.argv[2];
const token=process.env.TELEGRAM_BOT_TOKEN;
async function call(method,body){
 if(!token)throw new Error('Добавьте TELEGRAM_BOT_TOKEN в .env.local или защищенное окружение');
 const r=await fetch(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
 const data=await r.json();if(!r.ok||!data.ok)throw new Error('Telegram отклонил запрос. Проверьте токен, Start и настройки бота');return data.result;
}
try{
 if(command==='chat-id'){
  const info=await call('getWebhookInfo',{});
  if(info.url)throw new Error('Webhook уже настроен: getUpdates недоступен. Используйте известный chat_id; webhook не удалялся');
  const updates=await call('getUpdates',{timeout:0,allowed_updates:['message']});
  const chats=new Map();for(const u of updates){const m=u.message;if(m?.chat)chats.set(m.chat.id,{chat_id:m.chat.id,type:m.chat.type,admin_user_id:m.from?.id})}
  if(!chats.size)console.log('Нажмите Start у бота или отправьте ему сообщение и повторите команду');
  for(const entry of chats.values())console.log(JSON.stringify(entry));
 }else if(command==='webhook'){
  const {SITE_URL,TELEGRAM_WEBHOOK_SECRET,TELEGRAM_CHAT_ID,TELEGRAM_ADMIN_USER_ID}=process.env;
  if(!SITE_URL||new URL(SITE_URL).protocol!=='https:')throw new Error('Нужен реальный HTTPS-адрес SITE_URL');
  if(!TELEGRAM_CHAT_ID)throw new Error('Нужен TELEGRAM_CHAT_ID');
  if(TELEGRAM_CHAT_ID.startsWith('-')&&!TELEGRAM_ADMIN_USER_ID)throw new Error('Для группы нужен TELEGRAM_ADMIN_USER_ID');
  if(!TELEGRAM_WEBHOOK_SECRET||!/^[A-Za-z0-9_-]{32,256}$/.test(TELEGRAM_WEBHOOK_SECRET))throw new Error('Нужен TELEGRAM_WEBHOOK_SECRET: 32–256 символов A-Z a-z 0-9 _ -');
  await call('setWebhook',{url:new URL('/api/telegram',SITE_URL).href,secret_token:TELEGRAM_WEBHOOK_SECRET,allowed_updates:['message','callback_query']});
  await call('setMyCommands',{commands:[{command:'leads',description:'Последние 5 заявок'},{command:'new',description:'Новые заявки'},{command:'help',description:'Помощь'}]});
  console.log('Webhook и команды настроены. Отправьте боту /leads');
 }else throw new Error('Используйте chat-id или webhook');
}catch(e){console.error(e.message);process.exitCode=1}
