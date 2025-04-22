# NIT Silchar Event Manager

A 3D immersive website with high-quality scrolling effects and overlay page animations for managing NIT Silchar clubs and college events.

## Features

- Registration for events
- Club login (who can create events)
- Upcoming/ongoing events
- Track registrants and their details
- Dark-themed 3D immersive design
- Smooth scrolling and animations
- Responsive design for all devices
- Supabase integration for backend

## Technologies Used

- React with Vite
- Three.js for 3D effects
- Framer Motion for animations
- GSAP for scrolling effects
- Supabase for backend and authentication
- Date-fns for date formatting

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/DhrubaAgarwalla/NITS-Event-Managment.git
   cd NITS-Event-Managment/event-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_SUPABASE_SERVICE_KEY=your-supabase-service-key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

The application is deployed using Vercel. Any changes pushed to the main branch will be automatically deployed.

## Credits

- Created by Dhruba Kr Agarwalla (Scholar ID: 2411100)
- NIT Silchar

## License

This project is licensed under the MIT License.
