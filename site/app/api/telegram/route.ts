import { timingSafeEqual } from "node:crypto";
import { database, keyboard, labels, messageFor, telegram } from "@/lib/leads";
export async function POST(request:Request) {
 const expected=process.env.TELEGRAM_WEBHOOK_SECRET;
 const supplied=request.headers.get("x-telegram-bot-api-secret-token") || "";
 if (!expected) return new Response(null,{status:503});
 if (Buffer.byteLength(expected)!==Buffer.byteLength(supplied) || !timingSafeEqual(Buffer.from(expected),Buffer.from(supplied))) return new Response(null,{status:403});
 const raw=await request.text();if(raw.length>20000)return new Response(null,{status:413});
 let update;try{update=JSON.parse(raw)}catch{return new Response(null,{status:400})}
 const query=update?.callback_query;
 const incoming=update?.message;
 const chat=String(query?.message?.chat?.id || incoming?.chat?.id || "");
 const admin=process.env.TELEGRAM_ADMIN_USER_ID || (chat.startsWith("-") ? "" : process.env.TELEGRAM_CHAT_ID);
 if(chat!==process.env.TELEGRAM_CHAT_ID || !admin || String(query?.from?.id || incoming?.from?.id)!==admin) return Response.json({ok:true}); // acknowledge and ignore: do not let outsiders trigger Telegram retries
 if (!query) {
  const command=typeof incoming?.text==="string" ? incoming.text.split(/[ @]/)[0] : "";
  try {
   if(command==="/leads" || command==="/new"){
    let selection=database().from("leads").select().order("created_at",{ascending:false}).limit(5);
    if(command==="/new") selection=selection.eq("status","new");
    const {data,error}=await selection;if(error)throw new Error("LEADS_READ_FAILED");
    if(!data?.length)await telegram("sendMessage",{chat_id:chat,text:"Заявок пока нет"});
    for(const lead of data || []) await telegram("sendMessage",{chat_id:chat,text:messageFor(lead),reply_markup:keyboard(lead.id)});
   } else if(command==="/start" || command==="/help") await telegram("sendMessage",{chat_id:chat,text:"Gvozdik studio — заявки\n/leads — 5 последних заявок\n/new — 5 новых заявок\nМеняйте статус кнопками под заявкой. Контакт клиента указан в сообщении."});
   return Response.json({ok:true});
  }catch{console.error("lead.bot_command_failed");return new Response(null,{status:500})}
 }
 const match=typeof query.data==="string" && /^lead:([0-9a-f-]{36}):(in_progress|completed)$/.exec(query.data);
 if(!match)return Response.json({ok:true});
 const [,id,status]=match;
 try {
  const db=database();
  const {data,error}=await db.from("leads").update({status,updated_at:new Date().toISOString()}).eq("id",id).select().maybeSingle();
  if(error)throw new Error("STATUS_UPDATE_FAILED");
  if(!data){await telegram("answerCallbackQuery",{callback_query_id:query.id,text:"Заявка не найдена"});return Response.json({ok:true})}
  await telegram("editMessageText",{chat_id:chat,message_id:query.message.message_id,text:messageFor(data),reply_markup:keyboard(id)}).catch(()=>console.error("lead.telegram_status_display_failed"));
  await telegram("answerCallbackQuery",{callback_query_id:query.id,text:`Статус: ${labels[status as keyof typeof labels]}`});
  return Response.json({ok:true});
 }catch{console.error("lead.status_update_failed");return new Response(null,{status:500})}
}
