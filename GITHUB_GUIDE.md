# How to Upload Code to GitHub

Since you don't have `git` installed on your command line yet, here is the easiest way to do it manually, or the professional way by installing Git.

## Option 1: The "Drag & Drop" Way (Easiest - No Installation)

1.  **Create a Repository**:
    *   Go to [GitHub.com](https://github.com) and sign in.
    *   Click the **+** icon in the top-right corner and select **New repository**.
    *   Name it `alankar-jewellers`.
    *   Initialize with nothing (uncheck "Add a README file").
    *   Click **Create repository**.

2.  **Upload Files**:
    *   On the next screen, look for the link that says: **"uploading an existing file"**. Click it.
    *   Open your project folder `d:\Projects\alankar-jewellers` in your File Explorer.
    *   **Select Everything** (backend, frontend, DEPLOYMENT.md) **EXCEPT** `node_modules`.
        *   *Note: If you see a `node_modules` folder inside backend or frontend, DO NOT upload it. It's huge and unnecessary.*
    *   Drag and drop the selected files/folders onto the GitHub webpage.
    *   Wait for them to upload.
    *   In the "Commit changes" box at the bottom, type "Initial code" and click **Commit changes**.

---

## Option 2: The "Developer" Way (Recommended)

1.  **Install Git**:
    *   Download Git for Windows: [git-scm.com/download/win](https://git-scm.com/download/win)
    *   Install it (Click Next, Next, Next...).
    *   **Restart your computer** or VS Code after installing.

2.  **Run Commands**:
    *   Open the terminal in VS Code (`Ctrl + ~`).
    *   Run these commands one by one:
    ```bash
    git init
    git add .
    git commit -m "My first upload"
    ```

3.  **Connect to GitHub**:
    *   Copy the 3 lines of code shown on your empty GitHub Repository page (under "…or push an existing repository from the command line").
    *   It looks like this:
        ```bash
        git remote add origin https://github.com/YOUR_USERNAME/alankar-jewellers.git
        git branch -M main
        git push -u origin main
        ```
    *   Paste them into your terminal and hit Enter.
    *   It might ask for your GitHub username and password (or browser login).
