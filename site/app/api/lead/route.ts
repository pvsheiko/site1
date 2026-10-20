import { allowRequest, configured, database, hashIp, keyboard, messageFor, telegram, validateLead, validOrigin } from "@/lib/leads";
export async function POST(request: Request) {
 if (!validOrigin(request)) return Response.json({error:"Недопустимый источник запроса"},{status:403});
 if (!request.headers.get("content-type")?.includes("application/json")) return Response.json({error:"Неверный формат запроса"},{status:415});
 const raw=await request.text();
 if (raw.length>10000) return Response.json({error:"Слишком длинная заявка"},{status:413});
 let value;
 try {value=JSON.parse(raw)} catch {return Response.json({error:"Неверный формат заявки"},{status:400})}
 if (value && typeof value==="object" && typeof value.website==="string" && value.website.trim()) return Response.json({ok:true});
 const input=validateLead(value);
 if (!input) return Response.json({error:"Проверьте имя, контакт и согласие на обработку данных"},{status:400});
 if (!configured()) return Response.json({error:"Форма временно недоступна. Напишите нам в Instagram @gwozdik"},{status:503});
 const ip=hashIp(request);
 if(!allowRequest(ip,input.id))return Response.json({error:"Слишком много заявок. Попробуйте через 10 минут"},{status:429});
 const db=database();
 let saved=false, lead;
 try {
  const {data,error}=await db.rpc("submit_lead",{p_id:input.id,p_name:input.name,p_contact:input.contact,p_message:input.message,p_page:input.page,p_utm:input.utm,p_ip_hash:ip});
  if (error?.message.includes("LEAD_RATE_LIMIT")) return Response.json({error:"Слишком много заявок. Попробуйте через 10 минут"},{status:429,headers:{"Retry-After":"600"}});
  if (error || !data?.[0]) throw new Error("DATABASE_SAVE_FAILED");
  saved=true;lead=data[0];
  if (lead.telegram_sent_at) return Response.json({ok:true});
  const claim=await db.rpc("claim_lead_notification",{p_id:input.id});
  if (claim.error) { console.error("lead.notification_claim_failed"); return Response.json({ok:true}); }
  if (!claim.data?.[0]) return Response.json({ok:true});
 } catch {console.error("lead.database_or_claim_failed");}
 // The original submission is recoverable through Telegram even during a DB outage.
 // No status buttons in fallback: there is no confirmed database record to update.
 try {
  const record=lead || {...input,created_at:new Date().toISOString(),status:"new" as const};
  const result=await telegram("sendMessage",{chat_id:process.env.TELEGRAM_CHAT_ID,text:messageFor(record),...(saved && process.env.TELEGRAM_WEBHOOK_SECRET ? {reply_markup:keyboard(input.id)} : {})});
  if (saved) {
   const {error}=await db.from("leads").update({telegram_message_id:result.result?.message_id,telegram_sent_at:new Date().toISOString()}).eq("id",input.id);
   if(error) console.error("lead.notification_receipt_failed");
  } else console.error("lead.telegram_only_delivery");
  return Response.json({ok:true});
 } catch {
  console.error("lead.telegram_delivery_failed");
  if(saved) await db.from("leads").update({notification_claimed_at:null}).eq("id",input.id);
  return saved ? Response.json({ok:true}) : Response.json({error:"Не удалось отправить заявку. Напишите нам в Instagram @gwozdik"},{status:502});
 }
}
