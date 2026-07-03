import { db, collection, getDocs, updateDoc, doc } from '../firebase-config.js';

// Запускать раз в неделю (можно через Cloud Function или вручную)
export async function resetWeeklyExperience() {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    const batch = [];
    snapshot.forEach(userDoc => {
        batch.push(updateDoc(doc(db, 'users', userDoc.id), {
            weeklyExperience: 0
        }));
    });
    
    await Promise.all(batch);
    console.log('✅ Weekly experience сброшен для всех игроков');
}