// Cloudflare Worker API (D1 Database)
const WORKER_URL = 'https://image-bg-remover.qihuaiya227.workers.dev'

export type UserProfile = {
  uid: string
  email: string | null
  display_name: string | null
  photo_url: string | null
  created_at: number
  last_login_at: number
  usage_count: number
  monthly_usage: number
}

export const getUserData = async (uid: string): Promise<UserProfile | null> => {
  try {
    const res = await fetch(`${WORKER_URL}/api/user?uid=${uid}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export const createOrUpdateUser = async (user: {
  uid: string
  email?: string | null
  displayName?: string | null
  photoURL?: string | null
}): Promise<UserProfile | null> => {
  try {
    const res = await fetch(`${WORKER_URL}/api/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        display_name: user.displayName,
        photo_url: user.photoURL,
      }),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export const incrementUsage = async (uid: string): Promise<void> => {
  try {
    await fetch(`${WORKER_URL}/api/user/increment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    })
  } catch {
    // silent fail
  }
}
