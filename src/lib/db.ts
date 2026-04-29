import { db } from "./firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  updateDoc,
  serverTimestamp,
  writeBatch,
  getCountFromServer
} from "firebase/firestore";
import { Note, Folder } from "./types";

// --- NETS (Workspaces) ---

export interface Net {
  id: string;
  userId: string;
  title: string;
  description: string;
  createdAt: number;
  noteCount?: number;
}

export const createNet = async (userId: string, title: string, description: string): Promise<Net> => {
  const newNetRef = doc(collection(db, "nets"));
  const net: Net = {
    id: newNetRef.id,
    userId,
    title,
    description,
    createdAt: Date.now(),
  };
  await setDoc(newNetRef, net);
  return { ...net, noteCount: 0 };
};

export const getUserNets = async (userId: string): Promise<Net[]> => {
  const q = query(collection(db, "nets"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  const nets = snapshot.docs.map(doc => doc.data() as Net).sort((a, b) => b.createdAt - a.createdAt);

  // Fetch note counts for each net
  for (const net of nets) {
    const notesQuery = query(collection(db, "notes"), where("netId", "==", net.id));
    const countSnapshot = await getCountFromServer(notesQuery);
    net.noteCount = countSnapshot.data().count;
  }

  return nets;
};

export const updateNetDB = async (netId: string, updates: Partial<Net>) => {
  const netRef = doc(db, "nets", netId);
  await updateDoc(netRef, updates);
};

export const deleteNetDB = async (netId: string) => {
  const netRef = doc(db, "nets", netId);
  await deleteDoc(netRef);
  
  // Opcional: Aqui você poderia também deletar todas as pastas e notas associadas a esta net
  // Para manter a segurança dos dados caso o usuário queira restaurar, ou implementar a deleção em batch
};

// --- FOLDERS ---

export const getNetFolders = async (netId: string): Promise<Folder[]> => {
  const q = query(collection(db, "folders"), where("netId", "==", netId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Folder);
};

export const saveFolder = async (netId: string, folder: Folder) => {
  const folderRef = doc(db, "folders", folder.id);
  await setDoc(folderRef, { ...folder, netId });
};

export const updateFolderDB = async (folderId: string, updates: Partial<Folder>) => {
  const folderRef = doc(db, "folders", folderId);
  await updateDoc(folderRef, updates);
};

export const deleteFolderDB = async (folderId: string) => {
  const folderRef = doc(db, "folders", folderId);
  await deleteDoc(folderRef);
};

// --- NOTES ---

export const getNetNotes = async (netId: string): Promise<Note[]> => {
  const q = query(collection(db, "notes"), where("netId", "==", netId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Note);
};

export const saveNote = async (netId: string, note: Note) => {
  const noteRef = doc(db, "notes", note.id);
  await setDoc(noteRef, { ...note, netId });
};

export const updateNoteDB = async (noteId: string, updates: Partial<Note>) => {
  const noteRef = doc(db, "notes", noteId);
  await updateDoc(noteRef, updates);
};

export const deleteNoteDB = async (noteId: string) => {
  const noteRef = doc(db, "notes", noteId);
  await deleteDoc(noteRef);
};

// --- BATCH DELETE (Useful when deleting a folder with subfolders and notes) ---
export const batchDeleteFolderAndContents = async (
  folderIdToDelete: string, 
  allFolders: Folder[], 
  allNotes: Note[]
) => {
  const batch = writeBatch(db);

  // 1. Encontrar todos os IDs de pastas descendentes (recursivo)
  const getAllDescendantIds = (fid: string): string[] => {
    const children = allFolders.filter((f) => f.parentId === fid);
    return [fid, ...children.flatMap((c) => getAllDescendantIds(c.id))];
  };
  const folderIdsToDelete = getAllDescendantIds(folderIdToDelete);

  // 2. Adicionar as pastas ao batch de exclusão
  folderIdsToDelete.forEach(fid => {
    batch.delete(doc(db, "folders", fid));
  });

  // 3. Mover as notas para a pasta pai (ou raiz se for null)
  const folder = allFolders.find(f => f.id === folderIdToDelete);
  const targetParentId = folder?.parentId ?? null;
  
  const notesToMove = allNotes.filter(n => n.folderId === folderIdToDelete);
  notesToMove.forEach(note => {
    batch.update(doc(db, "notes", note.id), { folderId: targetParentId });
  });

  await batch.commit();
  return { deletedFolderIds: folderIdsToDelete, targetParentId };
};

// --- USER PROFILES ---

export interface UserProfile {
  username: string;
  updatedAt: number;
}

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", userId);
  const snap = await getDocs(query(collection(db, "users"), where("__name__", "==", userId)));
  if (snap.empty) return null;
  return snap.docs[0].data() as UserProfile;
};

export const saveUserProfile = async (userId: string, data: Partial<UserProfile>) => {
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, { ...data, updatedAt: Date.now() }, { merge: true });
};
