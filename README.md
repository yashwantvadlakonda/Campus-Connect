# Campus Connect

> A centralized campus platform to discover opportunities, participate in hackathons, manage events, and find the right teammates through skill-based matching.

Campus Connect is a web-based campus collaboration platform designed to connect students, faculty, and administrators through a unified digital ecosystem.

The platform provides separate portals for students and faculty/administrators. Faculty can create and manage hackathons, publish events, and share announcements, while students can discover opportunities, build teams, and connect with other students based on their technical skills, interests, and project requirements.

One of the core ideas behind Campus Connect is making it easier for students to find suitable teammates instead of struggling to build teams independently.

---

## 🚀 Live Demo

**Live Application:** [Add your deployed URL]

**GitHub Repository:**  
https://github.com/yashwantvadlakonda/Campus-Connect

---

## 📌 Problem Statement

Students often face difficulties discovering hackathons, workshops, technical events, and other campus opportunities.

Another major challenge is finding suitable teammates for hackathons and collaborative projects.

For example, a student interested in participating in an AI hackathon may have Python and Machine Learning skills but may not know anyone with frontend, backend, or UI/UX experience.

Similarly, students with different technical skills may struggle to connect with one another and form balanced teams.

Faculty and administrators also need a centralized platform to publish events, manage hackathons, and communicate information to students.

Campus Connect aims to address these challenges through one integrated platform.

---

## 💡 Solution

Campus Connect brings students, faculty, and administrators together through separate role-based portals.

The platform focuses on three major areas:

1. **Campus Opportunity Management:** Create, publish, and discover hackathons, workshops, and events.
2. **Skill-Based Team Formation:** Help students discover suitable teammates based on skills, interests, proficiency, and project requirements.
3. **Centralized Campus Management:** Provide faculty and administrators with tools to manage activities and communicate updates.

---

## ✨ Features

### 1. Faculty & Admin Portal

A centralized dashboard for faculty and administrators to manage campus activities.

**Features:**

- Faculty and administrator dashboard
- Create and manage hackathons
- Publish technical and non-technical events
- Create workshops and competitions
- Manage event information
- Manage registrations and participation
- Publish announcements
- Update event details
- Monitor campus activities
- Manage student-related information

### 2. Student Portal

A dedicated portal where students can discover opportunities and participate in campus activities.

**Features:**

- Student dashboard
- Browse published hackathons
- Discover workshops and events
- View event descriptions and requirements
- Explore available opportunities
- Manage student profiles
- Add technical and non-technical skills
- Specify interests and preferred roles
- Explore team formation opportunities
- Manage team invitations and requests

### 3. Skill-Based Team Formation & Teammate Matching

<badge color="success">Core Feature</badge>

One of the major challenges for students participating in hackathons and collaborative projects is finding teammates with the right skills.

Campus Connect aims to simplify team formation by connecting students based on their current technical skills, interests, experience, and project requirements.

**Key Features:**

- Student skill profiles
- Add and update technical skills
- Define skill proficiency levels
- Specify areas of interest
- Select preferred project roles
- Create project or hackathon teams
- Define required team roles
- Specify required skills for each role
- Discover students with matching skills
- Find teammates with complementary skills
- Send team invitations
- Accept or reject invitations
- View team members and their skills
- Manage team participation

#### How Skill-Based Matching Works

1. Students create their profiles and add their existing skills.
2. Students specify their interests and preferred roles.
3. A team creator creates a team or project.
4. The creator defines the required skills and roles.
5. Campus Connect identifies students whose profiles match the requirements.
6. Students can explore suitable candidates.
7. Team creators can send invitations to selected students.
8. Students can accept or reject invitations.

#### Example 1: AI Hackathon Team Formation

A student wants to participate in an AI hackathon and needs a four-member team.

| Required Role | Required Skills |
|---|---|
| AI/ML Developer | Python, Machine Learning |
| Frontend Developer | React, JavaScript |
| Backend Developer | Python, FastAPI |
| UI/UX Designer | Figma, UI Design |

Campus Connect helps the team creator discover students who have these skills and are interested in participating.

#### Example 2: Complementary Skill Matching

A student has experience in Python and Machine Learning but has limited frontend development knowledge.

The platform can recommend students with:

- React and JavaScript skills
- UI/UX design experience
- Backend development skills

This helps students build balanced teams with complementary skill sets rather than selecting teammates only because they have similar skills.

**Goal:** Help students find the right teammates, form balanced teams, and collaborate more effectively.

### 4. Hackathon & Event Management

- Create hackathons
- Publish event details
- Display event dates and deadlines
- Provide participation information
- Manage event registrations
- Allow students to discover available events
- Centralize campus event information

### 5. Announcements & Updates

- Publish important campus announcements
- Share event-related updates
- Provide students with relevant information
- Keep campus activities organized in one platform

---

## 🏗️ System Architecture

Campus Connect follows a frontend-backend architecture with separate student and faculty/admin interfaces.

```text
                    CAMPUS CONNECT
                           |
             +-------------+-------------+
             |                           |
             v                           v
       FACULTY / ADMIN               STUDENT
           PORTAL                    PORTAL
             |                           |
             v                           v
       Manage Hackathons           Discover Events
       Publish Events              Find Teammates
       Manage Activities           Skill Matching
       Announcements               Create Teams
             |                           |
             +-------------+-------------+
                           |
                           v
                    REACT FRONTEND
                           |
                           v
                     PYTHON BACKEND
                           |
                           v
                    DATABASE LAYER
                           |
                           v
                 PERSISTENT DATA STORAGE
```

---

## 🔄 Skill-Based Team Matching Workflow

```text
                STUDENT REGISTRATION
                         |
                         v
                 CREATE STUDENT PROFILE
                         |
                         v
                  ADD CURRENT SKILLS
                         |
                         v
                 SELECT INTERESTS
                         |
                         v
                SELECT PREFERRED ROLES
                         |
                         v
                 CREATE OR JOIN TEAM
                         |
                         v
               DEFINE REQUIRED SKILLS
                         |
                         v
                 SKILL MATCHING
                         |
                         v
              DISPLAY SUITABLE STUDENTS
                         |
                         v
                SEND TEAM INVITATION
                         |
                         v
                ACCEPT / REJECT REQUEST
                         |
                         v
                  TEAM FORMATION
```

The matching approach should consider complementary skills, required roles, proficiency levels, interests, and availability rather than relying only on identical skill names.

---

## 🗄️ Database

Campus Connect uses a database-backed architecture to store and manage application information.

The project includes database initialization scripts and migration files in the `database/` directory, along with backend database configuration.

Application data includes the following logical categories:

| Data Category | Purpose |
|---|---|
| Users | Account and authentication information |
| Student Profiles | Student details and interests |
| Skills | Technical skills and proficiency |
| Hackathons | Hackathon information |
| Events | Campus event details |
| Registrations | Student participation information |
| Teams | Team information and membership |
| Team Invitations | Team joining requests |
| Announcements | Campus updates |

The exact database schema and relationships are defined by the SQL initialization scripts and migrations.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React.js | Frontend development |
| Vite | Frontend build tool |
| JavaScript | Application development |
| Tailwind CSS | UI styling |
| React Router | Navigation and routing |
| Framer Motion | Animations and transitions |
| Recharts | Data visualization |
| Python | Backend development |
| FastAPI | Backend API framework |
| PostgreSQL | Relational database configuration |
| Supabase | Database and backend services |
| Git | Version control |
| GitHub | Source code management |
| Render | Deployment configuration |

---

## 📂 Project Structure

```text
Campus-Connect/
│
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   ├── sqlite_store.py
│   ├── requirements.txt
│   ├── scripts/
│   └── .env.example
│
├── database/
│   ├── init.sql
│   ├── purge_and_verify.sql
│   ├── README.md
│   └── migrations/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── public/
│
├── src/
│   ├── components/
│   ├── contexts/
│   ├── pages/
│   └── services/
│
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── render.yaml
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

---

## 💻 Getting Started

### Prerequisites

Install the following:

- Node.js 22.12 or later
- npm
- Python 3
- Git
- Supabase account (if using Supabase services)

### 1. Clone the Repository

```bash
git clone https://github.com/yashwantvadlakonda/Campus-Connect.git
```

Move into the project directory:

```bash
cd Campus-Connect
```

### 2. Frontend Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root.

Configure the required environment variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_key
VITE_BACKEND_URL=http://localhost:8000/api
```

Start the development server:

```bash
npm run dev
```

Open the application:

```text
http://localhost:5173
```

### 3. Backend Setup

Open another terminal and navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv .venv
```

Activate the virtual environment on Windows:

```powershell
.venv\Scripts\Activate.ps1
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

Configure backend environment variables using `backend/.env.example`.

Start the backend using the configured application entry point. For a FastAPI application exposed as `app` in `main.py`, use:

```bash
uvicorn main:app --reload
```

The backend will typically be available at:

```text
http://localhost:8000
```

---

## 🔐 Environment Variables & Security

Campus Connect uses environment variables for application configuration and database connectivity.

Security practices:

- Never commit real `.env` files.
- Never expose Supabase service-role keys in frontend code.
- Keep backend secrets on the server.
- Use `.env.example` to document required configuration.
- Apply appropriate database access policies.
- Validate user input on the backend.
- Enforce role-based authorization for protected operations.

---

## 🚀 Deployment

The repository includes a `render.yaml` configuration for deploying the frontend as a static site.

### Frontend Build

```bash
npm install
npm run build
```

### Production Build Directory

```text
dist/
```

### Deployment Configuration

The Render configuration specifies:

- Service type: Static Site
- Build command: `npm install && npm run build`
- Publish directory: `./dist`

Configure the required environment variables in the deployment platform before deployment.

The backend must be deployed and configured separately if it is hosted as an independent API service.

---

## 📚 What I Learned

Developing Campus Connect provides practical experience in:

- Full-stack web application development
- React component architecture
- Frontend and backend integration
- REST API development
- Database design and management
- Authentication and role-based access
- Student profile management
- Skill-based teammate matching
- Team formation and collaboration workflows
- Hackathon and event management
- Database migrations
- Environment configuration
- Git and GitHub workflows
- Application deployment

---

## 🔮 Future Improvements

- More advanced skill-based teammate recommendations
- Improved team compatibility scoring
- Team availability and scheduling
- Student portfolio integration
- GitHub profile integration
- Project collaboration workspaces
- Real-time team communication
- Personalized hackathon recommendations
- Advanced event analytics
- Real-time notifications
- Mobile application
- AI-assisted team recommendations

---

## 🔗 Project Links

**GitHub Repository:**  
https://github.com/yashwantvadlakonda/Campus-Connect

**Live Application:**  
Add your deployed application URL.

---

## 👨‍💻 Author

**Yashwanth Vadlakonda**

B.Tech – Computer Science and Engineering (AI & ML)

GitHub:  
https://github.com/yashwantvadlakonda

---

## ⭐ Project

Campus Connect aims to make campus opportunities more accessible and collaboration easier by connecting students, faculty, and administrators through a single platform.

From discovering hackathons to finding teammates with complementary skills, Campus Connect brings the campus ecosystem together.
