"use client";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
export default function LeadForm(){
 const [state,setState]=useState<"idle"|"sending"|"success"|"error">("idle");
 const [error,setError]=useState("");const id=useRef("");
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();if(state==="sending")return;const form=event.currentTarget;const fields=new FormData(form);if(!id.current)id.current=crypto.randomUUID();setState("sending");setError("");const utm:Record<string,string>={};new URLSearchParams(location.search).forEach((v,k)=>{if(/^utm_(source|medium|campaign|term|content)$/.test(k))utm[k]=v});
 try{const response=await fetch("/api/lead",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:id.current,name:fields.get("name"),contact:fields.get("contact"),message:fields.get("message"),consent:fields.get("consent")==="on",website:fields.get("website"),page:location.pathname,utm}),signal:AbortSignal.timeout(25000)});const data=await response.json();if(!response.ok)throw new Error(data.error||"Не удалось отправить заявку");setState("success");form.reset();id.current="";}catch(e){setState("error");setError(e instanceof Error && e.name!=="TimeoutError"?e.message:"Связь прервалась. Попробуйте ещё раз или напишите в Instagram");}}
 return <form className="lead-form" method="post" action="/api/lead" onSubmit={submit} aria-label="Заявка на съёмку" aria-busy={state==="sending"}>
 <div className="lead-fields"><label>Ваше имя<input name="name" autoComplete="name" required minLength={2} maxLength={80}/></label><label>Телефон, Telegram или email<input name="contact" autoComplete="email" required minLength={5} maxLength={120} aria-describedby="contact-hint"/><span id="contact-hint">Например: +375 29 123-45-67 или @username</span></label></div>
 <label>Расскажите о будущей съёмке <span className="optional">(необязательно)</span><textarea name="message" rows={3} maxLength={2000}/></label>
 <div className="honeypot" aria-hidden="true"><label>Ваш сайт<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
 <label className="consent"><input type="checkbox" name="consent" required/><span>Я согласен на обработку данных из заявки для связи со мной и ознакомился с <Link href="/privacy">политикой обработки данных</Link></span></label>
 <button className="contact-button" type="submit" disabled={state==="sending"}>{state==="sending"?"Отправляем…":"Отправить заявку"}<span aria-hidden="true">↗</span></button>
 <div className="form-result" role="status" aria-live="polite">{state==="success" && <p>Заявка принята. Спасибо! Обсудим с вами будущую съёмку</p>}{state==="error" && <p>{error}. <a href="https://www.instagram.com/gwozdik/" target="_blank" rel="noopener noreferrer">Написать в Instagram</a></p>}</div>
 </form>
}
