# Firebase Database Structure

This document outlines the Firebase Realtime Database structure for the NIT Silchar Event Management application. The structure is designed to match the previous Supabase schema while adapting to Firebase's NoSQL document model.

## Database Structure

### Admins

```
/admins/{uid}
  - name: string
  - created_at: ISO date string
  - updated_at: ISO date string
```

The `admins` collection stores admin profiles. The `uid` is the Firebase Authentication user ID of the admin.

### Clubs

```
/clubs/{uid}
  - name: string
  - description: string
  - logo_url: string
  - contact_email: string
  - contact_phone: string
  - website: string
  - social_links: object
    - facebook: string
    - instagram: string
    - twitter: string
  - created_at: ISO date string
  - updated_at: ISO date string
```

The `clubs` collection stores club profiles. The `uid` is the Firebase Authentication user ID of the club account.

### Categories

```
/categories/{id}
  - name: string
  - color: string
  - created_at: ISO date string
  - updated_at: ISO date string
```

The `categories` collection stores event categories.

### Events

```
/events/{id}
  - title: string
  - description: string
  - image_url: string
  - start_date: ISO date string
  - end_date: ISO date string
  - location: string
  - max_participants: number
  - registration_deadline: ISO date string
  - status: string ('upcoming', 'ongoing', 'completed', 'cancelled')
  - is_featured: boolean
  - club_id: string (references clubs/{uid})
  - category_id: string (references categories/{id})
  - registration_method: string ('internal', 'external', 'both')
  - external_form_url: string
  - participation_type: string ('individual', 'team', 'both')
  - min_participants: number
  - additional_info: object
  - chat_enabled: boolean (default: true)
  - info_board_enabled: boolean (default: true)
  - created_at: ISO date string
  - updated_at: ISO date string
```

The `events` collection stores event information.

### Event Live Updates (Information Board)

```
/event_live_updates/{event_id}/{update_id}
  - message: string
  - type: string ('info', 'announcement', 'schedule', 'important')
  - posted_by: string (club admin uid)
  - posted_by_name: string (club admin name)
  - timestamp: ISO date string
  - is_pinned: boolean (default: false)
  - created_at: ISO date string
```

The `event_live_updates` collection stores real-time updates posted by club admins during events.

### Event Chat Messages (Anonymous Chat)

```
/event_chat/{event_id}/{message_id}
  - message: string
  - nickname: string (anonymous nickname like "TechNinja")
  - user_hash: string (anonymous identifier for consistency)
  - timestamp: ISO date string
  - message_type: string ('text', 'reaction', 'system')
  - reactions: object
    - thumbs_up: number
    - heart: number
    - laugh: number
    - thinking: number
  - is_moderated: boolean (default: false)
  - reported_count: number (default: 0)
  - created_at: ISO date string
```

The `event_chat` collection stores anonymous chat messages for each event.

### Anonymous User Sessions

```
/anonymous_sessions/{event_id}/{session_id}
  - user_hash: string (consistent anonymous identifier)
  - nickname: string (generated nickname)
  - avatar_seed: string (for consistent avatar generation)
  - last_active: ISO date string
  - message_count: number
  - is_muted: boolean (default: false)
  - created_at: ISO date string
```

The `anonymous_sessions` collection manages anonymous user identities per event.

### Registrations

```
/registrations/{id}
  - event_id: string (references events/{id})
  - participant_name: string
  - participant_email: string
  - participant_phone: string
  - participant_id: string
  - registration_date: ISO date string
  - status: string ('registered', 'attended', 'cancelled')
  - additional_info: object
  - qr_code_data: string (unique QR code for attendance)
  - attendance_status: string ('not_attended', 'attended')
  - attendance_timestamp: ISO date string (when marked as attended)
  - qr_code_generated_at: ISO date string (when QR code was created)
  - created_at: ISO date string
  - updated_at: ISO date string
```

The `registrations` collection stores event registrations with RSVP attendance tracking.

### Club Requests

```
/club_requests/{id}
  - club_name: string
  - contact_person: string
  - contact_email: string
  - contact_phone: string
  - description: string
  - additional_info: string
  - logo_url: string
  - status: string ('pending', 'approved', 'rejected')
  - admin_notes: string
  - created_at: ISO date string
  - updated_at: ISO date string
```

The `club_requests` collection stores requests to create club accounts.

### Tags

```
/tags/{id}
  - name: string
  - color: string
  - created_at: ISO date string
  - updated_at: ISO date string
```

The `tags` collection stores event tags.

### Event Tags (Junction Table)

```
/event_tags/{event_id}_{tag_id}
  - event_id: string (references events/{id})
  - tag_id: string (references tags/{id})
  - created_at: ISO date string
```

The `event_tags` collection implements the many-to-many relationship between events and tags.

### Club Bank Details

```
/club_bank_details/{club_id}
  - account_holder_name: string
  - account_number: string
  - ifsc_code: string
  - bank_name: string
  - branch_name: string
  - account_type: string ('savings', 'current')
  - upi_id: string
  - contact_name: string
  - contact_email: string
  - contact_phone: string
  - business_type: string
  - address_line1: string
  - address_line2: string
  - city: string
  - state: string
  - pincode: string
  - razorpay_account_id: string
  - razorpay_bank_account_id: string
  - verification_status: string ('pending', 'under_review', 'verified', 'rejected')
  - razorpay_status: string
  - razorpay_created_at: ISO date string
  - created_at: ISO date string
  - updated_at: ISO date string
```

The `club_bank_details` collection stores bank account information for clubs to enable direct payment processing through Razorpay Route.

## Differences from Supabase Schema

1. **IDs**: Firebase uses auto-generated string IDs instead of UUIDs.
2. **Foreign Keys**: Firebase doesn't enforce foreign key constraints. References are maintained at the application level.
3. **Timestamps**: Firebase doesn't automatically update timestamps. This must be handled in the application code.
4. **JSONB Fields**: Firebase natively supports nested objects, so JSONB fields from Supabase are stored as nested objects.
5. **Row Level Security**: Firebase uses Security Rules instead of RLS policies. These are configured separately.

## Security Rules

Firebase Security Rules are configured to allow public access to most data while protecting sensitive operations:

- **Public Read Access**: Anyone can read events, clubs, categories, and registrations without authentication
- **Public Registration**: Anyone can register for events without authentication
- **Protected Write Access**: Only authenticated clubs can edit their own events
- **Admin Access**: Only admins can manage categories, approve club requests, etc.

The complete security rules are available in the `firebase-security-rules.json` file.

## Querying Data

Firebase Realtime Database uses a different querying approach than SQL:

1. **Simple Lookups**: Use direct paths like `ref(database, 'events/{id}')`.
2. **Filtering**: Use `query()` with `orderByChild()` and `equalTo()`.
3. **Sorting**: Sort results in memory after fetching.
4. **Pagination**: Use `limitToFirst()` or `limitToLast()` with `startAt()` or `endAt()`.

## Example Queries

### Get all events for a specific club

```javascript
const eventsRef = ref(database, 'events');
const clubEventsQuery = query(
  eventsRef,
  orderByChild('club_id'),
  equalTo(clubId)
);

const snapshot = await get(clubEventsQuery);
```

### Get all registrations for an event

```javascript
const registrationsRef = ref(database, 'registrations');
const eventRegistrationsQuery = query(
  registrationsRef,
  orderByChild('event_id'),
  equalTo(eventId)
);

const snapshot = await get(eventRegistrationsQuery);
```

## Setup Instructions

To set up the Firebase database structure:

1. Make sure you have Node.js installed
2. Run the setup script:

```bash
node firebase-db-setup.js your-admin-email@example.com your-password
```

This will create the necessary database structure and sample data.
