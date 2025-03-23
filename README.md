# Niramay - AI-Driven Waste Management System

<div align="center">
  <img src="https://imagekit.io/tools/asset-public-link?detail=%7B%22name%22%3A%22Screenshot%202025-03-23%20123852.png%22%2C%22type%22%3A%22image%2Fpng%22%2C%22signedurl_expire%22%3A%222028-03-22T07%3A46%3A07.262Z%22%2C%22signedUrl%22%3A%22https%3A%2F%2Fmedia-hosting.imagekit.io%2F%2F8aef2dc2f6264699%2FScreenshot%25202025-03-23%2520123852.png%3FExpires%3D1837323967%26Key-Pair-Id%3DK2ZIVPTIP2VGHC%26Signature%3DUrxLlzG0kkgxI9V3EBZf-qskYh~63biulobQTiC9r8LuoiNWYUQ1dU20-cJj5hYbCy7~iwLxtnT0SLNVpQXlxutM85vhzDcKGL2qxyKwqrVnhtI2YaOnIzBtDzA0L8uzFHcxAEdOHN5VGeHtVwrA1TfImZK8ZGP2C0ffxgyWvJikypYnlQkX7Sw~8LSl6loufcAEEvHrxyrZ7Us8BC~WQs3WakuCAbywalDtmijNNkmv2ypZqfiC5USb~WfRW2yl5atLfcc9Ph~HFfTLkiqy69YplaSpUz4nkN2vpGZuhpeiOungG8UasaMXl7aIm~1AqweHKOchxp8M8JVOP2Jiuw__%22%7D" alt="Niramay Logo" width="300"/>
  <p><em>Automating waste management for a cleaner future</em></p>
</div>

## 📋 Overview

Niramay is an innovative AI-driven waste management platform that optimizes waste collection, segregation, and recycling processes. By leveraging artificial intelligence, community participation, and municipal coordination, Niramay creates cleaner and more sustainable communities.

### 🌿 Vision

To revolutionize waste management through technology, making our cities cleaner, more efficient, and environmentally sustainable.

## 🛠️ Tech Stack

### Frontend
- **React**: UI framework for building the web application
- **TailwindCSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library
- **React Router**: For application routing

### Backend
- **Supabase**: Backend-as-a-Service for database, authentication, and storage
- **PostgreSQL**: Database for storing application data
- **Edge Functions**: Serverless functions for backend logic

### AI & External Services
- **AI Classification**: For waste type identification from images
- **Google Maps API**: For location services and route optimization
- **Supabase Storage**: For storing waste report images

## ✨ Key Features

### For Citizens
- **Waste Reporting**: Report uncollected waste with location, images, and details
- **AI Classification**: Automatic identification of waste types from uploaded images
- **Gamification**: Earn points and compete on leaderboards for community engagement
- **Report Tracking**: Monitor the status of submitted waste reports

### For Municipalities
- **Dashboard & Analytics**: Comprehensive view of waste reports and collection metrics
- **Route Optimization**: AI-generated efficient collection routes based on waste density
- **Resource Allocation**: Data-driven insights for better resource management
- **Performance Monitoring**: Track collection efficiency and response times

### System Features
- **Real-time Notifications**: Updates on report status and collection schedules
- **User Authentication**: Secure login and profile management
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/niramay.git
   cd niramay
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173` to see the application

### Database Setup

1. **Create a Supabase project**
   Sign up at [Supabase](https://supabase.com) and create a new project

2. **Run the database migrations**
   ```bash
   npm run types:supabase
   ```

## 📊 Database Schema

### Main Tables
- **users**: User authentication and profile information
- **waste_reports**: Waste report details including location, type, and status
- **user_profiles**: Extended user information including points and report counts

## 🔌 API Endpoints

### Authentication
- `POST /auth/signup`: Register a new user
- `POST /auth/login`: Authenticate a user
- `POST /auth/logout`: Log out a user

### Waste Reports
- `GET /reports`: Get all waste reports (with filtering options)
- `POST /reports`: Create a new waste report
- `GET /reports/:id`: Get a specific waste report
- `PUT /reports/:id`: Update a waste report status

### User Profiles
- `GET /users/profile`: Get the current user's profile
- `PUT /users/profile`: Update user profile information

### Leaderboard
- `GET /leaderboard`: Get the community leaderboard

## 📱 Mobile Compatibility

Niramay is designed with a responsive interface that works well on mobile devices. Future plans include dedicated mobile applications for Android and iOS.

## 🚢 Deployment

### Deploying to Vercel

1. **Create a Vercel account** at [Vercel](https://vercel.com)

2. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

3. **Deploy the application**
   ```bash
   vercel
   ```

4. **Set environment variables**
   Configure the same environment variables in the Vercel project settings

## 🤝 Contributing

We welcome contributions to Niramay! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards
- Follow the existing code style
- Write tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

- **Project Maintainer**: Piyush Kumar Puria - piyushkumarpuriabnss8@gmail.com
- **Website**: [niramay-smartwaste.netlify.app](https://niramay-smartwaste.netlify.app/)

---

<div align="center">
  <p>Reducing waste, one report at a time 🌱</p>
</div>
