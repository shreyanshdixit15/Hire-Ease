# QuickHire (Prototype)

A lightweight, mobile-first prototype of QuickHire — a local labour-hiring platform.

Features included in this prototype:

- Homepage with explanation
- Worker/Employer registration with simulated OTP (dev-only)
- Voice resume record & upload
- GPS-based nearby worker finder
- Skill and location filtering
- Hindi/English toggle (basic)
- Worker trust score (ratings + admin verification badge)
- Employer job posting
- Admin dashboard for verification

Not included / stubbed:

- Real SMS OTP (simulated in dev)
- Real payment integration
- Full fraud detection, analytics, chatbot

How to run (Windows PowerShell):

1. Open PowerShell and cd to the project folder:

```powershell
cd "c:\Users\shrey\OneDrive\Documents\Desktop\mini project\HireEase"
```

1. Install dependencies:

```powershell
npm install
```

1. Start server:

```powershell
npm start
```

1. Open <http://localhost:3000> in your browser (mobile recommended).

Notes:

- During registration an OTP is generated and shown in the server console/response for testing.
- Uploads (voice, ID) are stored in `/uploads`.
