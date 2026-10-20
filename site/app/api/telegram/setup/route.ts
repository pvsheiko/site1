import {timingSafeEqual} from 'node:crypto';
import {telegram,validOrigin} from '@/lib/leads';
export async function POST(request:Request){
 const expected=process.env.TELEGRAM_WEBHOOK_SECRET;
 if(!expected || !/^[A-Za-z0-9_-]{32,256}$/.test(expected))return Response.json({error:'Секрет подключения бота ещё не настроен на сервере'},{status:503});
 const supplied=request.headers.get('authorization')?.replace(/^Bearer /,'') || '';
 if(!validOrigin(request) || Buffer.byteLength(expected)!==Buffer.byteLength(supplied) || !timingSafeEqual(Buffer.from(expected),Buffer.from(supplied)))return Response.json({error:'Нет доступа'},{status:403});
 try{
  const body=await request.json();
  if(body.action==='chats'){
   // Keep response limited to chat/user IDs. Never return messages or bot token.
   const token=process.env.TELEGRAM_BOT_TOKEN;
   if(!token)throw new Error('MISSING_BOT');
   const r=await fetch(`https://api.telegram.org/bot${token}/getUpdates`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({timeout:0,allowed_updates:['message']}),signal:AbortSignal.timeout(10000)});
   const data=await r.json();if(!r.ok || !data.ok)return Response.json({error:'Не удалось получить чаты. Если webhook уже подключён, используйте сохранённый chat_id'},{status:502});
   const chats=new Map();for(const update of data.result){const m=update.message;if(m?.chat)chats.set(m.chat.id,{chat_id:m.chat.id,type:m.chat.type,user_id:m.from?.id})}
   return Response.json({chats:[...chats.values()]});
  }
  if(body.action!=='connect')return Response.json({error:'Неизвестное действие'},{status:400});
  const site=process.env.SITE_URL,chat=process.env.TELEGRAM_CHAT_ID;
  if(!site || new URL(site).protocol!=='https:' || !chat || (chat.startsWith('-')&&!process.env.TELEGRAM_ADMIN_USER_ID))return Response.json({error:'Проверьте адрес сайта, chat_id и ID администратора для группы в настройках сервера'},{status:400});
  await telegram('setWebhook',{url:new URL('/api/telegram',site).href,secret_token:expected,allowed_updates:['message','callback_query']});
  await telegram('setMyCommands',{commands:[{command:'leads',description:'Последние 5 заявок'},{command:'new',description:'Новые заявки'},{command:'help',description:'Помощь'}]});
  return Response.json({ok:true});
 }catch{console.error('lead.bot_setup_failed');return Response.json({error:'Подключение не завершено. Проверьте настройки бота на сервере'},{status:502})}
}
