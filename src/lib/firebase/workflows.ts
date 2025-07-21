import { addDoc, collection, deleteDoc, doc, getDocs, query, where, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "./client";
import { getAuth } from "firebase/auth";

// Interface for files associated with a workflow
export interface WorkflowFile {
  id: string; // Firestore document ID or a temporary ID for UI
  name: string;
  url: string; // URL from Firebase Storage
  createdAt?: Timestamp; // Optional for files not yet saved
}

// Main Workflow interface matching the page's data structure
export interface Workflow {
  id?: string; // Firestore document ID
  name: string;
  description?: string;
  mermaidCode: string;
  files: WorkflowFile[];
  uid: string; // Firebase Auth User ID
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Gets the collection reference and current user's UID
const getWorkflowsCollection = () => {
  const auth = getAuth();
  if (!auth.currentUser) {
    throw new Error("User is not authenticated.");
  }
  return {
    collectionRef: collection(db, "workflows"),
    uid: auth.currentUser.uid,
  };
};

// Create a new workflow document in Firestore
export const addWorkflow = async (
  data: Omit<Workflow, "id" | "uid" | "createdAt" | "updatedAt" | "files">
): Promise<Workflow> => {
  const { collectionRef, uid } = getWorkflowsCollection();
  const now = Timestamp.now();
  const newWorkflowData = {
    ...data,
    uid,
    files: [], // Initialize with empty files array
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await addDoc(collectionRef, newWorkflowData);
  return { ...newWorkflowData, id: docRef.id };
};

// Fetch all workflows for the current user
export const getWorkflows = async (): Promise<Workflow[]> => {
  const { collectionRef, uid } = getWorkflowsCollection();
  const q = query(collectionRef, where("uid", "==", uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Workflow, "id">),
  }));
};

// Update an existing workflow document
export const updateWorkflow = async (
  id: string,
  data: Partial<Omit<Workflow, "id" | "uid" | "createdAt">>
): Promise<void> => {
  const { collectionRef } = getWorkflowsCollection();
  const docRef = doc(collectionRef, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
};


// Delete a workflow document from Firestore
export const deleteWorkflow = async (id: string): Promise<void> => {
  const { collectionRef } = getWorkflowsCollection();
  await deleteDoc(doc(collectionRef, id));
  // Note: This does not delete associated files in Storage.
  // That would require additional logic.
};
