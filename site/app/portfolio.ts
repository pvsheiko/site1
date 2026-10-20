import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";

// Real client photographs only. Missing assets stay out of the rendered page.
// Dimensions verified against the three originals supplied in Архив.zip.
const photographs = [
  { id: "white", src: "/images/white-lace.webp", width: 1174, height: 1280, title: "Белый образ", alt: "Белый жакет и длинная кружевная юбка на фоне каменного фасада" },
  { id: "black", src: "/images/black-dress.webp", width: 1126, height: 1280, title: "Чёрный силуэт", alt: "Чёрное платье с открытой спиной среди светлых колонн" },
  { id: "red", src: "/images/red-dress.webp", width: 1206, height: 1268, title: "Красный акцент", alt: "Красное платье с объёмными бантами и шлейфом в праздничном интерьере" },
];
export const availablePhotographs = photographs.filter(photo => existsSync(path.join(process.cwd(), "public", photo.src)));
