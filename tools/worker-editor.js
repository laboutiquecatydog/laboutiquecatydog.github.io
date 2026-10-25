/**
 * Sveltia CMS Auth worker — versión adaptada para "La Boutique Cat & Dog".
 * Basado en el código oficial de https://github.com/sveltia/sveltia-cms-auth
 * (rama main), SIN tocar el flujo de Sveltia. Se agregó un "modo editor":
 *
 *   1. `/auth?provider=github&site_id=<dominio>&client=editor&redirect=<origen>`
 *      valida el dominio igual que siempre y guarda una cookie extra
 *      `cms-back` con la URL de retorno (solo /admin/editor.html de un
 *      dominio permitido).
 *
 *   2. `/callback` detecta esa cookie y, en vez del postMessage de ventana
 *      emergente que usa Sveltia, redirige la MISMA pestaña de vuelta al
 *      editor con el resultado en el fragmento: `#access_token=...`
 *      o `#error=...`.
 *
 * El fragmento (`#`) nunca viaja al servidor: el token solo queda en el
 * navegador. Todo lo demás queda idéntico al original.
 */

/**
 * List of supported OAuth providers.
 */
const supportedProviders = ['github', 'gitlab'];

/**
 * OAuth scopes for each provider: the scope to request when the client doesn’t ask for one, the
 * separator the provider expects between multiple scopes, and the scopes that may be requested.
 * @type {Record<string, { default: string, separator: string, allowed: string[] }>}
 * @see https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps
 * @see https://docs.gitlab.com/api/oauth2/
 */
const providerScopes = {
  github: {
    default: 'repo,user',
    separator: ',',
    allowed: ['repo', 'public_repo', 'user', 'read:user', 'user:email'],
  },
  gitlab: {
    default: 'api',
    separator: ' ',
    allowed: ['api', 'read_api', 'read_user', 'read_repository', 'write_repository'],
  },
};

/**
 * Work out the OAuth scope to request from the given provider.
 * @param {string} provider - Backend name, e.g. `github`.
 * @param {string} [requested] - The `scope` parameter from the request, if any.
 * @param {{ [key: string]: string }} env - Environment variables.
 * @returns {string} Scope to request.
 */
const getScope = (provider, requested, env) => {
  const { default: fallback, separator, allowed } = providerScopes[provider];
  let scopes = (requested ?? '').split(/[\s,]+/).filter(Boolean);
  const allowWorkflow = provider === 'github' && env.GITHUB_ALLOW_WORKFLOW_SCOPE === 'true';

  if (!allowWorkflow && scopes.includes('workflow')) {
    // eslint-disable-next-line no-console
    console.warn(
      `Ignoring the "workflow" scope for ${provider}; set GITHUB_ALLOW_WORKFLOW_SCOPE to "true" ` +
        'to allow it.',
    );

    scopes = scopes.filter((scope) => scope !== 'workflow');
  }

  if (!scopes.length) {
    return fallback;
  }

  if (scopes.every((scope) => allowed.includes(scope) || (allowWorkflow && scope === 'workflow'))) {
    return scopes.join(separator);
  }

  // eslint-disable-next-line no-console
  console.warn(
    `Ignoring the unsupported "${requested}" scope for ${provider}; requesting "${fallback}".`,
  );

  return fallback;
};

/**
 * Escape the given string for safe use in a regular expression.
 * @param {string} str - Original string.
 * @returns {string} Escaped string.
 */
const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Convert the `ALLOWED_DOMAINS` environment variable into a list of anchored regular expression
 * sources. The sources are used both here and in the client-side script embedded in
 * {@link outputHTML}, so a hostname is matched by the exact same rules on either side.
 * Para pruebas locales se puede usar el comodín, p. ej. `localhost*`.
 * @param {string} [allowedDomains] - Comma-separated list of hostnames, which may contain a
 * wildcard (`*`).
 * @returns {string[]} Regular expression sources. Empty if the variable is not configured.
 */
const getDomainPatterns = (allowedDomains) =>
  (allowedDomains ?? '')
    .split(/,/)
    .map((str) => str.trim())
    .filter(Boolean)
    .map((str) => `^${escapeRegExp(str).replaceAll('\\*', '.+')}$`);

/**
 * Serialize the given value for safe embedding in an inline `<script>` block.
 * @param {string | boolean | string[]} value - Value to be serialized.
 * @returns {string} JavaScript literal.
 */
const serialize = (value) => JSON.stringify(value ?? null).replaceAll('<', '\\u003c');

/**
 * [EDITOR] Valida una URL de retorno del editor: solo la página del panel
 * (`/admin/editor.html`) en un dominio permitido. Devuelve el objeto `URL`,
 * o `null` si no es confiable.
 * @param {string} returnUrl - URL completa de retorno.
 * @param {string[]} domainPatterns - Patrones de dominio permitido.
 * @returns {URL | null}
 */
const getEditorReturnUrl = (returnUrl, domainPatterns) => {
  try {
    const target = new URL(returnUrl ?? '');

    if (target.pathname !== '/admin/editor.html') {
      return null;
    }

    if (
      domainPatterns.length &&
      !domainPatterns.some((pat) => new RegExp(pat).test(target.hostname))
    ) {
      return null;
    }

    return target;
  } catch {
    return null;
  }
};

/**
 * [EDITOR] Escapa texto para incrustarlo en las páginas de error (el
 * dominio mostrado viene del pedido y no debe poder inyectar HTML).
 * @param {string} str - Texto potencialmente hostil.
 * @returns {string} Texto seguro para HTML.
 */
const escapeHtml = (str) =>
  String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('\"', '&quot;')
    .replaceAll("'", '&#39;');

/**
 * [EDITOR] Respuesta simple con un mensaje de error visible. Se usa cuando el
 * pedido viene del editor (navegación completa, sin ventana emergente), así
 * el usuario ve el problema en pantalla en lugar de una página vacía.
 * @param {string} message - Descripción del problema.
 * @returns {Response} Response with HTML.
 */
const editorError = (message) =>
  new Response(
    `<!doctype html><html lang="es"><meta charset="utf-8">
     <title>Editor — error de acceso</title>
     <body style="font-family:system-ui;max-width:40rem;margin:4rem auto;padding:0 1rem;color:#26211c">
     <h1>No se pudo iniciar sesi&oacute;n</h1><p>${message}</p>
     <p>Volv&eacute; a la p&aacute;gina del editor (<a href="/admin/editor.html?">/admin/editor.html</a>) y prob&aacute; de nuevo.</p>
     </body></html>`,
    {
      status: 400,
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
    },
  );

/**
 * [EDITOR] Une todos los caminos de error del modo editor: redirige al panel
 * con el código del problema en el fragmento, o muestra un mensaje si ya no
 * se puede reconstruir la URL de vuelta (cookie vencida).
 * @param {Headers} headers - Encabezados del pedido (con las cookies).
 * @param {{ [key: string]: string }} env - Environment variables.
 * @param {string} [token] - Token cuando el login salió bien.
 * @param {string} [error] - Código de error cuando falló.
 * @param {string} [errorDetalle] - Texto legible adicional.
 * @returns {Response} Respuesta final del modo editor.
 */
const editorResponder = (headers, env, token, error, errorDetalle) => {
  const raw = headers.get('Cookie')?.match(/\bcms-back=([^;\s]+)/)?.[1] ?? '';

  let returnUrl = '';

  try {
    returnUrl = raw ? decodeURIComponent(raw) : '';
  } catch {
    returnUrl = '';
  }

  const target = getEditorReturnUrl(returnUrl, getDomainPatterns(env.ALLOWED_DOMAINS));

  if (!target) {
    return editorError(
      'La sesi&oacute;n de autorizaci&oacute;n venci&oacute;. Volv&eacute; al editor e inici&aacute; sesi&oacute;n de nuevo.',
    );
  }

  const fragmento = error
    ? `#error=${encodeURIComponent(errorDetalle || error)}`
    : `#access_token=${encodeURIComponent(token)}`;

  const headersSalida = new Headers({
    Location: `${target}${fragmento}`,
    // Limpia las cookies al terminar el flujo
    'Set-Cookie': `csrf-token=deleted; HttpOnly; Max-Age=0; Path=/; SameSite=Lax; Secure`,
  });

  headersSalida.append(
    'Set-Cookie',
    'cms-back=deleted; HttpOnly; Max-Age=0; Path=/; SameSite=Lax; Secure',
  );

  return new Response('', { status: 302, headers: headersSalida });
};

/**
 * Output HTML response that communicates with the window opener.
 * (Flujo original de Sveltia, intacto.)
 * @param {object} args - Options.
 * @param {string} [args.provider] - Backend name, e,g. `github`.
 * @param {string} [args.token] - OAuth token.
 * @param {string} [args.error] - Error message when an OAuth token is not available.
 * @param {string} [args.errorCode] - Error code to be used to localize the error message in
 * Sveltia CMS.
 * @param {{ [key: string]: string }} [args.env] - Environment variables.
 * @returns {Response} Response with HTML.
 */
const outputHTML = ({ provider = 'unknown', token, error, errorCode, env = {} }) => {
  const state = error ? 'error' : 'success';
  const content = error ? { provider, error, errorCode } : { provider, token };

  return new Response(
    `
      <!doctype html><html><body><script>
        (() => {
          const trustedPatterns = ${serialize(getDomainPatterns(env.ALLOWED_DOMAINS))};
          const hasToken = ${serialize(!!token)};

          const isTrusted = (origin) => {
            try {
              const { hostname } = new URL(origin);

              return trustedPatterns.some((pattern) => new RegExp(pattern).test(hostname));
            } catch {
              return false;
            }
          };

          window.addEventListener('message', ({ data, origin }) => {
            if (data !== 'authorizing:${provider}') {
              return;
            }

            // Unlike the site_id parameter, which the caller supplies, the origin of a message
            // event is set by the browser and cannot be forged by the sender, so it’s the only
            // reliable indication of who opened this popup. An error carries no secret, so it’s
            // always passed through to keep the sign-in screen informative
            if (hasToken && trustedPatterns.length && !isTrusted(origin)) {
              return;
            }

            window.opener?.postMessage(
              'authorization:${provider}:${state}:${JSON.stringify(content)}',
              origin
            );
          });
          window.opener?.postMessage('authorizing:${provider}', '*');
        })();
      </script></body></html>
    `,
    {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        // Delete CSRF token
        'Set-Cookie': `csrf-token=deleted; HttpOnly; Max-Age=0; Path=/; SameSite=Lax; Secure`,
      },
    },
  );
};

/**
 * Handle the `auth` method, which is the first request in the authorization flow.
 * @param {Request} request - HTTP request.
 * @param {{ [key: string]: string }} env - Environment variables.
 * @returns {Promise<Response>} HTTP response.
 */
const handleAuth = async (request, env) => {
  const { url } = request;
  const { origin, searchParams } = new URL(url);

  // [EDITOR] `client=editor` activa el modo del panel visual; `redirect` es el
  // origen del sitio desde el que se abrió el editor.
  const { provider, site_id: domain, scope: requestedScope, client, redirect } =
    Object.fromEntries(searchParams);

  if (!provider || !supportedProviders.includes(provider)) {
    return outputHTML({
      env,
      error: 'Your Git backend is not supported by the authenticator.',
      errorCode: 'UNSUPPORTED_BACKEND',
    });
  }

  const scope = getScope(provider, requestedScope, env);

  const {
    ALLOWED_DOMAINS,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_HOSTNAME = 'github.com',
    GITLAB_CLIENT_ID,
    GITLAB_CLIENT_SECRET,
    GITLAB_HOSTNAME = 'gitlab.com',
  } = env;

  const domainPatterns = getDomainPatterns(ALLOWED_DOMAINS);

  // Check if the domain is whitelisted
  if (
    domainPatterns.length &&
    !domainPatterns.some((pattern) => new RegExp(pattern).test(domain ?? ''))
  ) {
    // [EDITOR] En modo editor la navegación es "en la misma pestaña": una
    // página estilo popup (solo script, sin texto) se vería en blanco.
    // Mostrar el problema en pantalla para poder corregir la configuración.
    if (client === 'editor') {
      return editorError(
        `El dominio "${escapeHtml(domain ?? '')}" (host actual) no est&aacute; en la variable ` +
        `ALLOWED_DOMAINS de este worker. Corregilo en Cloudflare (Settings &gt; Variables) ` +
        `y prob&aacute; de nuevo.`,
      );
    }

    return outputHTML({
      env,
      provider,
      error: 'Your domain is not allowed to use the authenticator.',
      errorCode: 'UNSUPPORTED_DOMAIN',
    });
  }

  // Generate a random string for CSRF protection
  const csrfToken = globalThis.crypto.randomUUID().replaceAll('-', '');
  let authURL = '';

  // GitHub
  if (provider === 'github') {
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      return outputHTML({
        env,
        provider,
        error: 'OAuth app client ID or secret is not configured.',
        errorCode: 'MISCONFIGURED_CLIENT',
      });
    }

    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      scope,
      state: csrfToken,
    });

    authURL = `https://${GITHUB_HOSTNAME}/login/oauth/authorize?${params.toString()}`;
  }

  // GitLab
  if (provider === 'gitlab') {
    if (!GITLAB_CLIENT_ID || !GITLAB_CLIENT_SECRET) {
      return outputHTML({
        env,
        provider,
        error: 'OAuth app client ID or secret is not configured.',
        errorCode: 'MISCONFIGURED_CLIENT',
      });
    }

    const params = new URLSearchParams({
      client_id: GITLAB_CLIENT_ID,
      redirect_uri: `${origin}/callback`,
      response_type: 'code',
      scope,
      state: csrfToken,
    });

    authURL = `https://${GITLAB_HOSTNAME}/oauth/authorize?${params.toString()}`;
  }

  // [EDITOR] Con `client=editor` se guarda la URL de vuelta en la cookie
  // `cms-back` para que `/callback` redirija a esta misma pestaña. Se exige
  // la página del panel en un dominio permitido.
  const isEditor = client === 'editor';
  let backCookie = null;

  if (isEditor) {
    const returnUrl = getEditorReturnUrl(
      `${(redirect ?? '').replace(/\/+$/, '')}/admin/editor.html`,
      domainPatterns,
    );

    if (!returnUrl) {
      return editorError(
        'La solicitud del editor no es v&aacute;lida: el origen de retorno falta o no es un dominio permitido.',
      );
    }

    backCookie = `cms-back=${encodeURIComponent(returnUrl)}` +
      '; HttpOnly; Path=/; Max-Age=600; SameSite=Lax; Secure';
  }

  // Redirect to the authorization server
  const headersSalida = new Headers({
    Location: authURL,
    // Cookie expires in 10 minutes; Use `SameSite=Lax` to make sure the cookie is sent by the
    // browser after redirect
    'Set-Cookie': `csrf-token=${provider}_${csrfToken}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax; Secure`,
  });

  if (backCookie) {
    headersSalida.append('Set-Cookie', backCookie);
  }

  return new Response('', { status: 302, headers: headersSalida });
};

/**
 * Handle the `callback` method, which is the second request in the authorization flow.
 * @param {Request} request - HTTP request.
 * @param {{ [key: string]: string }} env - Environment variables.
 * @returns {Promise<Response>} HTTP response.
 */
const handleCallback = async (request, env) => {
  const { url, headers } = request;
  const { origin, searchParams } = new URL(url);
  const { code, state } = Object.fromEntries(searchParams);

  const [, provider, csrfToken] =
    headers.get('Cookie')?.match(/\bcsrf-token=([a-z-]+?)_([0-9a-f]{32})\b/) ?? [];

  // [EDITOR] La cookie `cms-back` solo se lee al final del flujo; con este
  // indicador los errores tempranos ya vuelven al panel en vez de quedarse
  // en la página (muda) de Sveltia.
  const isEditor = /\bcms-back=/.test(headers.get('Cookie') ?? '');

  if (!provider || !supportedProviders.includes(provider)) {
    return isEditor
      ? editorResponder(headers, env, '', 'UNSUPPORTED_BACKEND')
      : outputHTML({
          env,
          error: 'Your Git backend is not supported by the authenticator.',
          errorCode: 'UNSUPPORTED_BACKEND',
        });
  }

  if (!code || !state) {
    return isEditor
      ? editorResponder(headers, env, '', 'AUTH_CODE_REQUEST_FAILED')
      : outputHTML({
          env,
          provider,
          error: 'Failed to receive an authorization code. Please try again later.',
          errorCode: 'AUTH_CODE_REQUEST_FAILED',
        });
  }

  if (!csrfToken || state !== csrfToken) {
    return isEditor
      ? editorResponder(headers, env, '', 'CSRF_DETECTED', 'Potential CSRF attack detected.')
      : outputHTML({
          env,
          provider,
          error: 'Potential CSRF attack detected. Authentication flow aborted.',
          errorCode: 'CSRF_DETECTED',
        });
  }

  const {
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_HOSTNAME = 'github.com',
    GITLAB_CLIENT_ID,
    GITLAB_CLIENT_SECRET,
    GITLAB_HOSTNAME = 'gitlab.com',
  } = env;

  let tokenURL = '';
  let requestBody = {};

  // GitHub
  if (provider === 'github') {
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      return isEditor
        ? editorResponder(headers, env, '', 'MISCONFIGURED_CLIENT')
        : outputHTML({
            env,
            provider,
            error: 'OAuth app client ID or secret is not configured.',
            errorCode: 'MISCONFIGURED_CLIENT',
          });
    }

    tokenURL = `https://${GITHUB_HOSTNAME}/login/oauth/access_token`;
    requestBody = {
      code,
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
    };
  }

  if (provider === 'gitlab') {
    if (!GITLAB_CLIENT_ID || !GITLAB_CLIENT_SECRET) {
      return isEditor
        ? editorResponder(headers, env, '', 'MISCONFIGURED_CLIENT')
        : outputHTML({
            env,
            provider,
            error: 'OAuth app client ID or secret is not configured.',
            errorCode: 'MISCONFIGURED_CLIENT',
          });
    }

    tokenURL = `https://${GITLAB_HOSTNAME}/oauth/token`;
    requestBody = {
      code,
      client_id: GITLAB_CLIENT_ID,
      client_secret: GITLAB_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: `${origin}/callback`,
    };
  }

  let response;
  let token = '';
  let error = '';

  try {
    response = await fetch(tokenURL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
  } catch {
    //
  }

  if (!response) {
    return isEditor
      ? editorResponder(headers, env, '', 'TOKEN_REQUEST_FAILED')
      : outputHTML({
          env,
          provider,
          error: 'Failed to request an access token. Please try again later.',
          errorCode: 'TOKEN_REQUEST_FAILED',
        });
  }

  try {
    ({ access_token: token, error } = await response.json());
  } catch {
    return isEditor
      ? editorResponder(headers, env, '', 'MALFORMED_RESPONSE')
      : outputHTML({
          env,
          provider,
          error: 'Server responded with malformed data. Please try again later.',
          errorCode: 'MALFORMED_RESPONSE',
        });
  }

  // [EDITOR] Ramo final del modo editor: redirigir la pestaña al panel con
  // el token (o el error) en el fragmento. El fragmento no se envía al
  // servidor; queda solo en el navegador.
  if (isEditor) {
    const detalle = error ? searchParams.get('error_description') || error : '';
    return editorResponder(headers, env, token, error, detalle);
  }

  return outputHTML({ env, provider, token, error });
};

export default {
  /**
   * The main request handler.
   * @param {Request} request - HTTP request.
   * @param {{ [key: string]: string }} env - Environment variables.
   * @returns {Promise<Response>} HTTP response.
   * @see https://developers.cloudflare.com/workers/runtime-apis/fetch/
   * @see https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
   * @see https://docs.gitlab.com/ee/api/oauth2.html#authorization-code-flow
   */
  async fetch(request, env) {
    const { method, url } = request;
    const { pathname } = new URL(url);

    if (method === 'GET' && ['/auth', '/oauth/authorize'].includes(pathname)) {
      return handleAuth(request, env);
    }

    if (method === 'GET' && ['/callback', '/oauth/redirect'].includes(pathname)) {
      return handleCallback(request, env);
    }

    return new Response('', { status: 404 });
  },
};
