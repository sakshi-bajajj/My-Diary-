# My Diary 🩵

A cute blue "diary" style to-do app for iPhone, built with Expo and React Native. It turns daily tasks into a small game, with progress flowers, streaks, XP, badges and unlockable themes.

## Features

**Tasks**
- Add, edit and delete tasks, with a date and time picker
- Five categories: Work, Study, Personal, Content, Other
- High, Medium and Low priority, shown as colored dots with a legend
- Subtasks and notes on every task
- Search across titles, notes and subtasks
- Unfinished tasks carry over to today automatically
- Reminders: tap the bell on a task to get a notification at its time

**Progress**
- Daily progress bar with one flower per task
- Weekly chart of completed tasks
- Breakdown by priority and by category
- Calendar with a dot on every day that has tasks

**Rewards**
- XP and levels (10 XP per task, 20 for high priority)
- A reward path with four stages, each with Bronze, Silver and Gold tiers
- Unlockable themes: Blue Diary, Pink Blossom, Lavender Dream and Midnight
- More perks: tulip stickers, sparkly popups, a Diary Queen crown and a secret message
- Daily streak counter
- Focus timer that earns bonus XP

**Feel**
- Celebration popups with random encouraging messages
- Greeting that changes with the time of day
- All data is saved on the phone, so nothing is lost when the app closes

## Screenshots

| Home | Calendar | Rewards |
|------|----------|---------|
| ![Home](screenshots/home.png) | ![Calendar](screenshots/calendar.png) | ![Rewards](screenshots/rewards.png) |

| Progress by priority | Progress by category | Profile |
|----------------------|----------------------|---------|
| ![Progress by priority](screenshots/progress-priority.png) | ![Progress by category](screenshots/progress-category.png) | ![Profile](screenshots/profile.png) |

## Tech stack

- [Expo](https://expo.dev) SDK 58 and React Native
- Expo Router, with native tabs
- TypeScript
- AsyncStorage for saving data
- react-native-calendars, expo-notifications, and a date/time picker

## Run it yourself

You need Node.js and the Expo Go app on your iPhone.

```bash
npm install
npx expo start --tunnel
```

Scan the QR code with your iPhone camera to open it in Expo Go.

If you hit a version-conflict error during install, use:

```bash
npm install --legacy-peer-deps
```

## Notes

- Reminders are most reliable in a standalone build rather than Expo Go.
- The greeting name is set to "Sakshi" in `src/app/index.tsx`. Change it to your own.

## What I learned

Built step by step with the help of Claude: state management, local storage, theming with React context, notifications and date handling, from a Windows laptop with no Mac.



