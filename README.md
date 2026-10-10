# Stealth Studio (Audio Manager Pro Disguise) — Mobile App Iteration 1

A cross-platform React Native / Expo application disguised as an authentic system **Audio / Volume Manager**, cloaking a military-grade **Steganography Studio** and **Visual Stego Messenger ("Ghost Chat")**.

---

## 📱 Features Implemented in Iteration 1

1. **Audio Manager Disguise (`AudioDisguiseScreen.tsx`)**:
   - 4 Interactive Volume Sliders: Media, Ringtone & Calls, Alerts & Notifications, Alarm Clock.
   - Quick Profiles: Normal, Meeting, Silent.
   - Diagnostic Test Tone with 440Hz test audio alert.
   - **Trigger 1**: Long-press on "Audio Manager" title (800ms) opens the Calibration Frequency prompt.
   - **Trigger 2**: Set Media Volume to 100% and tap "Play Diagnostic Test Tone".
2. **Innocent 5-Band Equalizer (`InnocentEQScreen.tsx`)**:
   - Believable decoy DSP screen with 5-band gain bars and presets (Bass Boost, Vocal Clarifier, Rock, Acoustic, Flat).
3. **Duress Decoy Voice Memos (`DuressDecoyScreen.tsx`)**:
   - Plausible deniability mode triggered by PIN `9999`. Shows innocent recordings ("Acoustic Guitar Riff", "Biology Lecture").
4. **Stealth Studio Vault (`VaultDashboardScreen.tsx`)**:
   - Triggered by PIN `1337`.
   - Dual-Mode AES-256 telemetry cards, action shortcuts, and locked stego image storage shelf.
5. **Encode & Embed Studio (`EncodeStudioScreen.tsx`)**:
   - Cover photo picker, multi-payload switcher (Text, Voice note, File/PDF), stego mode selector (Ghost Stealth PRNG LSB vs Social Media DCT), and real-time distortion gauge (PSNR 54.1 dB, 99.8% undetectable).
6. **Decode & Extract Studio (`DecodeStudioScreen.tsx`)**:
   - Stego image dropzone, shared key input, QR code hook, and authenticated decrypted payload card.
7. **Ghost Chat Messenger (`GhostChatScreen.tsx`)**:
   - Visual photo-based private chat thread where photos conceal secrets. Tapping any photo inline reveals the decrypted message bubble.
8. **Future Feature & API Integration Modals (`FeatureComingSoonModal.tsx`)**:
   - Popups explaining upcoming backend FastAPI / on-device Skia engine integration points.

---

## 🚀 How to Run the App on Your Machine

### Step 1: Install Node.js (One-time setup)
Open PowerShell and install the LTS version of Node.js using Windows Package Manager (`winget`):

```powershell
winget install OpenJS.NodeJS.LTS
```
*(Or download the installer directly from [nodejs.org](https://nodejs.org/)).*  
After installing, restart your terminal to refresh your `PATH`.

### Step 2: Install Project Dependencies
In this folder (`c:\Users\ykash\Desktop\Project\steganography`), run:

```powershell
npm install
```

### Step 3: Start the App
To start the Expo development server:

```powershell
npx expo start
```

* **On your phone**: Install the **Expo Go** app (free on iOS App Store & Google Play Store) and scan the QR code displayed in your terminal.
* **In your browser (Web)**: Press `w` in your terminal or run `npx expo start --web`.
* **On Android Emulator**: Press `a` in your terminal.
* **On iOS Simulator**: Press `i` in your terminal.

---

## 🔑 Secret Passcodes
* **Vault Unlock PIN**: `1337`
* **Duress Decoy PIN**: `9999`
