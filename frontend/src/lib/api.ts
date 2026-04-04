const WORKER_URL = 'https://image-bg-remover.qihuaiya227.workers.dev'
const SITE_URL = 'https://www.debackground.shop'

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
  dailyUsage?: number
  dailyLimit?: number
  remaining?: number
  hasCredits?: boolean
}

export type UseResult = {
  success: boolean
  credits?: number
  dailyUsage?: number
  usageCount?: number
  monthlyUsage?: number
  remaining?: number
  usedFree?: boolean
  error?: string
  reason?: string
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

// 获取或创建匿名ID（存储在 localStorage）
export const getAnonId = (): string => {
  if (typeof window === 'undefined') return ''
  let anonId = localStorage.getItem('anon_id')
  if (!anonId) {
    anonId = 'anon_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('anon_id', anonId)
  }
  return anonId
}

export const checkQuota = async (uid?: string): Promise<CheckResult | null> => {
  try {
    const body: Record<string, string> = {}
    if (uid) {
      body.uid = uid
    } else {
      body.anon_id = getAnonId()
    }
    const res = await fetch(`${WORKER_URL}/api/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export const useCredits = async (uid?: string): Promise<UseResult> => {
  try {
    const body: Record<string, string> = {}
    if (uid) {
      body.uid = uid
    } else {
      body.anon_id = getAnonId()
    }
    const res = await fetch(`${WORKER_URL}/api/use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false, error: data.error || 'failed', reason: data.reason }
    }
    return data
  } catch {
    return { success: false, error: 'network_error' }
  }
}

export type OrderResult = {
  orderId: string
  approveUrl: string
}

export type CaptureResult = {
  success: boolean
  credits?: number
  addedCredits?: number
  error?: string
}

export const createOrder = async (uid: string, plan: string): Promise<OrderResult | null> => {
  try {
    const res = await fetch(`${WORKER_URL}/api/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, plan }),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export const captureOrder = async (orderId: string, uid: string, plan: string): Promise<CaptureResult | null> => {
  try {
    const res = await fetch(`${WORKER_URL}/api/capture-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, uid, plan }),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
