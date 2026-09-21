# WhenNot2Meet

A clean, modern scheduling web app that's the opposite of When2Meet - users mark when they're **NOT** available to find the best meeting times.

**Try it:** [when2notmeet.com](https://when2notmeet.com)

## Features

- **Two-screen workflow**: Name input + day selection → Interactive scheduling grid
- **Drag-to-mark interface**: Smooth click-and-drag to mark busy times
- **Multi-user collaboration**: Share sessions and view group availability
- **Clean black/white design**: Professional aesthetic using shadcn/ui
- **Smart overlap visualization**: Color-coded view showing when people are available
- **Database persistence**: SQLite database with Prisma ORM
- **Responsive design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with clean black/white theme
- **Database**: SQLite with Prisma ORM
- **Deployment**: Vercel-ready

## Getting Started

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## Usage Flow

1. **Create Schedule**: Enter your name and select the days you want to schedule
2. **Mark Busy Times**: Drag on the grid to mark times when you're NOT available (red = busy)
3. **Share**: Get a shareable link to invite others to the session
4. **View Group Availability**: See color-coded overlap showing the best meeting times

## API Routes

- `POST /api/schedules` - Create a new schedule with busy times
- `GET /api/session/[sessionId]` - Get all schedules for a session

## Database Schema

- **Schedule**: User info and selected days for a session
- **BusySlot**: Individual time slots marked as unavailable

## Deployment

Ready to deploy to Vercel with zero configuration. The SQLite database will work for development and small-scale production use.

## Color Coding

- **White**: Everyone is available
- **Light Red**: Some people are busy
- **Dark Red**: Most/all people are busy
