import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export async function loginUser(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    if (!userDoc.exists()) {
      throw new Error("User data not found");
    }
    return userDoc.data();
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("offline")) {
        throw new Error("Unable to connect to the server. Please check your internet connection.");
      }
      throw new Error(error.message);
    }
    throw new Error("An unknown error occurred");
  }
}

export async function createUser(email: string, password: string, accessLevel: string, clientId: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email,
      accessLevel,
      clientId
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unknown error occurred");
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unknown error occurred");
  }
}