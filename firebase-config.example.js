// Salin file ini menjadi firebase-config.js, lalu isi dengan nilai dari Firebase Console.
export const firebaseConfig = {
  apiKey: "ISI_API_KEY",
  authDomain: "ISI_PROJECT_ID.firebaseapp.com",
  projectId: "ISI_PROJECT_ID",
  storageBucket: "ISI_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "ISI_SENDER_ID",
  appId: "ISI_APP_ID",
  measurementId: "ISI_MEASUREMENT_ID"
};

// Hanya akun student UNNES (email @students.unnes.ac.id).
// Aturan yang sebenarnya ditegakkan ada di firestore.rules; ini hanya pemeriksaan tambahan di browser.
export const UNNES_REGEX = /@students\.unnes\.ac\.id$/i;
