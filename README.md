# VALORANT All Stars Overlay

A premium, custom-built overlay for Valorant All Stars tournaments, featuring high-end 3D card transitions, dynamic matchups, and real-time stats integration via Supabase.

## ✨ Features
- **Premium Design**: Gold & Obsidian theme with custom-coded SVG "First Light" (FLV) logo.
- **3D Transitions**: Smooth scene switching between team views and player comparisons.
- **Dynamic Matchups**: Select any 4 teams via URL parameters (e.g., `?teamA=TeamOphi&teamB=teamMyhowto`).
- **Live Stats**: Automatic stats fetching and compilation using a Python backend connected to Supabase.

## 🚀 Setup & Usage

### 1. Requirements
- A **Supabase** database with the required player/match schema.
- **Python 3.x** with `psycopg2` and `python-dotenv`.
- A local web server (e.g., `npx serve`, Live Server).

### 2. Configuration
1. Create a `.env` file in the root directory:
   ```env
   DB_CONNECTION_STRING=your_supabase_connection_string
   ```
2. Update `allstars_selection.json` with the player handles for your 4 teams.

### 3. Compile Data
Run the compiler script to fetch the latest stats from Supabase and generate the frontend data:
```bash
python allstars_compiler.py
```

### 4. Launch Overlay
Start a local server and open the overlay in your browser:
```bash
npx serve .
```
Access the overlay at: `http://localhost:3000/?teamA=TeamName1&teamB=TeamName2`

## 🎨 Credits
- **Logo Design**: Custom SVG implementation of the First Light (FLV) marque.
- **Animations**: CSS 3D Transforms & Transitions.
