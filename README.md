# Momentum Task Manager

A simple, polished task manager built with Next.js, TypeScript and browser local storage. It is ready to push to GitHub and deploy on Vercel.

## Features
- Add tasks with a title, description, start date, due date and priority
- Update status: Not started, In progress, Completed
- Track progress from 0% to 100%
- Dashboard metrics and overall progress
- Overdue and upcoming timeline updates
- Search and status filters
- Persistent browser storage with no database setup
- Responsive layout for desktop and mobile

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Deploy using GitHub and Vercel
1. Create a new GitHub repository.
2. Upload/push all files from this folder.
3. In Vercel, select **Add New > Project** and import the repository.
4. Keep the detected Next.js defaults and select **Deploy**.

## Important architecture note
This starter stores tasks in the current browser using `localStorage`. It is ideal for a private, single-device MVP. Data will not sync across devices or users. For a shared production version, replace local storage with Vercel Postgres/Neon or Supabase and add authentication.
