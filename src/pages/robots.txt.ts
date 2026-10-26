// На показе (PUBLIC_NOINDEX=1) закрыто всё; в бою – только служебные страницы.
export const GET = ({ site }: { site: URL }) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const body = import.meta.env.PUBLIC_NOINDEX === '1'
    ? 'User-agent: *\nDisallow: /\n'
    : ['User-agent: *', ...['/korzina/', '/zakaz-prinyat/', '/opt/', '/materialy/', '/karta/', '/redirects.json'].map((p) => `Disallow: ${base}${p}`),
      `Sitemap: ${new URL(base + '/sitemap.xml', site).href}`, ''].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
