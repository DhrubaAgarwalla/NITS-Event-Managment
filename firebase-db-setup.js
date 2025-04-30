// Firebase Database Setup Script
// This script sets up the Firebase Realtime Database structure to match the previous Supabase schema
// Run with: node firebase-db-setup.js your-email@example.com your-password

import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  child,
  push
} from 'firebase/database';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';

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

// Admin email and password (use the account you created)
const adminEmail = process.argv[2]; // Pass as first argument
const adminPassword = process.argv[3]; // Pass as second argument

if (!adminEmail || !adminPassword) {
  console.error('Please provide admin email and password as arguments:');
  console.error('node firebase-db-setup.js your-email@example.com your-password');
  process.exit(1);
}

// Function to generate a UUID-like ID
function generateId() {
  return 'id-' + Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// Function to initialize database structure
async function initializeDatabase() {
  try {
    // Sign in with admin credentials
    console.log(`Signing in as ${adminEmail}...`);
    let userCredential;

    try {
      userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('User not found, creating admin account...');
        userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);

        // Update profile with display name
        await updateProfile(userCredential.user, {
          displayName: 'Admin User'
        });
      } else {
        throw error;
      }
    }

    const user = userCredential.user;
    console.log(`Signed in successfully as ${user.email} (${user.uid})`);

    // Create admin record
    console.log('Setting up admin user...');
    await set(ref(database, `admins/${user.uid}`), {
      name: user.displayName || 'Admin User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    console.log('Admin user created');

    // No users table needed as per requirements
    console.log('Skipping users table creation as per requirements');

    // Create categories (matching the initial categories from Supabase schema)
    console.log('Creating categories...');
    const categories = [
      { name: 'Technical', color: '#3498db' },
      { name: 'Cultural', color: '#e74c3c' },
      { name: 'Sports', color: '#2ecc71' },
      { name: 'Academic', color: '#f39c12' },
      { name: 'Workshop', color: '#9b59b6' }
    ];

    for (const category of categories) {
      const categoryId = generateId();
      await set(ref(database, `categories/${categoryId}`), {
        name: category.name,
        color: category.color,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    console.log(`Created ${categories.length} categories`);

    // Create a test club with a fixed ID
    console.log('Creating test club...');
    const testClubEmail = 'testclub@example.com';
    const testClubPassword = 'TestClub@123';

    // Use a fixed ID for the test club to ensure consistency
    const testClubId = 'test-club-fixed-id-123456';

    console.log('Using fixed ID for test club:', testClubId);

    // Note: We're not creating a Firebase Authentication user for the test club
    // Instead, we're just creating the database entries with a fixed ID
    console.log('Skipping Firebase Authentication for test club due to credential issues');

    // To use this test club in the application, you'll need to create a user manually
    // through the Firebase Console with the email testclub@example.com

    // Create club profile
    await set(ref(database, `clubs/${testClubId}`), {
      name: 'Test Club',
      description: 'This is a test club for demonstration purposes',
      logo_url: 'https://via.placeholder.com/150',
      contact_email: testClubEmail,
      contact_phone: '1234567890',
      website: 'https://example.com',
      social_links: {
        facebook: 'https://facebook.com/testclub',
        instagram: 'https://instagram.com/testclub',
        twitter: 'https://twitter.com/testclub'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // No users table needed as per requirements
    console.log('Skipping user record creation for test club as per requirements');

    console.log('Test club profile created');

    // Get a category ID for test events
    const categoriesRef = ref(database, 'categories');
    const categoriesSnapshot = await get(categoriesRef);
    let firstCategoryId = null;

    categoriesSnapshot.forEach((childSnapshot) => {
      if (!firstCategoryId) {
        firstCategoryId = childSnapshot.key;
      }
    });

    // Create test events
    console.log('Creating test events...');
    const testEvents = [
      {
        title: 'Technical Workshop',
        description: 'A workshop on the latest technologies',
        image_url: 'https://via.placeholder.com/800x400',
        start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        end_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days from now
        location: 'NIT Silchar, Room 101',
        max_participants: 50,
        registration_deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
        status: 'upcoming',
        is_featured: true,
        club_id: testClubId,
        category_id: firstCategoryId,
        registration_method: 'internal',
        participation_type: 'individual',
        min_participants: 1,
        additional_info: {
          organizer: 'John Doe',
          contact: 'john@example.com',
          requirements: 'Laptop, Internet connection'
        }
      },
      {
        title: 'Cultural Night',
        description: 'A night of music, dance, and performances',
        image_url: 'https://via.placeholder.com/800x400',
        start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // Same day
        location: 'NIT Silchar Auditorium',
        max_participants: 200,
        registration_deadline: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString(), // 13 days from now
        status: 'upcoming',
        is_featured: true,
        club_id: testClubId,
        category_id: firstCategoryId,
        registration_method: 'both',
        external_form_url: 'https://forms.google.com/example',
        participation_type: 'team',
        min_participants: 3,
        additional_info: {
          organizer: 'Jane Smith',
          contact: 'jane@example.com',
          requirements: 'None'
        }
      }
    ];

    for (const eventData of testEvents) {
      const eventsRef = ref(database, 'events');
      const newEventRef = push(eventsRef);

      await set(newEventRef, {
        ...eventData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    console.log(`Created ${testEvents.length} test events`);

    // Create test club request
    console.log('Creating test club request...');
    const clubRequestsRef = ref(database, 'club_requests');
    const newClubRequestRef = push(clubRequestsRef);

    await set(newClubRequestRef, {
      club_name: 'New Club Request',
      contact_person: 'Jane Doe',
      contact_email: 'jane.doe@example.com',
      contact_phone: '9876543210',
      description: 'This is a test club request',
      additional_info: 'We would like to organize technical events',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    console.log('Test club request created');

    // Create test registrations
    console.log('Creating test registrations...');

    // Get the first event ID
    const eventsRef = ref(database, 'events');
    const eventsSnapshot = await get(eventsRef);
    let firstEventId = null;

    eventsSnapshot.forEach((childSnapshot) => {
      if (!firstEventId) {
        firstEventId = childSnapshot.key;
      }
    });

    if (firstEventId) {
      const testRegistrations = [
        {
          event_id: firstEventId,
          participant_name: 'John Student',
          participant_email: 'john.student@example.com',
          participant_phone: '1234567890',
          participant_id: 'STU001',
          status: 'registered',
          additional_info: {
            department: 'Computer Science',
            year: '3rd'
          }
        },
        {
          event_id: firstEventId,
          participant_name: 'Jane Student',
          participant_email: 'jane.student@example.com',
          participant_phone: '0987654321',
          participant_id: 'STU002',
          status: 'registered',
          additional_info: {
            department: 'Electrical Engineering',
            year: '2nd'
          }
        }
      ];

      for (const regData of testRegistrations) {
        const registrationsRef = ref(database, 'registrations');
        const newRegistrationRef = push(registrationsRef);

        await set(newRegistrationRef, {
          ...regData,
          registration_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      console.log(`Created ${testRegistrations.length} test registrations`);
    } else {
      console.log('No events found, skipping registration creation');
    }

    // Create tags
    console.log('Creating tags...');
    const tags = [
      { name: 'Workshop', color: '#6c5ce7' },
      { name: 'Competition', color: '#e17055' },
      { name: 'Seminar', color: '#00b894' },
      { name: 'Hackathon', color: '#fdcb6e' },
      { name: 'Conference', color: '#74b9ff' }
    ];

    for (const tag of tags) {
      const tagsRef = ref(database, 'tags');
      const newTagRef = push(tagsRef);

      await set(newTagRef, {
        name: tag.name,
        color: tag.color,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    console.log(`Created ${tags.length} tags`);

    // Create event_tags relationships (if we have events and tags)
    if (firstEventId) {
      console.log('Creating event_tags relationships...');

      // Get the first tag ID
      const tagsRef = ref(database, 'tags');
      const tagsSnapshot = await get(tagsRef);
      let firstTagId = null;

      tagsSnapshot.forEach((childSnapshot) => {
        if (!firstTagId) {
          firstTagId = childSnapshot.key;
        }
      });

      if (firstTagId) {
        // Create event_tags relationship
        await set(ref(database, `event_tags/${firstEventId}_${firstTagId}`), {
          event_id: firstEventId,
          tag_id: firstTagId,
          created_at: new Date().toISOString()
        });
        console.log('Created event_tags relationship');
      }
    }

    console.log('\nDatabase initialization completed successfully!');

    // Verify data was written
    console.log('\nVerifying data...');
    const dbRef = ref(database);

    const adminSnapshot = await get(child(dbRef, `admins/${user.uid}`));
    if (adminSnapshot.exists()) {
      console.log('Admin data verified ✓');
    } else {
      console.log('Admin data not found!');
    }

    // No users table verification needed as per requirements
    console.log('Skipping users table verification as per requirements');

    const categoriesVerifySnapshot = await get(child(dbRef, 'categories'));
    if (categoriesVerifySnapshot.exists()) {
      console.log('Categories data verified ✓');
    } else {
      console.log('Categories data not found!');
    }

    const clubSnapshot = await get(child(dbRef, `clubs/${testClubId}`));
    if (clubSnapshot.exists()) {
      console.log('Club data verified ✓');
    } else {
      console.log('Club data not found!');
    }

    const eventsVerifySnapshot = await get(child(dbRef, 'events'));
    if (eventsVerifySnapshot.exists()) {
      console.log('Events data verified ✓');
    } else {
      console.log('Events data not found!');
    }

    const registrationsVerifySnapshot = await get(child(dbRef, 'registrations'));
    if (registrationsVerifySnapshot.exists()) {
      console.log('Registrations data verified ✓');
    } else {
      console.log('Registrations data not found!');
    }

    const tagsVerifySnapshot = await get(child(dbRef, 'tags'));
    if (tagsVerifySnapshot.exists()) {
      console.log('Tags data verified ✓');
    } else {
      console.log('Tags data not found!');
    }

    console.log('\nDatabase setup complete! You can now use the application with Firebase.');
    console.log('\nAdmin credentials:');
    console.log(`Email: ${adminEmail}`);
    console.log('Password: (the one you provided)');

    console.log('\nTest Club information:');
    console.log(`ID: ${testClubId}`);
    console.log('\nIMPORTANT: Firebase Security Rules');
    console.log('1. Go to the Firebase Console: https://console.firebase.google.com/');
    console.log('2. Navigate to Realtime Database > Rules');
    console.log('3. Copy and paste the rules from firebase-security-rules.json');
    console.log('4. Click "Publish" to apply the rules');
    console.log('\nThese rules allow:');
    console.log('- Public read access to events, clubs, and categories');
    console.log('- Anyone can register for events without login');
    console.log('- Only admins and clubs can create/edit events');

  } catch (error) {
    console.error('Error initializing database:', error);
    console.error('Error details:', error.code, error.message);
  }
}

// Run the initialization
initializeDatabase();
