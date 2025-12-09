# HelpDeskPro - Support Ticket Management System

## General Description

**HelpDeskPro** is a modern web application developed with Next.js and TypeScript that centralizes and optimizes technical support ticket management. The system allows clients to create and track their tickets, while agents can manage, respond to, and resolve requests efficiently.

### Problem Solved

Before HelpDeskPro, ticket management was done through:
- Scattered emails
- Chats without traceability
- Disorganized spreadsheets

**HelpDeskPro solves this by providing:**
-  Centralized ticket registry
-  Clear tracking of each ticket's status
-  Priority and assignment system
-  Automatic email notifications
-  Metrics and reports for management

---
![login](1.png)
![dashboard client](2.png)
![Created ticket](3.png)
![Comment](4.png)
## Technologies Used

- **Frontend:** Next.js 14+ (App Router), React 18+, TypeScript
- **Backend:** Next.js API Routes
- **Database:** MongoDB with Mongoose
- **Authentication:** NextAuth.js
- **Styles:** Tailwind CSS
- **HTTP Client:** Axios
- **Notifications:** Nodemailer
- **Validations:** Zod / React Hook Form

---

## Main Features

### User and Role Management

- **Secure authentication** with NextAuth.js
- **Two main roles:**
  - **Client:** Creates and tracks their tickets
  - **Agent:** Manages, responds to, and resolves tickets
- **Route protection** according to user role
- **Context API** for session state management

### Ticket Management

**Ticket Properties:**
- Title and description
- Status: `open` | `in_progress` | `resolved` | `closed`
- Priority: `low` | `medium` | `high`
- Creator user and assigned agent
- Creation and update dates

**Features:**
-  Create new tickets (Clients)
-  Edit status, priority, and assignment (Agents)
-  Close tickets
-  Filters by status and priority
-  Customized visualization by role

### Comments System

- Conversation thread per ticket
- Clients can add additional information
- Agents can respond and provide updates
- Chronological order of comments
- Automatic notifications per response

### Email Notifications

**Automatic email sending when:**
-  A new ticket is created
-  An agent responds to the ticket
-  The ticket is closed

---

## Installation and Configuration

###  Clone the Repository

```bash
git clone https://github.com/BrandonSM11/PruebaNEXT.git
cd helpdeskpro
```

###  Install Dependencies

```bash
npm install
```




###  Run the Project

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

---

## 📂 Project Structure

```
my-app/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API Routes
│   │   │   ├── auth/            # Authentication
│   │   │   ├── tickets/         # Tickets CRUD
│   │   │   └── comments/        # Comments management
│   │   ├── clientdash/          # Client panel
│   │   ├── agentdash/           # Agent panel
│   │   └── layout.tsx           # Main layout
│   ├── components/              # Reusable components
│   │   ├── button/             # Button component
│   │   ├── ticket/             # TicketCard component
│   │   └── comments/           # Comments system
│   ├── database/               # MongoDB models
│   │   ├── models/
│   │   │   ├── user.ts        # User model
│   │   │   ├── tickets.ts     # Ticket model
│   │   │   └── comment.ts     # Comment model
│   ├── lib/
│   │   └── db.ts              # MongoDB connection
│   ├── service/               # Services and API calls
│   │   ├── tickets.ts        # Tickets service
│   │   ├── comments.ts       # Comments service
│   │   └── userEmail.ts      # Email service
│   ├── context/              # Context API
│   │   └── AuthContext.tsx   # Authentication context
│   └── types/                # TypeScript types
│       └── index.ts
├── public/                   # Static files
├── .env.local               # Environment variables (not included in git)
├── package.json
├── tsconfig.json
└── README.md
```

---

## Test Users

### Clients
```
Email: cliente@test.com
Password: 123456

Email: brandonsm1999@gmail.com
Password: 123456
```

### Agents
```
Email: agente@test.com
Password: 123456

Email: brandon13461@gmail.com
Password: 123456
```

---

## Main Flows

### 1. Client Flow

1. **Login** → Client Panel
2. **Create Ticket** → Complete the form with validations
3. **View My Tickets** → List with filters
4. **Add Comments** → Ticket tracking
5. **Receive Notifications** → Automatic email

### 2. Agent Flow

1. **Login** → Agent Panel
2. **View All Tickets** → Dashboard with filters
3. **Assign Ticket** → Assignment to self or another agent
4. **Respond to Ticket** → Add comments
5. **Change Status** → `in_progress`, `resolved`, `closed`
6. **Close Ticket** → Finalize the process

---

## Developer Information

**Name:** Brandon Stiven Arredondo Muñoz  
**Clan:** Gossling  
**Email:** brandon13461@gmail.com  
**GitHub:** [BrandonSM11](https://github.com/BrandonSM11)

---

