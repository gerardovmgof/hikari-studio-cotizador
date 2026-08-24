export const config = {
  matcher: '/((?!api/health).*)',
};

export default function middleware(request) {
  const auth = request.headers.get('authorization');
  const expected = process.env.SITE_PASSWORD;

  if (!expected) {
    return new Response('Falta configurar SITE_PASSWORD en Vercel.', { status: 500 });
  }

  if (auth) {
    const [scheme, encoded] = auth.split(' ');
    if (scheme === 'Basic' && encoded) {
      const decoded = atob(encoded);
      const separatorIndex = decoded.indexOf(':');
      const password = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : decoded;
      if (password === expected) {
        return;
      }
    }
  }

  return new Response('Acceso restringido — Hikari Studio', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Hikari Studio", charset="UTF-8"',
    },
  });
}
