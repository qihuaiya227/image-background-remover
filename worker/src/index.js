const FREE_DAILY_LIMIT_ANON = 1
const FREE_DAILY_LIMIT_USER = 3
const REGISTER_BONUS = 3
const COST_PER_CALL = 1

// PayPal 配置
const PAYPAL_CLIENT_ID = 'AbfW5y9J4Vm5mSws7UUY8AuIci_0-lSQ08TkuUkAqadr4bk90oX6D21BgW15V0vRPJa2LKfNVTgoWpAZ'
const PAYPAL_SECRET = 'EPrtorzuM5zZsMiee8lABabrsr_9qMbrIbVXDt2I6MGNr1tCD_LLGUAq36IuNxKQbOVjvXeWhUmY-Rn1'
const PAYPAL_BASE = 'https://api-m.sandbox.paypal.com' // Sandbox，生产环境改为 api-m.paypal.com

// Credits 映射
const CREDIT_PLANS = {
  'basic': { credits: 5, name: 'Basic Monthly' },
  'starter': { credits: 12, name: 'Starter Monthly' },
  'pro': { credits: 25, name: 'Pro Monthly' },
  'unlimited': { credits: 50, name: 'Unlimited Monthly' },
}

let cachedToken = null
let tokenExpiry = 0

async function getPayPalToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }
  const resp = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en_US',
      'Authorization': 'Basic ' + btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`),
    },
    body: 'grant_type=client_credentials',
  })
  const data = await resp.json()
  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return cachedToken
}

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const url = new URL(request.url)
    const path = url.pathname
    const DB = env.DB

    // GET /api/user?uid=xxx
    if (path === '/api/user' && request.method === 'GET') {
      const uid = url.searchParams.get('uid')
      if (!uid) {
        return new Response(JSON.stringify({ error: 'uid required' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      const user = await DB.prepare('SELECT * FROM users WHERE uid = ?').bind(uid).first()
      return new Response(JSON.stringify(this.formatUser(user)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /api/user - 注册/登录用户
    if (path === '/api/user' && request.method === 'POST') {
      try {
        const body = await request.json()
        const { uid, email, display_name, photo_url } = body
        if (!uid) {
          return new Response(JSON.stringify({ error: 'uid required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const now = Math.floor(Date.now() / 1000)
        const today = new Date().toISOString().split('T')[0]
        const existing = await DB.prepare('SELECT * FROM users WHERE uid = ?').bind(uid).first()

        if (existing) {
          await DB.prepare(
            'UPDATE users SET last_login_at = ?, daily_date = CASE WHEN daily_date != ? THEN ? ELSE daily_date END, daily_usage = CASE WHEN daily_date != ? THEN 0 ELSE daily_usage END WHERE uid = ?'
          ).bind(now, today, today, today, uid).run()
        } else {
          await DB.prepare(
            `INSERT INTO users (uid, email, display_name, photo_url, created_at, last_login_at, usage_count, daily_usage, daily_date, monthly_usage, monthly_reset_at, credits) 
             VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, 0, ?, ?)`
          ).bind(uid, email || null, display_name || null, photo_url || null, now, now, today, now, REGISTER_BONUS).run()
        }

        const user = await DB.prepare('SELECT * FROM users WHERE uid = ?').bind(uid).first()
        return new Response(JSON.stringify(this.formatUser(user)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // POST /api/check - 检查额度
    if (path === '/api/check' && request.method === 'POST') {
      const body = await request.json()
      const { uid, anon_id } = body
      const today = new Date().toISOString().split('T')[0]

      if (uid) {
        const user = await DB.prepare('SELECT * FROM users WHERE uid = ?').bind(uid).first()
        if (!user) return new Response(JSON.stringify({ error: 'user_not_found' }), { headers: corsHeaders })

        const now = Math.floor(Date.now() / 1000)
        const thisMonth = new Date().toISOString().slice(0, 7)
        const lastMonth = user.monthly_reset_at ? new Date(user.monthly_reset_at * 1000).toISOString().slice(0, 7) : null
        if (lastMonth !== thisMonth) {
          await DB.prepare('UPDATE users SET monthly_usage = 0, monthly_reset_at = ? WHERE uid = ?').bind(now, uid).run()
        }

        let dailyUsage = user.daily_usage || 0
        if (user.daily_date !== today) {
          dailyUsage = 0
          await DB.prepare('UPDATE users SET daily_usage = 0, daily_date = ? WHERE uid = ?').bind(today, uid).run()
        }

        const hasCredits = (user.credits || 0) >= COST_PER_CALL
        const withinDailyLimit = dailyUsage < FREE_DAILY_LIMIT_USER

        if (withinDailyLimit) {
          return new Response(JSON.stringify({
            allowed: true, reason: 'free_daily',
            remaining: FREE_DAILY_LIMIT_USER - dailyUsage,
            dailyLimit: FREE_DAILY_LIMIT_USER,
            hasCredits: true, credits: user.credits || 0,
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        } else if (hasCredits) {
          return new Response(JSON.stringify({
            allowed: true, reason: 'has_credits',
            remaining: 0, dailyLimit: FREE_DAILY_LIMIT_USER,
            hasCredits: true, credits: user.credits || 0,
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        } else {
          return new Response(JSON.stringify({
            allowed: false, reason: 'no_credits',
            remaining: 0, dailyLimit: FREE_DAILY_LIMIT_USER,
            hasCredits: false, credits: 0,
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
      } else {
        if (!anon_id) {
          return new Response(JSON.stringify({ error: 'anon_id required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        const anon = await DB.prepare('SELECT * FROM anon_usage WHERE anon_id = ?').bind(anon_id).first()
        let dailyUsage = anon ? (anon.daily_usage || 0) : 0
        const lastDate = anon ? anon.daily_date : null
        if (lastDate !== today) dailyUsage = 0
        const allowed = dailyUsage < FREE_DAILY_LIMIT_ANON
        return new Response(JSON.stringify({
          allowed, reason: allowed ? 'free_anonymous' : 'daily_limit_reached',
          remaining: Math.max(0, FREE_DAILY_LIMIT_ANON - dailyUsage),
          dailyLimit: FREE_DAILY_LIMIT_ANON,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // POST /api/use - 实际使用扣费
    if (path === '/api/use' && request.method === 'POST') {
      try {
        const body = await request.json()
        const { uid, anon_id } = body
        const today = new Date().toISOString().split('T')[0]
        const now = Math.floor(Date.now() / 1000)

        if (uid) {
          const user = await DB.prepare('SELECT * FROM users WHERE uid = ?').bind(uid).first()
          if (!user) {
            return new Response(JSON.stringify({ error: 'user_not_found' }), {
              status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          let dailyUsage = user.daily_usage || 0
          if (user.daily_date !== today) dailyUsage = 0
          const usedFreeToday = dailyUsage >= FREE_DAILY_LIMIT_USER
          const hasCredits = (user.credits || 0) >= COST_PER_CALL

          if (usedFreeToday && !hasCredits) {
            return new Response(JSON.stringify({ error: 'no_credits', reason: 'daily_limit_and_no_credits' }), {
              status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          if (usedFreeToday) {
            await DB.prepare(
              'UPDATE users SET credits = credits - ?, usage_count = usage_count + 1, monthly_usage = monthly_usage + 1 WHERE uid = ?'
            ).bind(COST_PER_CALL, uid).run()
          } else {
            await DB.prepare(
              'UPDATE users SET daily_usage = daily_usage + 1, usage_count = usage_count + 1, monthly_usage = monthly_usage + 1 WHERE uid = ?'
            ).bind(uid).run()
          }

          const updated = await DB.prepare('SELECT credits, daily_usage, usage_count, monthly_usage FROM users WHERE uid = ?').bind(uid).first()
          return new Response(JSON.stringify({
            success: true, credits: updated.credits, dailyUsage: updated.daily_usage,
            usageCount: updated.usage_count, monthlyUsage: updated.monthly_usage,
            usedFree: !usedFreeToday,
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

        } else if (anon_id) {
          const anon = await DB.prepare('SELECT * FROM anon_usage WHERE anon_id = ?').bind(anon_id).first()
          let dailyUsage = anon ? (anon.daily_usage || 0) : 0
          const lastDate = anon ? anon.daily_date : null
          if (lastDate !== today) dailyUsage = 0

          if (dailyUsage >= FREE_DAILY_LIMIT_ANON) {
            return new Response(JSON.stringify({ error: 'daily_limit_reached', reason: 'anonymous_daily_limit' }), {
              status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          if (anon) {
            await DB.prepare(
              'UPDATE anon_usage SET daily_usage = daily_usage + 1, usage_count = usage_count + 1, daily_date = ? WHERE anon_id = ?'
            ).bind(today, anon_id).run()
          } else {
            await DB.prepare(
              'INSERT INTO anon_usage (anon_id, daily_date, daily_usage, usage_count) VALUES (?, ?, 1, 1)'
            ).bind(anon_id, today).run()
          }

          return new Response(JSON.stringify({
            success: true, remaining: FREE_DAILY_LIMIT_ANON - dailyUsage - 1,
            dailyLimit: FREE_DAILY_LIMIT_ANON, usedFree: true,
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

        } else {
          return new Response(JSON.stringify({ error: 'uid or anon_id required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // POST /api/create-order - 创建 PayPal 订单
    if (path === '/api/create-order' && request.method === 'POST') {
      try {
        const body = await request.json()
        const { plan, uid } = body

        if (!uid || !plan) {
          return new Response(JSON.stringify({ error: 'uid and plan required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const planInfo = CREDIT_PLANS[plan]
        if (!planInfo) {
          return new Response(JSON.stringify({ error: 'invalid plan' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const token = await getPayPalToken()
        const orderPayload = {
          intent: 'CAPTURE',
          purchase_units: [{
            description: planInfo.name,
            amount: {
              currency_code: 'USD',
              value: plan === 'basic' ? '2.99' : plan === 'starter' ? '4.99' : plan === 'pro' ? '9.99' : '19.99',
            },
            custom_id: `${uid}:${plan}`,
          }],
          application_context: {
            brand_name: 'Debackground Shop',
            landing_page: 'BILLING',
            user_action: 'PAY_NOW',
            return_url: `https://www.debackground.shop/pricing?success=1&plan=${plan}&uid=${uid}`,
            cancel_url: `https://www.debackground.shop/pricing?canceled=1`,
          },
        }

        const resp = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(orderPayload),
        })

        const order = await resp.json()
        if (!resp.ok) {
          return new Response(JSON.stringify({ error: order.message || 'PayPal error', detail: order }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const approveUrl = order.links.find(l => l.rel === 'approve')?.href
        return new Response(JSON.stringify({
          orderId: order.id,
          approveUrl,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // POST /api/capture-order - 捕获 PayPal 订单（用户支付后前端回调）
    if (path === '/api/capture-order' && request.method === 'POST') {
      try {
        const body = await request.json()
        const { orderId, uid, plan } = body

        if (!orderId || !uid || !plan) {
          return new Response(JSON.stringify({ error: 'orderId, uid, plan required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const planInfo = CREDIT_PLANS[plan]
        if (!planInfo) {
          return new Response(JSON.stringify({ error: 'invalid plan' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const token = await getPayPalToken()
        const resp = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        const result = await resp.json()

        if (result.status === 'COMPLETED') {
          // 充值 Credits
          await DB.prepare(
            'UPDATE users SET credits = credits + ? WHERE uid = ?'
          ).bind(planInfo.credits, uid).run()

          const user = await DB.prepare('SELECT credits FROM users WHERE uid = ?').bind(uid).first()
          return new Response(JSON.stringify({
            success: true,
            credits: user?.credits || 0,
            addedCredits: planInfo.credits,
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        return new Response(JSON.stringify({ error: 'payment_not_completed', status: result.status }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // POST /api/user/increment - 兼容旧代码
    if (path === '/api/user/increment' && request.method === 'POST') {
      const body = await request.json()
      const { uid } = body
      if (uid) {
        await DB.prepare(
          'UPDATE users SET usage_count = usage_count + 1, monthly_usage = monthly_usage + 1 WHERE uid = ?'
        ).bind(uid).run()
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response('Not Found', { status: 404 })
  },

  formatUser(user) {
    if (!user) return null
    return {
      uid: user.uid,
      email: user.email,
      display_name: user.display_name,
      photo_url: user.photo_url,
      created_at: user.created_at,
      last_login_at: user.last_login_at,
      usage_count: user.usage_count,
      monthly_usage: user.monthly_usage,
      daily_usage: user.daily_usage || 0,
      daily_date: user.daily_date,
      credits: user.credits || 0,
    }
  }
}
