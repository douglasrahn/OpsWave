import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

// Create a context to store client information
let currentClientId: string | null = null;

export function getCurrentClientId(): string | null {
  return currentClientId;
}

export async function loginUser(email: string, password: string) {
  try {
    // First attempt authentication
    const userCredential = await Promise.race([
      signInWithEmailAndPassword(auth, email, password),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Login timed out. Please try again.")), 10000)
      )
    ]);

    // Then fetch client data
    try {
      console.log("Looking up client for email:", email);

      // Query clients collection to get client ID for this user's email
      const clientsQuery = query(
        collection(db, "clients"),
        where("email", "==", email)
      );
      const clientSnapshot = await getDocs(clientsQuery);

      if (clientSnapshot.empty) {
        console.log("No client found for email:", email);
        throw new Error("No client found for this user");
      }

      const clientDoc = clientSnapshot.docs[0];
      currentClientId = clientDoc.id;
      console.log("Found client ID:", currentClientId);

      // Get user data from users collection
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

      if (!userDoc.exists()) {
        throw new Error("User data not found");
      }

      return {
        ...userDoc.data(),
        clientId: currentClientId
      };
    } catch (firestoreError) {
      console.error("Firestore error:", firestoreError);
      throw new Error("Failed to fetch user data. Please try again.");
    }
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
    currentClientId = null; // Clear the stored client ID
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unknown error occurred");
  }
}