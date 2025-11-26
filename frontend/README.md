# 🚀 TravelVerse Frontend - Complete React Application

**A stunning, modern travel booking platform built with React, TypeScript, and Tailwind CSS**

---

## ✨ Features

### 🎨 Beautiful UI/UX
- **Glassmorphism Design** - Frosted glass effects throughout
- **Gradient Animations** - Smooth, eye-catching transitions
- **Dark Mode Ready** - Automatic theme support
- **Fully Responsive** - Mobile-first design
- **Micro-interactions** - Delightful hover effects and animations

### 🔐 Authentication
- **JWT-based Auth** - Secure token management
- **Multi-step Registration** - Beautiful onboarding flow
- **Protected Routes** - Automatic redirect for unauthorized access
- **Session Persistence** - LocalStorage-based state

### ✈️ Booking Features
- **Flight Search** - Dynamic filters, sorting, real-time availability
- **Hotel Search** - Amenity filters, star ratings, price ranges
- **Car Rental** - Type filters, transmission options
- **Secure Checkout** - Card validation (Luhn algorithm), multiple payment methods
- **Booking Management** - View history, cancel with refund calculation
- **Instant Confirmation** - Beautiful success pages

### 🛠️ Technical Highlights
- **React 19** with TypeScript
- **Vite** for blazing-fast builds
- **Tailwind CSS** with custom theme
- **Framer Motion** for animations
- **React Query** for server state
- **Zustand** for global state
- **React Hook Form** for forms
- **Axios** with interceptors
- **15+ Validators** (SSN, ZIP, Credit Card, etc.)
- **10+ Formatters** (Currency, Date, Time, etc.)

---

## 📁 Project Structure

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── common/           # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Loading.tsx
│   │   │   └── DatePicker.tsx
│   │   └── layout/           # Layout components
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── Layout.tsx
│   ├── pages/               # Route pages
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── FlightSearch.tsx
│   │   ├── HotelSearch.tsx
│   │   ├── CarSearch.tsx
│   │   ├── BookingCheckout.tsx
│   │   ├── BookingConfirmation.tsx
│   │   ├── MyBookings.tsx
│   │   └── Profile.tsx
│   ├── services/            # API services
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── flight.service.ts
│   │   ├── hotel.service.ts
│   │   ├── car.service.ts
│   │   ├── booking.service.ts
│   │   └── billing.service.ts
│   ├── store/               # State management
│   │   └── authStore.ts
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   ├── utils/               # Utilities
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── constants.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Backend API running on `http://localhost:4000`

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Access the app at:** `http://localhost:3000`

---

## 🎯 Available Pages

### Public Routes
- `/` - Home (Hero search with tabs)
- `/login` - Login page
- `/register` - Multi-step registration
- `/flights` - Flight search results
- `/hotels` - Hotel search results
- `/cars` - Car rental results

### Protected Routes (Requires Authentication)
- `/booking/checkout` - Secure checkout with payment
- `/booking/confirmation/:id` - Booking confirmation
- `/my-bookings` - Booking history
- `/profile` - User profile editing

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:4000
```

### Backend API

The frontend expects the backend API to be running on `http://localhost:4000`.

Make sure these endpoints are available:
- `POST /api/users/register`
- `POST /api/users/login`
- `GET /api/users/me`
- `GET /api/listings/flights/search`
- `GET /api/listings/hotels/search`
- `GET /api/listings/cars/search`
- `POST /api/bookings/create`
- `GET /api/bookings/user/:userId`
- `POST /api/bookings/:id/cancel`

---

## 🎨 Design System

### Colors

```css
Primary:   Blue (#3b82f6) → Purple (#d946ef)
Accent:    Pink (#ec4899) → Orange (#f97316)
Success:   Green (#10b981)
Warning:   Yellow (#f59e0b)
Danger:    Red (#ef4444)
```

### Components

All components follow a consistent design language:

- **Glassmorphism**: `glass` and `glass-strong` classes
- **Buttons**: Primary, Secondary, Outline, Danger variants
- **Cards**: Interactive and static with hover effects
- **Inputs**: With labels, icons, and error states
- **Loading**: Spinner with plane animation

### Animations

- `float` - Gentle floating motion (6s infinite)
- `slide-up` - Slides in from bottom
- `fade-in` - Fades in smoothly
- `scale-in` - Scales from 0.9 to 1
- `shimmer` - Loading shimmer effect

---

## 🧪 Testing the App

### 1. Register a New User

- Navigate to `/register`
- Complete all 3 steps:
  1. Account details (SSN, name, email, password)
  2. Personal info (address, city, state, ZIP)
  3. Review and confirm
- Validation ensures all formats are correct

### 2. Login

- Use the email and password from registration
- JWT token is stored in localStorage
- Automatic redirect to home page

### 3. Search for Flights

- Go to home page
- Select "Flights" tab
- Choose origin (e.g., SFO) and destination (e.g., JFK)
- Select departure date and number of passengers
- Click "Search Flights"

### 4. Book a Flight

- View search results
- Click "Book Now" on any flight
- Complete payment form:
  - Card number: 4532123456789010 (test card - passes Luhn)
  - CVV: 123
  - Expiry: 12/25
- Click "Complete Booking"
- See confirmation page with booking reference

### 5. View Bookings

- Go to "My Bookings" from header
- See all your bookings
- Filter by: All, Current, Future, Past
- Cancel bookings with refund calculation

### 6. Edit Profile

- Click your name in header
- Select "My Profile"
- Update your information
- Click "Save Changes"

---

## 📊 Validation Rules

All inputs are validated client-side AND server-side:

| Field | Format | Example |
|-------|--------|---------|
| **SSN** | XXX-XX-XXXX | 123-45-6789 |
| **Email** | Standard | user@example.com |
| **ZIP** | ##### or #####-#### | 94102 or 94102-1234 |
| **State** | 2-letter US code | CA, NY, TX |
| **Airport** | 3-letter IATA | SFO, JFK, LAX |
| **Password** | 8+ chars, complex | SecurePass123 |
| **Card** | 13-19 digits, Luhn | 4532-1234-5678-9010 |
| **CVV** | 3-4 digits | 123 |
| **Expiry** | MM/YY | 12/25 |

---

## 🔒 Security Features

- **JWT Authentication** - Token-based auth
- **Protected Routes** - Automatic redirect
- **Password Hashing** - Never stored plain text
- **Input Sanitization** - XSS prevention
- **Card Validation** - Luhn algorithm
- **HTTPS Ready** - Secure communication
- **Token Expiry** - Automatic logout on 401

---

## 🚢 Build for Production

```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview
```

The build output will be in the `dist/` directory.

---

## 📝 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Type check with TypeScript
```

---

## 🎯 Key Features Implemented

### Home Page
- ✅ Hero section with animated background
- ✅ Tab switcher (Flights, Hotels, Cars)
- ✅ Dynamic search forms
- ✅ Features section

### Authentication
- ✅ Login with JWT
- ✅ Multi-step registration (3 steps)
- ✅ Form validation
- ✅ Password strength indicator
- ✅ Auto-login after registration

### Search & Results
- ✅ Dynamic filters and sorting
- ✅ Real-time search results
- ✅ Availability checking
- ✅ Price range filters
- ✅ Star rating filters
- ✅ Amenity filters

### Booking Flow
- ✅ Secure checkout
- ✅ Payment form with validation
- ✅ Multiple payment methods
- ✅ Booking summary
- ✅ Price calculation (subtotal + tax)
- ✅ Confirmation page
- ✅ Booking reference generation

### User Features
- ✅ Booking history
- ✅ Cancel bookings with refund
- ✅ Profile editing
- ✅ Address management

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Backend Connection Failed
- Ensure backend is running on `http://localhost:4000`
- Check CORS configuration in backend
- Verify API endpoints match

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Technologies Used

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Routing
- **React Query** - Server state
- **Zustand** - Global state
- **React Hook Form** - Forms
- **Axios** - HTTP client
- **date-fns** - Date formatting
- **React Toastify** - Notifications
- **Lucide React** - Icons

---

## 🎨 Design Credits

- **Color Palette**: Custom blue-purple gradient theme
- **Typography**: Inter (body) + Poppins (display)
- **Animations**: Framer Motion + custom CSS
- **Icons**: Lucide React
- **Inspiration**: Modern travel platforms with a twist

---

## 📄 License

This project is part of the Kayak Simulation academic project.

---

## 🙏 Acknowledgments

- Backend API team for robust endpoints
- Design inspiration from modern travel platforms
- Open source community for amazing tools

---

**Built with ❤️ for travelers worldwide**

**Ready to explore the world? Start booking at [http://localhost:3000](http://localhost:3000)** ✈️🏨🚗

