# Deployment Guide for Alankar Jewellers

This guide will help you host your website properly on the internet for free using **Render** (for hosting) and **MongoDB Atlas** (for the database).

## Part 1: Database Setup (MongoDB Atlas)
1.  Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2.  Create a **New Cluster** (select the free "M0 Sandbox" tier).
3.  **Database Access**: Create a database user (e.g., `admin`) and password. **Remember this password**.
4.  **Network Access**: Click "Add IP Address" and select **"Allow Access from Anywhere"** (`0.0.0.0/0`).
5.  **Get Connection String**:
    *   Click "Connect" > "Connect your application".
    *   Copy the URL. It looks like: `mongodb+srv://admin:<password>@cluster0.mongodb.net/...`
    *   Replace `<password>` with your actual password.
    *   **Save this URL**, you will need it later.

---

## Part 2: Prepare Your Code (GitHub)
1.  Create a **GitHub Account** if you don't have one.
2.  Create a **New Repository** named `alankar-jewellers`.
3.  Upload your project code to this repository. You can do this via VS Code:
    *   Click the "Source Control" icon (left sidebar).
    *   Click "Initialize Repository".
    *   Commit all files with a message like "Initial commit".
    *   Click "Publish Branch" and select your GitHub account.

---

## Part 3: Deploy to Render (Hosting)
1.  Go to [Render.com](https://render.com) and create a free account (sign in with GitHub).
2.  Click **"New +"** and select **"Web Service"**.
3.  Connect your `alankar-jewellers` repository.
4.  **Configure the Service**:
    *   **Name**: `alankar-jewellers` (or any unique name).
    *   **Root Directory**: `backend` (Important: Type exactly `backend`).
    *   **Environment**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server.js`
    *   **Instance Type**: `Free`
5.  **Environment Variables** (Scroll down to "Advanced" or "Environment"):
    *   Click "Add Environment Variable".
    *   Key: `MONGO_URI`
    *   Value: *(Paste your MongoDB Connection String from Part 1)*.
    *   Click "Add Environment Variable".
    *   Key: `JWT_SECRET`
    *   Value: `mysecretkey123` (or any long random password).
6.  Click **"Create Web Service"**.

## Part 4: Finish & Test
*   Render will start building your site. It may take 2-3 minutes.
*   Once it says **"Live"**, click the URL at the top (e.g., `https://alankar-jewellers.onrender.com`).
*   Your site is now live! 
*   **Important**: Since it's a new database, you will need to:
    1.  Go to the `/admin.html` page on the live site.
    2.  Login (or create a seed script if login fails) - *Note: The first time, you might need to manually insert an admin user directly in MongoDB Atlas or use a registration backdoor if available. Currently, the code has a seed script `seed.js`, you can run it locally pointing to the live DB to create the initial admin.*

### How to Create Initial Admin (One-time):
1.  In your local VS Code terminal, stop the local server.
2.  Run this command (replace user/pass with your MongoDB credentials):
    ```powershell
    set MONGO_URI=mongodb+srv://admin:pass@cluster...
    node backend/seed.js
    ```
3.  This will create the admin user `admin@gmail.com` / `admin123` in your live database.
