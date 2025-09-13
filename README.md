# Civic Portal - Issue Management System

A comprehensive civic issue management system built with React, TypeScript, and Tailwind CSS. This application provides role-based access control, real-time issue tracking, SLA monitoring, and analytics for managing civic issues across different departments.

## 🚀 Features

### Authentication & Roles
- **Multi-role authentication system** with three user types:
  - **Super Admin**: Full system access, can manage all issues and departments
  - **Department Head**: Manages issues within their department
  - **Staff**: Views and updates assigned issues
- **Role-based access control** with protected routes
- **Secure login system** with demo credentials

### Dashboard
- **Real-time statistics** showing total, resolved, pending, and escalated issues
- **SLA breach tracking** with automatic alerts
- **Interactive map view** of reported issues with location data
- **Recent issues table** with comprehensive filtering
- **Role-based data filtering** (users only see their department's issues)

### Issue Management
- **Comprehensive issue tracking** with categories, priorities, and status updates
- **Assignment and reassignment** of issues to staff members
- **Status management** (Open, In Progress, Resolved, Escalated)
- **SLA deadline tracking** with automatic escalation
- **Image upload and viewing** with full-screen modal
- **Advanced filtering** by category, location, priority, and status

### Department Mapping
- **Department configuration** for different issue categories and locations
- **SLA settings** per department with customizable deadlines
- **Contact information management** for each department
- **CRUD operations** for department mappings (Super Admin only)

### Notifications
- **In-app notification system** with real-time updates
- **Browser notifications** for important events
- **Email notifications** for assignments, SLA breaches, and escalations
- **Notification history** with read/unread status

### Analytics & Reports
- **Real-time analytics** with department performance metrics
- **Issue distribution charts** by category
- **SLA compliance tracking** with trend analysis
- **Department performance comparison**
- **Resolution time analytics**

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite
- **State Management**: React Context API
- **Database**: Supabase (configured)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project-bolt-sb1-5cuosbpz/project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔐 Demo Credentials

The application includes demo users for testing different roles:

### Super Admin
- **Email**: admin@cityportal.gov
- **Password**: password
- **Access**: Full system access

### Department Head
- **Email**: john@roads.gov
- **Password**: password
- **Department**: Roads & Infrastructure

### Staff
- **Email**: mike@water.gov
- **Password**: password
- **Department**: Water Department

## 🎯 Core Features Implementation

### ✅ Authentication & Roles
- [x] Multi-role login system
- [x] Role-based access control
- [x] Protected routes
- [x] User context management

### ✅ Dashboard
- [x] Real-time statistics
- [x] Interactive map view
- [x] Recent issues with filters
- [x] SLA breach tracking

### ✅ Issue Management
- [x] Issue assignment/reassignment
- [x] Status updates
- [x] Priority management
- [x] Image viewing with modal
- [x] Advanced filtering

### ✅ Department Mapping
- [x] Department configuration
- [x] SLA settings per department
- [x] CRUD operations
- [x] Category-location mapping

### ✅ Notifications
- [x] In-app notification system
- [x] Browser notifications
- [x] Real-time updates
- [x] Notification history

### ✅ Analytics & Reports
- [x] Department performance metrics
- [x] Issue distribution charts
- [x] SLA compliance tracking
- [x] Resolution time analytics

## 🏗️ Project Structure

```
src/
├── components/
│   ├── Auth/
│   │   ├── LoginPage.tsx
│   │   └── ProtectedRoute.tsx
│   ├── Dashboard/
│   │   └── IssuesMap.tsx
│   ├── Layout/
│   │   └── Sidebar.tsx
│   ├── Pages/
│   │   ├── Analytics.tsx
│   │   ├── Dashboard.tsx
│   │   ├── DepartmentMapping.tsx
│   │   └── IssueManagement.tsx
│   └── UI/
│       ├── DataTable.tsx
│       ├── ImageModal.tsx
│       ├── IssueModal.tsx
│       ├── NotificationPanel.tsx
│       └── StatsCard.tsx
├── contexts/
│   ├── AuthContext.tsx
│   └── NotificationContext.tsx
├── data/
│   └── mockData.ts
├── hooks/
│   └── useSLATracking.ts
├── types/
│   └── index.ts
└── App.tsx
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Tailwind CSS
The project uses Tailwind CSS for styling. Configuration is in `tailwind.config.js`.

## 🚀 Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Preview the build**
   ```bash
   npm run preview
   ```

3. **Deploy to your preferred platform**
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Any static hosting service

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

## 🔒 Security Features

- Role-based access control
- Protected routes
- Input validation
- XSS protection
- CSRF protection (when integrated with backend)

## 🧪 Testing

To run the linter:
```bash
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions, please contact the development team or create an issue in the repository.

---

**Built with ❤️ for better civic issue management**