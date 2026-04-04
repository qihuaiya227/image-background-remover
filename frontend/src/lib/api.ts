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
  credits: number
}

export type CheckResult = {
  allowed: boolean
  reason: string
  credits?: number
  monthlyUsage?: number
  monthlyLimit?: number | null
  freeDailyLimit?: number
  remaining?: number
}

export type UseResult = {
  success: boolean
  credits?: number
  usageCount?: number
  monthlyUsage?: number
  error?: string
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

export const checkQuota = async (uid: string): Promise<CheckResult | null> => {
  try {
    const res = await fetch(`${WORKER_URL}/api/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export const useCredits = async (uid: string): Promise<UseResult> => {
  try {
    const res = await fetch(`${WORKER_URL}/api/use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false, error: data.error || 'failed' }
    }
    return data
  } catch {
    return { success: false, error: 'network_error' }
  }
}
