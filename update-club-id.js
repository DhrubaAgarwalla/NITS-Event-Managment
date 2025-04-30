// Update Club ID Script
// This script updates the club ID in the database to match a Firebase Authentication user ID
// Run with: node update-club-id.js old-id new-id

import { initializeApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  get,
  set,
  remove,
  query,
  orderByChild,
  equalTo
} from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Hardcoded Firebase configuration from .env
const firebaseConfig = {
  apiKey: "AIzaSyDpZtD_EDIEJLqdpvgU0UGSKGCzVB0f7Pw",
  authDomain: "nits-event.firebaseapp.com",
  projectId: "nits-event",
  storageBucket: "nits-event.firebasestorage.app",
  messagingSenderId: "323777820197",
  appId: "1:323777820197:web:c446df0f87553ea460f1cc",
  databaseURL: "https://nits-event-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Get command line arguments
const oldClubId = process.argv[2]; // Pass as first argument
const newClubId = process.argv[3]; // Pass as second argument

if (!oldClubId || !newClubId) {
  console.error('Please provide old and new club IDs as arguments:');
  console.error('node update-club-id.js old-id new-id');
  process.exit(1);
}

// Function to update club ID
async function updateClubId() {
  try {
    console.log(`Updating club ID from ${oldClubId} to ${newClubId}...`);
    
    // Get the club data
    const clubRef = ref(database, `clubs/${oldClubId}`);
    const clubSnapshot = await get(clubRef);
    
    if (!clubSnapshot.exists()) {
      console.error(`Club with ID ${oldClubId} not found!`);
      process.exit(1);
    }
    
    const clubData = clubSnapshot.val();
    console.log('Found club data:', clubData.name);
    
    // Create new club record with the new ID
    const newClubRef = ref(database, `clubs/${newClubId}`);
    await set(newClubRef, clubData);
    console.log('Created new club record with ID:', newClubId);
    
    // Get the user record
    const userRef = ref(database, `users/${oldClubId}`);
    const userSnapshot = await get(userRef);
    
    if (userSnapshot.exists()) {
      const userData = userSnapshot.val();
      console.log('Found user data for club');
      
      // Create new user record with the new ID
      const newUserRef = ref(database, `users/${newClubId}`);
      await set(newUserRef, userData);
      console.log('Created new user record with ID:', newClubId);
    }
    
    // Update events to use the new club ID
    const eventsRef = ref(database, 'events');
    const clubEventsQuery = query(
      eventsRef,
      orderByChild('club_id'),
      equalTo(oldClubId)
    );
    
    const eventsSnapshot = await get(clubEventsQuery);
    
    if (eventsSnapshot.exists()) {
      console.log('Updating events...');
      const updates = [];
      
      eventsSnapshot.forEach((childSnapshot) => {
        const eventId = childSnapshot.key;
        const eventData = childSnapshot.val();
        
        // Update club_id
        eventData.club_id = newClubId;
        
        // Add to updates
        updates.push({
          id: eventId,
          data: eventData
        });
      });
      
      // Apply updates
      for (const update of updates) {
        const eventRef = ref(database, `events/${update.id}`);
        await set(eventRef, update.data);
      }
      
      console.log(`Updated ${updates.length} events`);
    } else {
      console.log('No events found for this club');
    }
    
    // Delete the old club and user records
    console.log('Deleting old records...');
    await remove(clubRef);
    
    if (userSnapshot.exists()) {
      await remove(userRef);
    }
    
    console.log('\nClub ID updated successfully!');
    console.log(`Old ID: ${oldClubId}`);
    console.log(`New ID: ${newClubId}`);
    
  } catch (error) {
    console.error('Error updating club ID:', error);
  }
}

// Run the update
updateClubId();
