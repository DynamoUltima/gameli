const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// We need an admin SDK or from the client SDK?
// Best way: just use a tool to check the project? Wait, I don't have their firebase admin credentials.
