import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
export const consentVersion = "2026-10-20";
export const labels = { new: "Новая", in_progress: "В работе", completed: "Завершена" };
export type Lead = { id: string; name: string; contact: string; message: string; page: string; utm: Record<string,string>; created_at: string; status: keyof typeof labels; telegram_sent_at?: string | null; telegram_message_id?: number | null };
export function database() {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("DATABASE_NOT_CONFIGURED");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(10000) }) } });
}
export function configured() { return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID); }
export function validOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const incoming = new URL(origin);
    // Next's bound URL can use 0.0.0.0 behind a proxy; the browser Host header
    // identifies the requested origin and cannot be overwritten by browser JS.
    return origin === new URL(request.url).origin ||
      (["http:", "https:"].includes(incoming.protocol) && incoming.host === request.headers.get("host")) ||
      (!!process.env.SITE_URL && origin === new URL(process.env.SITE_URL).origin);
  } catch { return false; }
}

export function validateLead(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string,unknown>;
  const text = (key:string) => typeof v[key] === "string" ? (v[key] as string).trim() : "";
  const id=text("id"), name=text("name"), contact=text("contact"), message=text("message"), page=text("page") || "/";
  const phone = /^\+?[\d\s()-]{7,30}$/.test(contact) && contact.replace(/\D/g, "").length >= 7;
  const telegram = /^@[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(contact);
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || name.length<2 || name.length>80 || /[\r\n]/.test(name) || contact.length>120 || !(phone || telegram || email) || message.length>2000 || page.length>500 || !page.startsWith("/") || page.startsWith("//") || v.consent !== true) return null;
  const utm:Record<string,string>={};
  if (v.utm && typeof v.utm === "object") for (const [k,val] of Object.entries(v.utm)) if (/^utm_(source|medium|campaign|term|content)$/.test(k) && typeof val === "string") utm[k]=val.slice(0,200);
  return {id,name,contact,message,page,utm};
}
export function hashIp(request: Request) {
  const address = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return createHmac("sha256",process.env.SUPABASE_SECRET_KEY!).update(address).digest("hex");
}
export function messageFor(lead: Lead) {
 const time = new Intl.DateTimeFormat("ru-BY", { timeZone: "Europe/Minsk", dateStyle: "short", timeStyle: "short" }).format(new Date(lead.created_at));
 // Stay below Telegram's 4096-character limit even with all UTM values.
 return [`Новая заявка · Gvozdik studio`, `№ ${lead.id}`, `Статус: ${labels[lead.status]}`, `Имя: ${lead.name}`, `Контакт: ${lead.contact}`, `Задача: ${lead.message || "Не указана"}`, `Страница: ${lead.page}`, ...Object.entries(lead.utm).map(([k,v])=>`${k}: ${v}`), `Минск: ${time}`].join("\n").slice(0,4000);
}
export function keyboard(id: string) {
 return { inline_keyboard: [[{text:"В работу",callback_data:`lead:${id}:in_progress`},{text:"Завершена",callback_data:`lead:${id}:completed`}]] };
}
export async function telegram(method: string, payload: unknown): Promise<{ok:boolean; result?: {message_id?:number}}> {
 const token=process.env.TELEGRAM_BOT_TOKEN;
 if (!token) throw new Error("TELEGRAM_NOT_CONFIGURED");
 const response=await fetch(`https://api.telegram.org/bot${token}/${method}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),signal:AbortSignal.timeout(10000)});
 const result=await response.json();
 if (!response.ok || result.ok !== true) throw new Error("TELEGRAM_REQUEST_FAILED");
 return result;
}

// Best-effort fallback protection while the database is unavailable.
// The SQL RPC remains the durable limit shared across serverless instances.
const recentRequests = new Map<string,{until:number; ids:Set<string>}>();
export function allowRequest(ip:string,id:string) {
 const now=Date.now();
 for (const [key,value] of recentRequests) if(value.until<=now)recentRequests.delete(key);
 const entry=recentRequests.get(ip);
 if(entry){if(entry.ids.has(id))return true;if(entry.ids.size>=3)return false;entry.ids.add(id);return true;}
 if(recentRequests.size>=10000)return false;
 recentRequests.set(ip,{until:now+600000,ids:new Set([id])});return true;
}
