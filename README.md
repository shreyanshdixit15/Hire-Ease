# Hire-Ease (QuickHire)

A lightweight, mobile-first platform designed to connect local labour with employers efficiently.

## 🚀 Features

- **User Registration**: Separate flows for Workers and Employers with (simulated) OTP verification.
- **Voice Resumes**: Workers can record and upload voice resumes for easier accessibility.
- **Location-Based Search**: GPS-based nearby worker finder.
- **Smart Filtering**: Filter workers by skills and location.
- **Bilingual Support**: Basic English/Hindi language toggle.
- **Job Posting & Applications**: Employers can post jobs, and workers can apply to them directly (Backend features ready).
- **Trust & Ratings**: 
  - 5-star rating system with written reviews and client attribution.
  - Automatic trust score calculation.
  - Admin verification badges.
- **Worker Availability**: Workers can toggle their status between online and offline (Backend feature ready).
- **Modern UI Elements**: Interactive toast notifications for user actions and smooth animations.
- **Admin Dashboard**: Comprehensive management of users, verifications, ratings, and platform statistics.

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **File Uploads**: Multer (Voice & ID payloads are stored in `/uploads`)
- **Other**: Twilio (integrated for SMS, currently using simulated OTPs in dev mode)

## 💻 Getting Started

### Prerequisites
- Node.js installed on your machine.

### Installation & Setup

1. **Clone the repository and navigate to the server folder:**
   ```bash
   git clone https://github.com/shreyanshdixit15/Hire-Ease.git
   cd Hire-Ease/HireEase
   ```
   *(If you already have the code locally, just `cd HireEase` from the root project folder)*

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   *(For development mode with auto-reload, use `npm run dev`)*

4. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser. (Mobile view recommended for the best experience).

### Testing Notes
- **OTPs**: During registration, a simulated OTP is generated and printed in the server console for testing purposes.
- **File Uploads**: Voice and ID documents uploaded during testing are saved locally in the `HireEase/uploads` directory.

## 👥 Contributors

Made with  by:
- **Shreyansh Dixit**
- **Khushi**
- **Asmit singh**
- **Harsh Bardhan**
