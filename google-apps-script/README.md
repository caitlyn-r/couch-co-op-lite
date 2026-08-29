# 📊 Google Sheets Backend for Couch Co-Op Lite

Turn any blank Google Sheet into your private, real-time database in under **60 seconds**.

---

## ⚡ 3-Step Setup

### Step 1: Create a Google Sheet
1. Open [sheets.new](https://sheets.new) in your browser.
2. Name the sheet **"Couch Co-Op Watchlist"** (or anything you like).

---

### Step 2: Paste the Apps Script
1. In the Google Sheet menu, click **Extensions** → **Apps Script**.
2. Delete any existing boilerplate code in the editor.
3. Copy all code from [`Code.gs`](./Code.gs) and paste it into the editor.
4. Click the 💾 **Save** icon (or `Ctrl+S` / `Cmd+S`).

---

### Step 3: Deploy as a Web App
1. Click the blue **Deploy** button (top-right) → **New deployment**.
2. Click the gear icon ⚙️ next to "Select type" and choose **Web app**.
3. Fill in the deployment settings:
   - **Description**: `Couch Co-Op Sync`
   - **Execute as**: `Me (your email)`
   - **Who has access**: `Anyone` *(Important: Allows your web app to read and write without complex OAuth)*
4. Click **Deploy**.
5. Copy the generated **Web App URL** (it looks like `https://script.google.com/macros/s/AKfycb.../exec`).

---

### Step 4: Paste into Couch Co-Op Lite
1. Open **Couch Co-Op Lite** in your browser.
2. Click the **Settings (⚙️)** icon in the top right.
3. Paste your Web App URL into the **Google Sheets Webhook Sync URL** field.
4. Click **Test & Sync** → **Save Settings**.

🎉 **You're all done!** Your watchlist is now live-synced to your Google Sheet in real-time. Both you and your partner can access the app from anywhere!
