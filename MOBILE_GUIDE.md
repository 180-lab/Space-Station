# Mobile Development & Deployment Guide
## Galactose: Tactical Fleet Command (Android APK / Google Play & iOS App Store)

This guide outlines exactly how to bundle your React application into a high-performance native app for **Android (Google Play)** and **iOS (Apple App Store)** using **Capacitor**—the modern industry standard by Ionic.

---

## 🛰️ How the Mobile Architecture Works

Normally, this is a full-stack game with a React frontend and an Express Node.js backend. A mobile device (like an Android phone or iPhone) cannot run an Express server locally.

To solve this elegantly:
1. **Local Native Frontend**: The React UI runs locally on the phone inside a fast, sandboxed WebView. This ensures maximum click responsiveness.
2. **Cloud-Hosted Game Logic**: The Express backend game engine stays hosted securely in the cloud (your Cloud Run instance).
3. **Automated Interceptor**: We have integrated a **global fetch interceptor** in `src/main.tsx`. When the React app detects it is running inside native Android/iOS, it dynamically prepends `/api` endpoint requests with your hosted URL:
   `https://ais-dev-b3fusvtmpzbes4i5sek2jk-304053633303.europe-west2.run.app`
   
This means **no code changes** are required to compile for Android or iOS!

---

## 🛠️ Step 1: Install Mobile Dependencies Locally

To package your app, open your terminal in the project's root folder and run:

1. **Install Capacitor Core**:
   ```bash
   npm install @capacitor/core
   ```

2. **Install Capacitor Dev Tools and Platforms**:
   ```bash
   npm install -D @capacitor/cli @capacitor/android @capacitor/ios
   ```

3. **Initialize Capacitor** (Already done for you via `capacitor.config.json`):
   This configures your bundle ID to `com.galactose.tacticalgame` (feel free to change this in `capacitor.config.json` to your own verified store name).

---

## 🤖 Step 2: Packaging for Android (Google Play)

### Prerequisites:
- Install [Android Studio](https://developer.android.com/studio) on your computer.

### Quick Build Routine:
Run the following commands in your project root:

```bash
# 1. Compile your React frontend assets
npm run build

# 2. Add the native Android platform project (Run once)
npx cap add android

# 3. Copy the compiled web code into the native Android folder
npx cap sync
```

### Building Your APK or App Bundle:
1. Launch Android Studio with the native project folder:
   ```bash
   npx cap open android
   ```
2. Wait for Android Studio to index the project and sync Gradle.
3. **To test on an Emulator or Physical Phone**:
   - Click the green **Run** arrow at the top.
4. **To Build the Downloadable APK / Google Play Package**:
   - In the top menu, go to **Build** &rarr; **Generate Signed Bundle / APK...**
   - Select **APK** (for private download or testing) or **Android App Bundle (AAB)** (required for uploading to Google Play).
   - Create or select an existing keystore signature file (keeps your app secure).
   - Click **Finish**. Android Studio will compile your customized native APK in minutes!

---

## 🍏 Step 3: Integrating for iOS (Apple App Store)

### Prerequisites:
- A macOS computer with [Xcode](https://developer.apple.com/xcode/) installed.
- An Apple Developer account (if publishing to the public App Store).

### Quick Build Routine:
Run the following commands in your terminal:

```bash
# 1. Make sure react build is up to date
npm run build

# 2. Add the iOS platform folder (Run once)
npx cap add ios

# 3. Synchronize assets to iOS assets folder
npx cap sync
```

### Compiling and Running via Xcode:
1. Open the project inside Xcode:
   ```bash
   npx cap open ios
   ```
2. In Xcode's sidebar, click the top **App** node.
3. Under **Signing & Capabilities**:
   - Check "Automatically manage signing".
   - Select your Apple Developer Team.
4. **To Test**:
   - Choose an iPhone simulator from the devices dropdown and press the play/run button.
5. **To Publish to App Store Connect / TestFlight**:
   - Set the destination device to **Any iOS Device (arm64)**.
   - Go to **Product** &rarr; **Archive**.
   - Once compiled, click **Distribute App** to send it directly to Apple TestFlight.

---

## 🔄 Keeping the App Synchronized

Whenever you change any button, CSS, or feature in your React frontend:
1. Rebuild the React frontend: `npm run build`
2. Sync the modifications to your Android/iOS projects: `npx cap sync`
3. Launch your native build or bundle directly from Android Studio or Xcode!
