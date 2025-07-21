import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "./client";
import { getAuth } from "firebase/auth";
import { TimelineItem } from "@/services/elevenlabs";

// Interface for a single transcript entry, extending the TimelineItem
export interface TranscriptEntry extends Omit<TimelineItem, 'speaker_id'> {
  // speaker is already in TimelineItem
}

// Main Minute interface
export interface Minute {
  id?: string; // Firestore document ID
  title: string;
  date: Timestamp;
  summary: string;
  minutes: string; // Add this line
  transcript: TranscriptEntry[];
  audioUrl?: string; // Optional URL from Firebase Storage
  uid: string; // Firebase Auth User ID
  createdAt: Timestamp;
}

// Gets the collection reference and current user's UID
const getMinutesCollection = () => {
  const auth = getAuth();
  if (!auth.currentUser) {
    throw new Error("User is not authenticated.");
  }
  return {
    collectionRef: collection(db, "minutes"),
    uid: auth.currentUser.uid,
  };
};

// Create a new minute document in Firestore
export const addMinute = async (
  data: Omit<Minute, "id" | "uid" | "createdAt">
): Promise<Minute> => {
  const { collectionRef, uid } = getMinutesCollection();
  const newMinuteData = {
    ...data,
    uid,
    createdAt: Timestamp.now(),
  };
  const docRef = await addDoc(collectionRef, newMinuteData);
  return { ...newMinuteData, id: docRef.id };
};

// Fetch all minutes for the current user, ordered by date
export const getMinutes = async (): Promise<Minute[]> => {
  const { collectionRef, uid } = getMinutesCollection();
  const q = query(collectionRef, where("uid", "==", uid), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Minute, "id">),
    minutes: doc.data().minutes || "", // Ensure minutes is always a string
  }));
};

// Delete a minute document from Firestore
export const deleteMinute = async (id: string): Promise<void> => {
  const { collectionRef } = getMinutesCollection();
  await deleteDoc(doc(collectionRef, id));
  // Note: This does not delete the associated audio file in Storage.
};
