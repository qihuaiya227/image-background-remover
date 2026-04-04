const FREE_DAILY_LIMIT = 2       // 未登录/游客每天免费次数
const REGISTER_BONUS = 3        // 注册赠送次数
const COST_PER_CALL = 1          // 每次调用扣1 credit

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
        const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

        const existing = await DB.prepare('SELECT * FROM users WHERE uid = ?').bind(uid).first()

        if (existing) {
          // 老用户：只更新时间
          await DB.prepare(
            'UPDATE users SET last_login_at = ? WHERE uid = ?'
          ).bind(now, uid).run()
        } else {
          // 新用户：创建并送 REGISTER_BONUS 次数
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

    // POST /api/check - 检查今日是否还能使用（未登录游客用）
    if (path === '/api/check' && request.method === 'POST') {
      const body = await request.json()
      const { uid } = body

      if (uid) {
        // 登录用户：用 credits
        const user = await DB.prepare('SELECT credits, daily_date, daily_usage, monthly_reset_at, monthly_usage FROM users WHERE uid = ?').bind(uid).first()
        if (!user) return new Response(JSON.stringify({ allowed: false, reason: 'user_not_found' }), { headers: corsHeaders })

        // 重置月度
        const now = Math.floor(Date.now() / 1000)
        const thisMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
        const lastMonth = user.monthly_reset_at ? new Date(user.monthly_reset_at * 1000).toISOString().slice(0, 7) : null
        
        let monthlyUsage = user.monthly_usage || 0
        if (lastMonth !== thisMonth) {
          monthlyUsage = 0
          await DB.prepare('UPDATE users SET monthly_usage = 0, monthly_reset_at = ? WHERE uid = ?').bind(now, uid).run()
        }

        const hasCredits = (user.credits || 0) >= COST_PER_CALL
        return new Response(JSON.stringify({
          allowed: hasCredits,
          reason: hasCredits ? 'has_credits' : 'no_credits',
          credits: user.credits || 0,
          monthlyUsage,
          monthlyLimit: null, // 无月限制了
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      } else {
        // 游客：每天 FREE_DAILY_LIMIT 次
        const today = new Date().toISOString().split('T')[0]
        const dailyUsage = 0 // 游客不记录
        const allowed = dailyUsage < FREE_DAILY_LIMIT
        return new Response(JSON.stringify({
          allowed,
          reason: allowed ? 'free_usage' : 'daily_limit_reached',
          freeDailyLimit: FREE_DAILY_LIMIT,
          remaining: FREE_DAILY_LIMIT - dailyUsage,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // POST /api/use - 实际使用（扣费）
    if (path === '/api/use' && request.method === 'POST') {
      try {
        const body = await request.json()
        const { uid } = body
        if (!uid) {
          return new Response(JSON.stringify({ error: 'uid required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const user = await DB.prepare('SELECT * FROM users WHERE uid = ?').bind(uid).first()
        if (!user) {
          return new Response(JSON.stringify({ error: 'user_not_found' }), {
            status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const now = Math.floor(Date.now() / 1000)
        const today = new Date().toISOString().split('T')[0]

        // 检查 credits
        if ((user.credits || 0) < COST_PER_CALL) {
          return new Response(JSON.stringify({ error: 'no_credits', credits: user.credits || 0 }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // 扣费
        await DB.prepare(
          'UPDATE users SET credits = credits - ?, usage_count = usage_count + 1, monthly_usage = monthly_usage + 1, last_login_at = ? WHERE uid = ?'
        ).bind(COST_PER_CALL, now, uid).run()

        const updated = await DB.prepare('SELECT credits, usage_count, monthly_usage FROM users WHERE uid = ?').bind(uid).first()

        return new Response(JSON.stringify({
          success: true,
          credits: updated.credits,
          usageCount: updated.usage_count,
          monthlyUsage: updated.monthly_usage,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // POST /api/user/increment - 兼容旧代码（废弃）
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
      credits: user.credits || 0,
    }
  }
}
