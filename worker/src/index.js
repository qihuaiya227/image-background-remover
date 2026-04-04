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

    // D1 database binding
    const DB = env.DB

    // GET /api/user?uid=xxx - Get user data
    if (path === '/api/user' && request.method === 'GET') {
      const uid = url.searchParams.get('uid')
      if (!uid) {
        return new Response(JSON.stringify({ error: 'uid required' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      const result = await DB.prepare(
        'SELECT * FROM users WHERE uid = ?'
      ).bind(uid).first()
      return new Response(JSON.stringify(result || null), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /api/user - Create or update user
    if (path === '/api/user' && request.method === 'POST') {
      try {
        const body = await request.json()
        const { uid, email, display_name, photo_url } = body
        if (!uid) {
          return new Response(JSON.stringify({ error: 'uid required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const now = Math.floor(Date.now() / 1000)
        const existing = await DB.prepare(
          'SELECT uid FROM users WHERE uid = ?'
        ).bind(uid).first()

        if (existing) {
          // Update last_login_at
          await DB.prepare(
            'UPDATE users SET last_login_at = ? WHERE uid = ?'
          ).bind(now, uid).run()
        } else {
          // Insert new user
          await DB.prepare(
            'INSERT INTO users (uid, email, display_name, photo_url, created_at, last_login_at, usage_count, monthly_usage) VALUES (?, ?, ?, ?, ?, ?, 0, 0)'
          ).bind(uid, email || null, display_name || null, photo_url || null, now, now).run()
        }

        const user = await DB.prepare('SELECT * FROM users WHERE uid = ?').bind(uid).first()
        return new Response(JSON.stringify(user), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // POST /api/user/increment - Increment usage count
    if (path === '/api/user/increment' && request.method === 'POST') {
      try {
        const body = await request.json()
        const { uid } = body
        if (!uid) {
          return new Response(JSON.stringify({ error: 'uid required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        await DB.prepare(
          'UPDATE users SET usage_count = usage_count + 1, monthly_usage = monthly_usage + 1 WHERE uid = ?'
        ).bind(uid).run()
        const user = await DB.prepare('SELECT * FROM users WHERE uid = ?').bind(uid).first()
        return new Response(JSON.stringify(user), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    return new Response('Not Found', { status: 404 })
  }
}
