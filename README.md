# 🏠 ChoreHub – Household Chore-Sharing and Scheduling App

ChoreHub is a mobile application developed to make household chore management easier and more organized. It allows family members to manage chores, view schedules, track progress, receive notifications, and manage household activities through a single application.

The application was developed as part of the **IT3060 – Human Computer Interaction** module, following a human-centered design process from user research and prototyping to implementation and usability testing.

---

## 📱 About the Project

Managing household chores can become difficult when responsibilities are not clearly assigned or when family members do not know what needs to be completed.

ChoreHub provides a simple solution where household members can view their responsibilities, check schedules, and track chore completion. Administrators can manage household members, assign chores, monitor schedules, and view overall household progress.

The final application was implemented based on the high-fidelity prototype developed during the previous design milestone.

---

## ✨ Main Features

### 👤 Authentication, Profile & Support
- User registration and login
- Secure authentication
- User profile management
- Edit personal information
- Update profile picture
- Change password
- Help and support
- FAQs and contact support
- Logout

### 📋 Chore Management
- View household chores
- Create new chores
- Assign chores to household members
- View chore details
- Edit existing chores
- Delete chores
- Set priority and due dates
- Track chore status
- Mark assigned chores as completed

### 👨‍👩‍👧‍👦 Family & Scheduling
- View household members
- Add registered users to a family
- Manage household relationships
- View personal and household calendars
- View chore schedules
- Day, week, and month schedule views

### 📊 Progress, Notifications & Settings
- Track chore completion progress
- View completed and pending chores
- View household/member progress
- View chore history
- Receive notifications
- Manage notification settings
- Manage application preferences

---

## 👥 User Roles

### 👑 Admin

The Admin has access to household management functionality, including:

- Manage users
- Manage chores
- Manage family members
- Assign chores
- View household schedules
- Monitor household progress
- View notifications
- Manage own profile

### 👤 Member / User

Normal household members can:

- View assigned chores
- View chore details
- Mark their chores as completed
- View family members
- View their calendar and schedule
- Track their progress
- View notifications
- Manage their own profile and settings

---

## 🧩 Project Components

The project was divided among four team members.

| Member | Component | Main Responsibilities |
|---|---|---|
| Member 1 | Authentication, Profile & Support | Login, registration, profile management, password management and support |
| Member 2 | Chore Management | Create, view, update, delete, assign and manage chores |
| Member 3 | Family & Scheduling | Family members, household management, calendar and scheduling |
| Member 4 | Progress, Notifications & Settings | Progress tracking, notifications, history and application settings |

---

## 🛠️ Technology Stack

### Frontend
- React Native
- Expo
- Expo Router
- TypeScript

### Backend
- Node.js
- Express.js
- REST API

### Database
- PostgreSQL
- Neon PostgreSQL

### Other Tools
- Git
- GitHub
- Visual Studio Code
- Expo Go
- Figma

---

## 🏗️ System Architecture

ChoreHub follows a client-server architecture.

```text
┌─────────────────────────────┐
│     ChoreHub Mobile App     │
│ React Native + Expo Router  │
└──────────────┬──────────────┘
               │
               │ REST API
               ▼
┌─────────────────────────────┐
│      Node.js / Express      │
│          Backend            │
└──────────────┬──────────────┘
               │
               │ PostgreSQL
               ▼
┌─────────────────────────────┐
│      Neon PostgreSQL        │
│          Database           │
└─────────────────────────────┘
