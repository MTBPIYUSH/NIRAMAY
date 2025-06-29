# Niramay – AI-Powered Civic Waste Management for India

**Niramay** is a smart civic-tech platform that uses **AI, geolocation, and community engagement** to make Indian cities cleaner and more efficient. Citizens can report waste in real time, while municipal authorities and workers manage cleanup through streamlined dashboards.

---

## Vision

To transform waste management across India using technology, empowering **citizens**, **municipal authorities**, and **field workers** to build a cleaner, greener, and more sustainable country.

---

## Authentication System

### 1. Signup (Only for Citizens)
- Fields: **Aadhar Number**, **Email**, and **Password**
- Aadhar must be unique — **one user per Aadhar number**

### 2. Login
- **All roles** log in using email and password
- After login, users are redirected based on their **role**:
  - Citizen → /user-dashboard
  - Admin → /admin-dashboard
  - Sub-worker → /worker-dashboard

---

## Role-Based Functionalities

### 1. Citizen Dashboard (Normal Users)
- **Signup/Login** using Aadhar & email
- **Send Waste Reports**:
  - Use **in-browser camera** (no gallery/file uploads)
  - Attach **multiple images**
  - Auto-fetch **location** using Google Maps API
- **Dashboard Overview**:
  - View number of reports submitted
  - Track status: *In Progress*, *Completed*
- **Earn Eco Points**:
  - Get points when sub-workers successfully complete your reported task
- **Redeem Points**:
  - In an **Eco Marketplace**: dustbins, compost kits, coupons, etc.
- **Citizen Leaderboard**:
  - Track your ranking among other civic participants

### 2. Admin Dashboard (Municipal Authority)
- **Multi-Admin System**:
  - Each locality/ward can have its own admin
- **Complaint Management**:
  - View reports with photos and geolocation
- **Task Assignment**:
  - Assign tasks to **available sub-workers**
- **Real-Time Sub-Worker Status**:
  - View if a sub-worker is *Busy* or *Available*
- **Analytics Dashboard**:
  - Complaint resolution rate
  - Area-wise cleanliness index
  - Sub-worker performance leaderboard
  - User engagement and reporting trends
- **Emergency Cleanup Detection**:
  - Highlight critical areas like hospitals or schools for priority response

### 3. Sub-Worker Dashboard (Field Workers)
- **Task Notification**:
  - Receive assigned tasks with images and locations
- **Status Indicator**:
  - Mark as *Busy* during cleanup, *Available* when free
- **Task Completion**:
  - Mark completed jobs, which auto-rewards users and updates analytics
- **Gamification (Optional)**:
  - Earn **badges**, levels, and achievements for efficiency
- **Notifications System**:
  - In-app/SMS alerts for:
    - Task assignments
    - Task completion
    - User reward distribution

---

## Tech Stack

| Feature Area       | Technology                              |
|--------------------|-----------------------------------------|
| Frontend           | React, Tailwind CSS                     |
| Authentication     | Supabase (Email/Password Auth)          |
| Database           | Supabase (PostgreSQL)                   |
| Media + Location   | Browser Camera API, Google Maps API     |
| Hosting            | Netlify                                 |

---

## Installation

To get Niramay up and running on your local machine, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/Niramay.git
    cd Niramay
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Supabase:**
    -   Create a new project on [Supabase](https://supabase.com/).
    -   Copy your `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
    -   Create a `.env` file in the root of your project and add the following:
        ```
        VITE_SUPABASE_URL=YOUR_SUPABASE_URL
        VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        ```
    -   Run the Supabase migrations to set up your database schema:
        ```bash
        # Ensure you have Supabase CLI installed
        supabase login
        supabase link --project-ref your-project-ref
        supabase db push
        ```

4.  **Google Maps API Key:**
    -   Obtain a Google Maps API key from the [Google Cloud Console](https://console.cloud.google.com/).
    -   Enable the necessary APIs (e.g., Geocoding API, Maps JavaScript API).
    -   Add your API key to the `.env` file:
        ```
        VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
        ```

5.  **Run the application:**
    ```bash
    npm run dev
    ```
    The application will be accessible at `http://localhost:5173` (or another port if 5173 is in use).

---

## Development Setup

### Project Structure

-   `src/components`: React components for different parts of the application.
-   `src/lib`: Utility functions, API integrations (Supabase, Google Maps), and services.
-   `src/hooks`: Custom React hooks.
-   `src/types`: TypeScript type definitions.
-   `supabase`: Supabase migrations and database-related files.

### Running Tests

*(If a testing framework is implemented, instructions would go here. Refer to `docs/testing-framework.md` for more details.)*

### Code Style

This project uses ESLint for code linting and Prettier for code formatting. Ensure your IDE is configured to use these tools, or run them manually:

```bash
npm run lint
npm run format
```

---

## Data Flow Summary

Citizen → Reports waste → Location + photo sent → Admin views & assigns → Sub-worker cleans → Task completed → User rewarded → Analytics updated

---

## Setup Instructions

1. **Clone the repo**
   ```bash
   git clone https://github.com/yourusername/niramay.git
   cd niramay
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Supabase**
   - Set up Supabase project and enable Email Auth
   - Create `profiles` table with role and aadhar fields
   - Add RLS (Row-Level Security) to restrict access

4. **Run the app**
   ```bash
   npm run dev
   ```

---

## 🇮🇳 Made with Purpose

> "From report to reward — Niramay makes civic action simple, impactful, and rewarding."

---

## License

MIT License

---

## Acknowledgements

- [Supabase](https://supabase.com/)
- [Google Maps Platform](https://developers.google.com/maps)
- [Swachh Bharat Mission](https://swachhbharatmission.gov.in)
