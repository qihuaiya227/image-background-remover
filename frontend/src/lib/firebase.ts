import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth'

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
export const googleProvider = new GoogleAuthProvider()

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider)
export const logOut = () => signOut(auth)
export const onAuthChange = (callback: (user: User | null) => void) => 
  onAuthStateChanged(auth, callback)
