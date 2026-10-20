import type {Metadata} from 'next';
import Setup from './setup';
export const metadata:Metadata={title:'Подключение бота — Gvozdik studio',robots:{index:false,follow:false},alternates:{canonical:'/bot-setup'}};
export default function Page(){return <main className="privacy-page"><h1>Подключение Telegram-бота</h1><p>Страница для владельца студии. Токен бота и ключ Supabase должны быть сохранены в настройках сервера. Здесь вводится только секрет подключения Telegram, заданный вами в TELEGRAM_WEBHOOK_SECRET.</p><Setup/></main>}
