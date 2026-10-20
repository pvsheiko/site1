import Image from "next/image";
import Link from "next/link";
import LeadForm from "./components/lead-form";
import { availablePhotographs } from "./portfolio";

const instagram = "https://www.instagram.com/gwozdik/";

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d={diagonal ? "M5 19 19 5M5 5h14v14" : "M4 12h16m-7-7 7 7-7 7"} stroke="currentColor" strokeWidth="1.4" /></svg>;
}
function Flower({ className = "" }: { className?: string }) {
  return <svg className={className} aria-hidden="true" viewBox="0 0 200 200" fill="none"><g stroke="currentColor" strokeWidth="1.1">{Array.from({ length: 12 }, (_, i) => <ellipse key={i} cx="100" cy="67" rx="20" ry="48" transform={`rotate(${i * 30} 100 100)`} />)}<circle cx="100" cy="100" r="11" /></g></svg>;
}
export default function Home() {
  const heroPhoto = availablePhotographs.find(photo => photo.id === "white");
  return <>
    <a className="skip" href="#main">Перейти к содержанию</a>
    <header className="header"><a href="#" className="wordmark" aria-label="Gvozdik studio — главная">gvozdik<span>studio</span></a><nav aria-label="Основная навигация"><a href="#work">Работы</a><a href="#about">О студии</a><a href="#contact">Контакты</a></nav><a className="header-contact" href="#contact">Обсудить съёмку <Arrow diagonal /></a></header>
    <main id="main">
      <section className={`hero${heroPhoto ? " hero-with-photo" : ""}`} aria-labelledby="hero-title">
        <div className="hero-meta"><span>Фото, видео и образы</span><span>Минск, Беларусь</span></div>
        {heroPhoto ? <>
          <div className="photo-hero-name" aria-label="Gvozdik studio">gvozdik<span>studio</span></div>
          <div className="photo-hero-grid"><div className="photo-hero-copy"><h1 id="hero-title">Фото и видео<br />для брендов<br />женской одежды</h1><p>Съёмки и образы под ключ.<br />В Минске и областных городах Беларуси</p><a className="text-link" href="#work">Смотреть работы <Arrow /></a></div><figure className="photo-hero-frame"><Image src={heroPhoto.src} alt={heroPhoto.alt} width={heroPhoto.width} height={heroPhoto.height} sizes="(max-width: 600px) 88vw, 50vw" preload /><figcaption>Gvozdik studio / Женская одежда и образы</figcaption></figure></div>
        </> : <>
        <div className="hero-brand" aria-label="Gvozdik studio"><span>gvozdik</span><span className="hero-studio">studio<Flower /></span></div>
        <div className="hero-bottom"><h1 id="hero-title">Фото и видео для брендов<br className="desktop-break" /> женской одежды</h1><p>Съёмки и образы под ключ.<br />В Минске и областных городах Беларуси</p><a className="round-link" href="#work" aria-label="Перейти к портфолио"><span>К работам</span><svg width="24" height="28" viewBox="0 0 24 28" aria-hidden="true"><path d="M12 2v23m-8-8 8 8 8-8" stroke="currentColor" fill="none" strokeWidth="1.4" /></svg></a></div>
        </>}
      </section>
      <section className="work section" id="work" aria-labelledby="work-title">
        <div className="section-heading"><span className="eyebrow">Портфолио</span><h2 id="work-title">Одежда.<br />Образ. Характер.</h2><p>Знакомство со студией<br />начинается с её работ</p></div>
        {availablePhotographs.length > 0 ? <>
          <div className="photo-gallery">{availablePhotographs.map(photo => <figure key={photo.id} className={`photo-work photo-work-${photo.id}`}><a href={photo.src} target="_blank" rel="noopener noreferrer" aria-label={`Открыть фотографию «${photo.title}» в новой вкладке`}><Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 600px) 88vw, 44vw" /></a><figcaption><span>{photo.title}</span><span>Gvozdik studio</span></figcaption></figure>)}</div>
          <a className="text-link" href={instagram} target="_blank" rel="noopener noreferrer">Больше работ в Instagram <Arrow diagonal /></a>
        </> : <>
        <a className="portfolio-link" href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Смотреть фото и видео Gvozdik studio в Instagram — откроется новая вкладка">
          <div className="portfolio-top"><span>Фото и видео</span><span>@gwozdik</span></div>
          <div className="portfolio-art"><span className="art-word">look<br /><span>closer</span></span><Flower className="art-flower" /><span className="art-caption">Gvozdik studio<br />Женская одежда и образы</span></div>
          <div className="portfolio-bottom"><div><h3>Смотреть портфолио</h3><p>Съёмки и контент в Instagram</p></div><span className="arrow-circle"><Arrow diagonal /></span></div>
        </a>
        </>}
      </section>
      <section className="approach section" aria-labelledby="approach-title">
        <div className="approach-intro"><span className="eyebrow">Для вашего бренда</span><h2 id="approach-title">От образа<br />к съёмке</h2><p>Фото- и видеосъёмка женской одежды под ключ — с вниманием к задаче вашего бренда</p><a className="text-link" href="#contact">Давайте обсудим вашу идею <Arrow /></a></div>
        <div className="service-list"><article><span className="service-title">Фото</span><p>Женская одежда и образы в фотографиях</p></article><article><span className="service-title">Видео</span><p>Одежда и образ в движении</p></article><article><span className="service-title">Под ключ</span><p>Состав съёмки обсудим под вашу задачу</p></article></div>
      </section>
      <section className="about section" id="about" aria-labelledby="about-title"><div className="about-brand" aria-hidden="true"><Flower /><span>g.</span><p>Личный взгляд.<br />Общий замысел.</p></div><div className="about-copy"><span className="eyebrow">За кадром и в кадре</span><h2 id="about-title">Алена<br />Гвоздик</h2><p className="about-lead">Модель и лицо<br />Gvozdik studio</p><p>Съёмки женской одежды и образов для белорусских брендов. Работаем в Минске и областных городах Беларуси</p><a className="text-link" href={instagram} target="_blank" rel="noopener noreferrer">Познакомиться в Instagram <Arrow diagonal /></a></div></section>
      <section className="contact section" id="contact" aria-labelledby="contact-title"><div className="contact-top"><span className="eyebrow">Следующая съёмка — ваша</span><span>Минск и Беларусь</span></div><h2 id="contact-title">Начнём<br />с вашей идеи<span className="contact-dot">?</span></h2><div className="contact-bottom"><p>Расскажите о бренде и будущей съёмке.<br />Обсудим задачу и формат работы</p><a className="contact-button" href={instagram} target="_blank" rel="noopener noreferrer">Написать в Instagram <Arrow diagonal /></a></div><LeadForm /></section>
    </main>
    <footer><a href="#" className="wordmark">gvozdik<span>studio</span></a><p>Фото и видео для брендов женской одежды</p><a href={instagram} target="_blank" rel="noopener noreferrer">@gwozdik</a><a className="back-top" href="#">Наверх ↑</a><Link href="/privacy">Обработка данных</Link><span className="copyright">© Gvozdik studio</span></footer>
  </>;
}
