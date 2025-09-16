import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { unsanitizeKey } from '../../utils/KeySanitizer';

export const fetchDocumentData = async (documentId: string) => {
  try {
    const docRef = doc(db, "employeeData", documentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const unsanitizedData: Record<string, any> = {};
      
      // Convert sanitized keys back to original format
      Object.keys(data).forEach(key => {
        const originalKey = unsanitizeKey(key);
        unsanitizedData[originalKey] = data[key];
      });
      
      return unsanitizedData;
    } else {
      console.log("No such document exists!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching document:", error);
    throw error;
  }
};