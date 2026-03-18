# QuickHire - OTP & Voice Resume Setup

## 🎤 Voice Resume

STATUS: ✅ FULLY WORKING

### How it works

1. Click "🎤 Record" button in Labour Registration form
2. Allow microphone access when prompted
3. Speak for up to 30 seconds
4. Click "⏹ Stop" or wait for auto-stop
5. Play back your recording to verify
6. Submit registration - voice file uploads automatically

### Technical Details

- Uses MediaRecorder API (built into modern browsers)
- Auto-stops at 30 seconds
- Saves as .webm audio format
- Uploads to server after OTP verification
- Stored in `/uploads` folder
- Max file size: 10MB

---

## 📱 SMS OTP System

STATUS: ✅ CONFIGURED (Needs Twilio credentials for real SMS)

### Current Mode SIMULATED

- OTP appears in browser console
- OTP also returned in API response (dev mode)
- Valid for 5 minutes
- Works without Twilio setup

### To Enable Real SMS

#### Step 1 Get Twilio Account

1. Sign up at <https://www.twilio.com/try-twilio>
2. Verify your phone number
3. Get free trial credits ($15 USD)

#### Step 2 Get Credentials

1. Go to <https://console.twilio.com/>
2. Copy your **Account SID**
3. Copy your **Auth Token**
4. Get a Twilio phone number (or use trial number)

#### Step 3 Configure Server

1. Copy `.env.example` to `.env`:

   ```bash
   copy .env.example .env
   ```

2. Edit `.env` file:

   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+15551234567
   ```

3. Install dotenv (if not already):

   ```bash
   npm install dotenv
   ```

4. Add to top of `server.js`:

   ```javascript
   require('dotenv').config();
   ```

5. Restart server:

   ```bash
   node server.js
   ```

#### Step 4 Test

- Enter phone with country code: `+919876543210`
- Or without (defaults to +91): `9876543210`
- Check your phone for SMS!

### OTP Flow

1. User enters phone number
2. Clicks "Send OTP"
3. Server generates 4-digit code
4. **If Twilio configured**: SMS sent to phone
5. **If not configured**: OTP shown in console
6. User enters OTP within 5 minutes
7. Server verifies and creates account

---

## 🎯 Quick Test (Development Mode)

### Test Voice Resume

1. Open: <http://localhost:3000>
2. Click "Labour Registration"
3. Fill name, phone, skills
4. Click "🎤 Record"
5. Speak briefly
6. Click "⏹ Stop"
7. Verify playback works

### Test OTP

1. Click "Send OTP"
2. Check browser console (F12 > Console)
3. Look for: `📱 Simulated OTP for +919876543210 : 1234`
4. Enter the OTP code
5. Click "Verify & Register"

---

## 📊 What Gets Stored

After successful registration:

- ✅ User details in SQLite database
- ✅ Voice resume in `/uploads` folder
- ✅ ID proof (if uploaded) in `/uploads` folder
- ✅ Worker appears in search immediately
- ✅ Default trust score: 4.5 stars

---

## 🔧 Troubleshooting

### Voice Recording Not Working

- ✅ Use HTTPS (ngrok provides this)
- ✅ Allow microphone permission in browser
- ✅ Check browser supports MediaRecorder (Chrome, Firefox, Edge)
- ❌ Safari on iOS has limited support

### OTP Not Sending

- Check console for "✅ Twilio configured" message
- If "⚠️ Twilio not configured" - using simulated mode
- Check .env file exists and has correct values
- Verify Twilio credentials are active

### Worker Not Appearing

- Wait 2 seconds after registration
- Page should reload automatically
- Check browser console for errors
- Verify database has new entry

---

## 🚀 Production Checklist

Before deploying:

- [ ] Set up real Twilio account (not trial)
- [ ] Add Twilio credentials to environment variables
- [ ] Remove `otp: code` from API responses
- [ ] Set up proper file storage (AWS S3, etc.)
- [ ] Add rate limiting for OTP requests
- [ ] Implement OTP attempt limits (3 tries)
- [ ] Add phone number verification
- [ ] Set up backup OTP delivery (email)

---

## 📞 Support

Questions? Check:

- Server console for logs
- Browser console (F12) for errors
- Twilio console for SMS delivery status
- `/uploads` folder for saved files
