/**
 * Gemini API 中转 Worker
 *
 * 用法：
 *   将请求发到本 Worker，路径格式与 Gemini API 一致
 *
 * 示例：
 *   POST https://your-worker.workers.dev/v1beta/models/gemini-pro:generateContent
 *   或
 *   POST https://your-worker.workers.dev/v1/models/gemini-2.0-flash:generateContent
 *
 * Body 和 Header 与官方 Gemini API 完全一致
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com';

// 可选：简单鉴权，ENV 里填的 key，用户请求时放在 x-api-key header 里
const AUTHORIZED_KEYS = (() => {
  const keys = GEMINI_API_KEY || '';
  return keys ? keys.split(',').map(k => k.trim()).filter(Boolean) : [];
})();

const ENABLE_AUTH = AUTHORIZED_KEYS.length > 0;

async function handleRequest(request) {
  const url = new URL(request.url);

  // 提取路径和参数，透传给 Gemini
  const geminiPath = url.pathname;
  const geminiParams = url.search;

  // 构造目标 URL
  const targetUrl = `${GEMINI_BASE}${geminiPath}${geminiParams}`;

  // 简单鉴权
  if (ENABLE_AUTH) {
    const clientKey = request.headers.get('x-api-key') || '';
    if (!AUTHORIZED_KEYS.includes(clientKey)) {
      return new Response(JSON.stringify({
        error: {
          code: 401,
          message: 'Unauthorized: invalid API key',
          status: 'UNAUTHENTICATED'
        }
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 构造转发的请求
  const headers = new Headers(request.headers);
  // 移除自定义鉴权头，避免泄露
  headers.delete('x-api-key');
  // 确保有 Content-Type
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const forwardRequest = new Request(targetUrl, {
    method: request.method,
    headers: headers,
    body: request.body,
    redirect: 'follow'
  });

  try {
    const response = await fetch(forwardRequest);

    // 透传响应头（除了 Cloudflare 内部相关的）
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (!['cf-ray', 'cf-cache-status', 'x-served-by'].includes(key)) {
        responseHeaders.set(key, value);
      }
    });

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: {
        code: 502,
        message: `Failed to reach Gemini API: ${err.message}`,
        status: 'BAD_GATEWAY'
      }
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
