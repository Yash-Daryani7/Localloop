# LocalLoop

**A neighborhood community platform for staying connected to the people and activity nearby.**

LocalLoop brings neighborhood conversations and useful local activity into one place. Neighbors can share updates, organize events, exchange items, ask for help, and make community decisions without relying on scattered group chats and posts.

## The problem

Local communities often coordinate across separate messaging groups, social feeds, event pages, and classifieds. Useful information gets buried, and it can be difficult to know what is happening close to home or who to contact.

LocalLoop organizes these everyday interactions around a member’s neighborhood, with dedicated spaces for chat, events, local listings, services, polls, and a map.

## Features

- **Neighborhood accounts** — Register or sign in, choose a neighborhood on an interactive map or use GPS, add a profile photo and bio, and follow other members.
- **Community home** — Browse neighborhood activity from one place.
- **Events** — Create, update, and manage local events; browse event details; RSVP or cancel an RSVP; and add event images.
- **Marketplace** — Post items for sale, wanted items, or free items; express interest; manage your listings; and mark an item as sold.
- **Local services** — Post a service request, respond to a neighbor’s request, and close or remove requests.
- **Community polls** — Create polls with options and an end time, vote once, and view results.
- **Community chat** — Send messages to the neighborhood room with live message updates, online member presence, and typing indicators.
- **Direct messages** — Have private one-to-one conversations with neighbors.
- **Notifications** — Receive in-app notifications and keep track of unread activity.
- **Neighborhood map** — Explore event and marketplace markers, filter the map by activity type, and view the selected neighborhood area.
- **Responsive interface** — Use the app on desktop and mobile screens.

## Project structure

```text
backend/
  controllers/   API request handling
  middlewares/   Authentication and uploads
  models/        MongoDB/Mongoose schemas
  routes/        Express API routes
  utils/         Shared server utilities
  index.js       Express and Socket.IO server

frontend/vite-project/
  src/components/ Reusable React UI
  src/pages/      Application screens
  src/store/      Redux store and feature slices
  src/api/        API client
  vercel.json     SPA routing rewrite
```

## Project demo video

[Watch the LocalLoop project demo](https://drive.google.com/file/d/1tC3sOF3j3Yv5gg3X9b9i505ZupfxBvnd/view?usp=drive_link)
