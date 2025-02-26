import { auth } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, UserCredential } from "firebase/auth";
import { saveSessionInfo, clearSessionData, getSessionInfo } from "./localStorage";

// Updated to retrieve client ID from local storage
export function getCurrentClientId(): string | null {
  const sessionInfo = getSessionInfo();
  return sessionInfo ? sessionInfo.clientId : null;
}

export async function loginUser(email: string, password: string) {
  try {
    // First attempt authentication
    const userCredential = await Promise.race([
      signInWithEmailAndPassword(auth, email, password) as Promise<UserCredential>,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Login timed out. Please try again.")), 10000)
      ) as Promise<never>
    ]);

    // Get the Firebase UID and save session info
    const success = saveSessionInfo(userCredential.user.uid);
    if (!success) {
      throw new Error("No client found for this user");
    }

    return {
      email: userCredential.user.email,
      uid: userCredential.user.uid
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        throw new Error("Login timed out. Please try again.");
      }
      if (error.message.includes("wrong-password")) {
        throw new Error("Incorrect password.");
      }
      if (error.message.includes("user-not-found")) {
        throw new Error("No account found with this email.");
      }
      if (error.message.includes("too-many-requests")) {
        throw new Error("Too many attempts. Please try again later.");
      }
      if (error.message.includes("offline")) {
        throw new Error("Unable to connect. Please check your internet connection.");
      }
      throw new Error(error.message);
    }
    throw new Error("An unknown error occurred");
  }
}

export async function createUser(email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return {
      email: userCredential.user.email,
      uid: userCredential.user.uid
    };
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
    clearSessionData(); // Clear the stored client ID and uid
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unknown error occurred");
  }
}