import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';
import { cors } from 'hono/cors';
// 路径修正：使用相对路径并导入正确的函数
// feat: 导入 getEmailByPassword 函数
import { deleteEmails, findEmailById, getEmailByPassword, getEmailsByMessageTo, insertEmail, deleteExpiredEmails } from '../../packages/database/dao';
// fix: 修正数据库导入路径
import { getD1DB } from '../../packages/database/db';
import { InsertEmail, insertEmailSchema } from '../../packages/database/schema';
import { nanoid } from 'nanoid/non-secure';
import PostalMime from 'postal-mime';

// 定义 Cloudflare 绑定和环境变量的类型
export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;

  // 从 wrangler.toml 中传入的环境变量
  EMAIL_DOMAIN: string;
  COOKIES_SECRET: string;
  TURNSTILE_KEY: string;
  TURNSTILE_SECRET: string;
}

// 初始化 Hono 应用
const app = new Hono<{ Bindings: Env }>();

// 配置 CORS
app.use('/api/*', cors());

// fix: 增强请求体验证逻辑。
// 此前的实现方式在请求体解析失败时会静默处理，导致后续处理流程因缺少数据而返回一个模糊的400错误。
// 新的实现方式会严格校验请求体，如果解析为JSON失败（例如请求体为空或格式错误），将立即返回一个明确的400错误，从而阻止无效请求继续执行。
const turnstile = async (c, next) => {
  let body: any;
  try {
    // 尝试将请求体解析为JSON。如果失败，将抛出异常。
    body = await c.req.json();
  } catch (e) {
    // 捕获异常，记录错误日志，并返回一个清晰的错误响应。
    console.error("请求体解析为JSON时出错:", e);
    return c.json({ message: '错误的请求：请求体无效或为空。' }, 400);
  }

  // 将解析后的 body 存入上下文，以便下游处理器直接使用，避免重复解析。
  c.set('parsedBody', body);

  const token = body.token || c.req.header('cf-turnstile-token');
  const ip = c.req.header('CF-Connecting-IP');

  if (!token) {
    return c.json({ message: '缺少 turnstile token' }, 400);
  }

  const formData = new FormData();
  formData.append('secret', c.env.TURNSTILE_SECRET);
  formData.append('response', token);
  // 增加判断，仅当 IP 地址存在时才添加到表单数据中
  if (ip) {
      formData.append('remoteip', ip);
  }

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!data.success) {
    // feat: 增加详细的错误日志，方便调试
    console.error("Turnstile 验证失败:", data['error-codes']);
    return c.json({ message: 'token 无效' }, 400);
  }

  await next();
};

// API 路由组
const api = app.basePath('/api');

// 获取邮件列表
api.post('/emails', turnstile, async (c) => {
  const db = getD1DB(c.env.DB);
  // fix: 从上下文中获取已解析的请求体，并进行安全访问
  const body = c.get('parsedBody');
  const address = body?.address;

  if (!address) {
    return c.json({ message: 'address is required' }, 400);
  }
  // 函数调用修正：使用 getEmailsByMessageTo 函数
  const emails = await getEmailsByMessageTo(db, address as string);
  return c.json(emails);
});

// 获取单封邮件详情
api.get('/emails/:id', async (c) => {
  const db = getD1DB(c.env.DB);
  const { id } = c.req.param();
  // 函数调用修正：使用 findEmailById 函数
  const email = await findEmailById(db, id);
  if (!email) {
    return c.json({ message: 'Email not found'}, 404);
  }
  return c.json(email);
});

// 删除邮件
api.post('/delete-emails', turnstile, async (c) => {
    const db = getD1DB(c.env.DB);
    // fix: 从上下文中获取已解析的请求体，并进行安全访问
    const body = c.get('parsedBody');
    const ids = body?.ids;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return c.json({ message: 'ids are required' }, 400);
    }
    const result = await deleteEmails(db, ids as string[]);
    return c.json(result);
});

// feat: 添加登录路由
api.post('/login', turnstile, async (c) => {
  const db = getD1DB(c.env.DB);
  // fix: 从上下文中获取已解析的请求体，并进行安全访问
  const body = c.get('parsedBody');
  const password = body?.password;
  if (!password) {
    return c.json({ message: 'Password is required' }, 400);
  }
  const email = await getEmailByPassword(db, password as string);
  if (!email) {
    return c.json({ message: 'Invalid password' }, 404);
  }
  return c.json({ address: email.messageTo });
});


// 前端配置接口
app.get('/config', (c) => {
  return c.json({
    emailDomain: c.env.EMAIL_DOMAIN,
    turnstileKey: c.env.TURNSTILE_KEY,
  });
});

// 静态资源服务 (放在最后，作为默认路由)
app.get('*', serveStatic({ root: './' }));

// Worker 主处理逻辑
export default {
  // 邮件处理逻辑
  async email(message, env, ctx) {
    try {
      const db = getD1DB(env.DB);
      const raw = await new Response(message.raw).text();
      const mail = await new PostalMime().parse(raw);
      const now = new Date();
      const newEmail: InsertEmail = {
        id: nanoid(),
        messageFrom: message.from,
        messageTo: message.to,
        ...mail,
        createdAt: now,
        updatedAt: now,
      };
      const email = insertEmailSchema.parse(newEmail);
      await insertEmail(db, email);
    } catch (e) {
      console.error('处理邮件失败:', e);
    }
  },

  // HTTP 请求处理逻辑
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    // 优先处理静态资源
    if (url.pathname.startsWith('/assets/')) {
      return env.ASSETS.fetch(request);
    }
    // API 和页面路由
    return app.fetch(request, env, ctx);
  },

  // 定时任务 (清理过期邮件)
  async scheduled(event, env, ctx) {
      const db = getD1DB(env.DB);
      // 清理一小时前的邮件
      const oneHourAgo = new Date(Date.now() - 1000 * 60 * 60);
      await deleteExpiredEmails(db, oneHourAgo);
  },
};

