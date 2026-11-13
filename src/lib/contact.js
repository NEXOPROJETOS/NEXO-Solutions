import { brand } from '../data/config.js';

export function whatsappLink(message = 'Olá! Gostaria de conversar sobre um projeto.') {
  const number = brand.whatsapp.replace(/\D/g, '');
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : '';
}
