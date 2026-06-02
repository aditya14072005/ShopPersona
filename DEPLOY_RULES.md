# Fix: Deploy Firestore Rules (REQUIRED)

All issues — orders not showing, cart not persisting, wishlist not saving —
are caused by Firestore security rules blocking writes from the browser.

## Option A: Firebase Console (Easiest — 2 minutes)

1. Open https://console.firebase.google.com
2. Select your project: **shoppersona**
3. In the left sidebar click **Firestore Database**
4. Click the **Rules** tab at the top
5. Delete ALL existing content in the editor
6. Copy and paste the ENTIRE contents of `firestore.rules` from this project
7. Click **Publish**

Done. Reload your app and everything will work.

---

## Option B: Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # select your project, accept defaults
firebase deploy --only firestore:rules
```

---

## How to verify it worked

Open browser DevTools → Console tab.
- Before fix: you'll see `FirebaseError: Missing or insufficient permissions`
- After fix: no Firebase errors, cart/orders/wishlist all work

---

## Current rules summary

| Collection        | Who can read/write                    |
|-------------------|---------------------------------------|
| users             | Owner only                            |
| carts             | Owner only                            |
| orders            | Any logged-in user                    |
| wishlists         | Owner only                            |
| user_addresses    | Owner only                            |
| user_payments     | Owner only                            |
| user_behavior     | Owner only                            |
| reviews           | Anyone can read, logged-in can write  |
| returns           | Any logged-in user                    |
| product_presence  | Any logged-in user                    |
