import { flat } from '../lib/pages';
import { u } from '../lib/url';
export const GET = ({ site }: { site: URL }) => {
  const urls = flat().map((p) => `<url><loc>${new URL(u(p), site).href}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } });
};
