import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, increment } from 'firebase/firestore'
import type { User } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyB7HSNmHcATF6dsRXozuyuCipq8aWX4VyY",
  authDomain: "remove-8b1ad.firebaseapp.com",
  projectId: "remove-8b1ad",
  storageBucket: "remove-8b1ad.appspot.com",
  messagingSenderId: "",
  appId: ""
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

export type { User } from 'firebase/auth'

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider)
export const logOut = () => signOut(auth)
export const onAuthChange = (callback: (user: User | null) => void) => 
  onAuthStateChanged(auth, callback)

// 用户数据操作
export const createOrUpdateUser = async (user: User) => {
  const userRef = doc(db, 'users', user.uid)
  const snap = await getDoc(userRef)
  
  if (!snap.exists()) {
    // 新用户注册
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      usageCount: 0,
      monthlyUsage: 0,
    })
  } else {
    // 老用户登录更新
    await setDoc(userRef, {
      lastLoginAt: serverTimestamp(),
    }, { merge: true })
  }
}

export const getUserData = async (uid: string) => {
  const userRef = doc(db, 'users', uid)
  const snap = await getDoc(userRef)
  if (snap.exists()) {
    return snap.data()
  }
  return null
}

export const incrementUsage = async (uid: string) => {
  const userRef = doc(db, 'users', uid)
  await setDoc(userRef, {
    usageCount: increment(1),
    monthlyUsage: increment(1),
  }, { merge: true })
}
