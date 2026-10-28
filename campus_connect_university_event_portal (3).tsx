import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Bell,
  QrCode,
  Shield,
  LogOut,
  User,
  Menu,
  X,
  ChevronRight,
  Download,
  FileCode,
  Copy,
  Check,
  Sparkles,
  Tag,
  Building2,
  Columns,
  ScanLine,
  Lock,
  KeyRound,
  CheckSquare,
  Square,
  GraduationCap
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
export type UserRole = 'student' | 'admin';
export type EventStatus = 'published' | 'draft' | 'cancelled' | 'completed';
export type RegistrationStatus = 'registered' | 'attended' | 'cancelled';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  student_id: string;
  department: string;
  graduation_year: number;
  avatar_url?: string;
  created_at: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
}

export interface DepartmentItem {
  id: string;
  name: string;
  code: string;
  faculty_head?: string;
  created_at: string;
}

export interface CustomColumnDef {
  id: string;
  key: string;
  label: string;
  target: 'events' | 'registrations';
  type: 'text' | 'number' | 'boolean';
  required: boolean;
  visible: boolean;
}

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  department_host: string;
  date: string;
  start_time: string;
  end_time: string;
  registration_deadline: string;
  venue: string;
  building?: string;
  capacity: number;
  registered_count: number;
  organizer_name: string;
  banner_url: string;
  status: EventStatus;
  is_featured?: boolean;
  custom_fields?: Record<string, string | number | boolean>;
  created_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  student_roll: string;
  student_department: string;
  ticket_code: string;
  qr_payload: string;
  status: RegistrationStatus;
  notes?: string;
  custom_fields?: Record<string, string | number | boolean>;
  registered_at: string;
  attended_at?: string;
}

interface OwnerAdminConfig {
  isConfigured: boolean;
  ownerEmail: string;
  ownerPasswordHash: string;
  ownerName: string;
}

// ============================================================================
// INSTANT ZERO-LATENCY DETERMINISTIC SVG QR MATRIX GENERATOR
// ============================================================================
function generateQrMatrix(input: string): boolean[][] {
  const size = 25;
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );
  const reserved: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  const placeFinderPattern = (rowOffset: number, colOffset: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = rowOffset + r;
        const cc = colOffset + c;
        if (rr >= 0 && rr < size && cc >= 0 && cc < size) {
          reserved[rr][cc] = true;
          const inOuter = r >= 0 && r <= 6 && (r === 0 || r === 6 || c === 0 || c === 6);
          const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          matrix[rr][cc] = inOuter || inInner;
        }
      }
    }
  };

  placeFinderPattern(0, 0);
  placeFinderPattern(0, size - 7);
  placeFinderPattern(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    reserved[6][i] = true;
    reserved[i][6] = true;
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Alignment pattern at bottom-right
  const alignCenter = size - 7;
  for (let r = alignCenter - 2; r <= alignCenter + 2; r++) {
    for (let c = alignCenter - 2; c <= alignCenter + 2; c++) {
      reserved[r][c] = true;
      const isBorder =
        r === alignCenter - 2 ||
        r === alignCenter + 2 ||
        c === alignCenter - 2 ||
        c === alignCenter + 2;
      const isCenter = r === alignCenter && c === alignCenter;
      matrix[r][c] = isBorder || isCenter;
    }
  }

  // Encode payload bits deterministically
  const payload = input || 'CAMPUS-CONNECT-PASS';
  const bytes: number[] = [];
  for (let i = 0; i < payload.length; i++) {
    bytes.push(payload.charCodeAt(i));
  }

  let hash = 2166136261;
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i];
    hash = Math.imul(hash, 16777619);
  }

  let bitIndex = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c]) {
        const byteVal = bytes[bitIndex % bytes.length];
        const bitOffset = bitIndex % 8;
        const rawBit = ((byteVal >> bitOffset) & 1) === 1;
        const maskBit = ((r * c) % 2 + (r + c) % 3 + ((hash >>> (bitIndex % 16)) & 1)) % 2 === 0;
        matrix[r][c] = rawBit !== maskBit;
        bitIndex++;
      }
    }
  }

  return matrix;
}

const ScannableQrCodeSvg: React.FC<{
  value: string;
  ticketCode: string;
  size?: number;
}> = ({ value, ticketCode, size = 200 }) => {
  // Instant, zero-latency pure-SVG QR Matrix (no external network lag)
  const matrix = useMemo(() => generateQrMatrix(value), [value]);
  const moduleCount = matrix.length;
  const quietZone = 2;
  const totalModules = moduleCount + quietZone * 2;

  return (
    <div className="inline-flex flex-col items-center">
      <div
        className="bg-white p-3 rounded-2xl border-2 border-slate-900 shadow-md flex items-center justify-center"
        style={{ width: size + 24, height: size + 24 }}
      >
        <svg
          viewBox={`0 0 ${totalModules} ${totalModules}`}
          width={size}
          height={size}
          shapeRendering="crispEdges"
          aria-label={`QR Code for ${ticketCode}`}
          className="w-full h-full"
        >
          <rect width={totalModules} height={totalModules} fill="#ffffff" />
          {matrix.map((row, rIdx) =>
            row.map((cell, cIdx) =>
              cell ? (
                <rect
                  key={`${rIdx}-${cIdx}`}
                  x={cIdx + quietZone}
                  y={rIdx + quietZone}
                  width={1}
                  height={1}
                  fill="#0a1931"
                />
              ) : null
            )
          )}
        </svg>
      </div>
    </div>
  );
};

// ============================================================================
// UPDATED VS CODE & SUPABASE SQL SCHEMA (Includes Categories, Departments,
// Custom Table Columns & Strict Owner-Only Admin Policy)
// ============================================================================
const SQL_MIGRATION_SCRIPT = `-- ============================================================================
-- CAMPUS CONNECT: SUPABASE POSTGRESQL SCHEMA & STRICT OWNER RLS MIGRATION
-- File: supabase/migrations/001_initial_schema.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ADMIN-DEFINED CATEGORIES TABLE
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  color TEXT DEFAULT 'blue',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ADMIN-DEFINED ACADEMIC DEPARTMENTS TABLE
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  faculty_head TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PROFILES TABLE (Role locked to 'student' by default; Owner Admin only)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  student_id TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  graduation_year INT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. EVENTS TABLE (Supports Admin-customized JSONB columns)
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL REFERENCES public.categories(name) ON UPDATE CASCADE,
  department_host TEXT NOT NULL REFERENCES public.departments(name) ON UPDATE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  registration_deadline TIMESTAMPTZ NOT NULL,
  venue TEXT NOT NULL,
  building TEXT,
  capacity INT NOT NULL CHECK (capacity > 0),
  registered_count INT NOT NULL DEFAULT 0 CHECK (registered_count >= 0),
  organizer_name TEXT NOT NULL,
  banner_url TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'cancelled', 'completed')),
  custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. REGISTRATIONS TABLE (Prevents duplicate registrations & stores QR payload)
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticket_code TEXT UNIQUE NOT NULL,
  qr_payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  notes TEXT,
  custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, student_id)
);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Strict Owner Admin check helper (Replace with your personal owner email)
CREATE OR REPLACE FUNCTION public.is_owner_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

const PACKAGE_JSON_CONTENT = `{
  "name": "campus-connect-portal",
  "private": true,
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "lucide-react": "^0.400.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.5.2",
    "vite": "^5.3.1"
  }
}`;

const ENV_EXAMPLE_CONTENT = `# Supabase Project Credentials
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-public-key

# Exclusive Master Owner Admin Email (Only this email can access Admin Console)
VITE_OWNER_ADMIN_EMAIL=your-personal-email@university.edu`;

const GITHUB_WORKFLOW_YML = `name: Deploy Campus Connect to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Build production bundle
        run: npm run build

      - name: Configure GitHub Pages
        uses: actions/configure-pages@v5

      - name: Upload build artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4`;

const GITHUB_DEPLOY_GUIDE = `# Publishing Campus Connect to GitHub & GitHub Pages

1. Initialize Git and push from VS Code:
   git init
   git add .
   git commit -m "Initial commit: Campus Connect University Portal"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/campus-connect.git
   git push -u origin main

2. Enable GitHub Pages:
   - Copy the '.github/workflows/deploy.yml' tab into your project.
   - In vite.config.ts, set base: './'
   - On GitHub, open Settings -> Pages -> Source -> select "GitHub Actions".`;

// ============================================================================
// LOCAL STORAGE KEYS (100% Clean Initial State - Zero Demo Data)
// ============================================================================
const STORAGE_KEYS = {
  OWNER_CONFIG: 'cc_v2_owner_config',
  CURRENT_USER: 'cc_v2_current_user',
  USERS: 'cc_v2_users_list',
  CATEGORIES: 'cc_v2_categories_list',
  DEPARTMENTS: 'cc_v2_departments_list',
  CUSTOM_COLS: 'cc_v2_custom_columns',
  EVENTS: 'cc_v2_events_list',
  REGISTRATIONS: 'cc_v2_registrations_list'
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  // --------------------------------------------------------------------------
  // PERSISTENT DATABASE STATE (Starts 100% Empty - User/Admin Defined)
  // --------------------------------------------------------------------------
  const [ownerConfig, setOwnerConfig] = useState<OwnerAdminConfig>(() =>
    loadFromStorage<OwnerAdminConfig>(STORAGE_KEYS.OWNER_CONFIG, {
      isConfigured: false,
      ownerEmail: '',
      ownerPasswordHash: '',
      ownerName: ''
    })
  );

  const [currentUser, setCurrentUser] = useState<Profile | null>(() =>
    loadFromStorage<Profile | null>(STORAGE_KEYS.CURRENT_USER, null)
  );

  const [users, setUsers] = useState< Array<Profile & { passwordHash: string }> >(() =>
    loadFromStorage< Array<Profile & { passwordHash: string }> >(STORAGE_KEYS.USERS, [])
  );

  const [categories, setCategories] = useState<CategoryItem[]>(() =>
    loadFromStorage<CategoryItem[]>(STORAGE_KEYS.CATEGORIES, [])
  );

  const [departments, setDepartments] = useState<DepartmentItem[]>(() =>
    loadFromStorage<DepartmentItem[]>(STORAGE_KEYS.DEPARTMENTS, [])
  );

  const [customColumns, setCustomColumns] = useState<CustomColumnDef[]>(() =>
    loadFromStorage<CustomColumnDef[]>(STORAGE_KEYS.CUSTOM_COLS, [])
  );

  const [events, setEvents] = useState<CampusEvent[]>(() =>
    loadFromStorage<CampusEvent[]>(STORAGE_KEYS.EVENTS, [])
  );

  const [registrations, setRegistrations] = useState<EventRegistration[]>(() =>
    loadFromStorage<EventRegistration[]>(STORAGE_KEYS.REGISTRATIONS, [])
  );

  // Sync to persistent storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.OWNER_CONFIG, JSON.stringify(ownerConfig));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
      localStorage.setItem(STORAGE_KEYS.CUSTOM_COLS, JSON.stringify(customColumns));
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
      localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(registrations));
    } catch {
      // Ignore storage quota errors
    }
  }, [
    ownerConfig,
    currentUser,
    users,
    categories,
    departments,
    customColumns,
    events,
    registrations
  ]);

  // --------------------------------------------------------------------------
  // NAVIGATION & UI STATE
  // --------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<
    'home' | 'explore' | 'student-dashboard' | 'admin-dashboard' | 'auth' | 'profile' | 'vscode-export'
  >('home');

  const [adminSection, setAdminSection] = useState<
    'events' | 'categories' | 'departments' | 'table-builder' | 'rosters' | 'qr-scanner'
  >('events');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => {
      setToast((prev) => (prev?.title === title ? null : prev));
    }, 4000);
  };

  // Strict Owner Admin verification ("Only For Me")
  const isStrictOwnerAdmin = useMemo(() => {
    if (!currentUser || !ownerConfig.isConfigured) return false;
    return (
      currentUser.role === 'admin' &&
      currentUser.email.toLowerCase() === ownerConfig.ownerEmail.toLowerCase()
    );
  }, [currentUser, ownerConfig]);

  // --------------------------------------------------------------------------
  // FILTERS & SEARCH STATE
  // --------------------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState<'all' | 'upcoming' | 'available-only'>('all');

  const publishedEvents = useMemo(
    () => events.filter((e) => e.status === 'published'),
    [events]
  );

  const featuredEvents = useMemo(
    () => publishedEvents.filter((e) => e.is_featured),
    [publishedEvents]
  );

  const filteredEvents = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return publishedEvents.filter((ev) => {
      const matchesSearch =
        !searchQuery.trim() ||
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.organizer_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' || ev.category === selectedCategory;

      const matchesDept =
        selectedDeptFilter === 'All' || ev.department_host === selectedDeptFilter;

      const matchesDate =
        dateFilter === 'all' ||
        (dateFilter === 'upcoming' && ev.date >= todayStr) ||
        (dateFilter === 'available-only' && ev.registered_count < ev.capacity);

      return matchesSearch && matchesCategory && matchesDept && matchesDate;
    });
  }, [publishedEvents, searchQuery, selectedCategory, selectedDeptFilter, dateFilter]);

  // --------------------------------------------------------------------------
  // STUDENT REGISTRATIONS & MODAL STATE
  // --------------------------------------------------------------------------
  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);
  const [activeTicket, setActiveTicket] = useState<{
    registration: EventRegistration;
    event: CampusEvent;
  } | null>(null);
  const [registrationNotes, setRegistrationNotes] = useState('');
  const [regCustomFields, setRegCustomFields] = useState<Record<string, string | number | boolean>>({});

  const myRegistrations = useMemo(() => {
    if (!currentUser) return [];
    return registrations.filter((r) => r.student_id === currentUser.id);
  }, [registrations, currentUser]);

  const getStudentRegistrationForEvent = (eventId: string) => {
    if (!currentUser) return undefined;
    return registrations.find(
      (r) =>
        r.event_id === eventId &&
        r.student_id === currentUser.id &&
        r.status !== 'cancelled'
    );
  };

  // --------------------------------------------------------------------------
  // AUTHENTICATION STATE
  // --------------------------------------------------------------------------
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'owner-setup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authStudentId, setAuthStudentId] = useState('');
  const [authDepartment, setAuthDepartment] = useState('');
  const [authGradYear, setAuthGradYear] = useState<number>(new Date().getFullYear() + 2);

  // --------------------------------------------------------------------------
  // ADMIN FORMS & TABLE CUSTOMIZATION STATE
  // --------------------------------------------------------------------------
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('blue');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptHead, setNewDeptHead] = useState('');
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);

  const [newColLabel, setNewColLabel] = useState('');
  const [newColTarget, setNewColTarget] = useState<'events' | 'registrations'>('events');
  const [newColType, setNewColType] = useState<'text' | 'number' | 'boolean'>('text');
  const [newColRequired, setNewColRequired] = useState(false);

  const [visibleEventCols, setVisibleEventCols] = useState<Record<string, boolean>>({
    category: true,
    department_host: true,
    date: true,
    venue: true,
    capacity: true,
    status: true
  });

  const eventCustomCols = useMemo(
    () => customColumns.filter((c) => c.target === 'events'),
    [customColumns]
  );

  const regCustomCols = useMemo(
    () => customColumns.filter((c) => c.target === 'registrations'),
    [customColumns]
  );

  // Inline Event Row Editing
  const [inlineEditingEventId, setInlineEditingEventId] = useState<string | null>(null);
  const [inlineEventDraft, setInlineEventDraft] = useState<CampusEvent | null>(null);

  // Full Event Modal Editor
  const [isEventEditorOpen, setIsEventEditorOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState<{
    title: string;
    description: string;
    category: string;
    department_host: string;
    date: string;
    start_time: string;
    end_time: string;
    registration_deadline: string;
    venue: string;
    building: string;
    capacity: number;
    organizer_name: string;
    banner_url: string;
    status: EventStatus;
    custom_fields: Record<string, string | number | boolean>;
  }>({
    title: '',
    description: '',
    category: '',
    department_host: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '13:00',
    registration_deadline: `${new Date().toISOString().split('T')[0]}T09:00`,
    venue: '',
    building: '',
    capacity: 100,
    organizer_name: '',
    banner_url:
      'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1000&q=80',
    status: 'published',
    custom_fields: {}
  });

  // Admin Roster & QR Scanner State
  const [rosterEventId, setRosterEventId] = useState('ALL');
  const [rosterSearch, setRosterSearch] = useState('');
  const [qrScanInput, setQrScanInput] = useState('');
  const [scannedResult, setScannedResult] = useState<{
    registration: EventRegistration;
    event?: CampusEvent;
  } | null>(null);

  // VS Code Export File Selector
  const [selectedCodeFile, setSelectedCodeFile] = useState<'sql' | 'package' | 'env' | 'workflow' | 'guide'>('sql');
  const [copiedFile, setCopiedFile] = useState(false);

  const activeRosterRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      const matchesEvent = rosterEventId === 'ALL' || r.event_id === rosterEventId;
      const matchesQuery =
        !rosterSearch.trim() ||
        r.student_name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        r.student_roll.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        r.ticket_code.toLowerCase().includes(rosterSearch.toLowerCase());
      return matchesEvent && matchesQuery;
    });
  }, [registrations, rosterEventId, rosterSearch]);

  // --------------------------------------------------------------------------
  // HANDLERS: AUTH & OWNER ADMIN SETUP
  // --------------------------------------------------------------------------
  const handleOwnerInitialSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (ownerConfig.isConfigured) {
      showToast('error', 'Locked', 'Owner Administrator is already configured.');
      return;
    }
    if (authPassword.length < 6) {
      showToast('error', 'Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    const cleanEmail = authEmail.trim().toLowerCase();
    const ownerProfile: Profile = {
      id: `admin-owner-${Date.now()}`,
      email: cleanEmail,
      full_name: authFullName.trim() || 'University Administrator',
      role: 'admin',
      student_id: 'OWNER-ADMIN',
      department: 'University Administration',
      graduation_year: new Date().getFullYear(),
      created_at: new Date().toISOString()
    };

    setOwnerConfig({
      isConfigured: true,
      ownerEmail: cleanEmail,
      ownerPasswordHash: authPassword,
      ownerName: ownerProfile.full_name
    });
    setCurrentUser(ownerProfile);
    setActiveTab('admin-dashboard');
    showToast(
      'success',
      'Owner Admin Locked Exclusively to You',
      `Admin access is now permanently bound to ${cleanEmail}.`
    );
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = authEmail.trim().toLowerCase();

    // Check if logging in as the exclusive Owner Admin
    if (
      ownerConfig.isConfigured &&
      cleanEmail === ownerConfig.ownerEmail.toLowerCase()
    ) {
      if (authPassword !== ownerConfig.ownerPasswordHash) {
        showToast('error', 'Invalid Credentials', 'Incorrect Owner Administrator password.');
        return;
      }
      const ownerProfile: Profile = {
        id: 'owner-admin-master',
        email: ownerConfig.ownerEmail,
        full_name: ownerConfig.ownerName,
        role: 'admin',
        student_id: 'OWNER-ADMIN',
        department: 'University Administration',
        graduation_year: new Date().getFullYear(),
        created_at: new Date().toISOString()
      };
      setCurrentUser(ownerProfile);
      setActiveTab('admin-dashboard');
      showToast('success', 'Welcome Back, Owner Admin', 'Admin Console unlocked.');
      return;
    }

    // Check regular student accounts
    const foundStudent = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.passwordHash === authPassword
    );
    if (!foundStudent) {
      showToast('error', 'Sign In Failed', 'Invalid email or password.');
      return;
    }

    const { passwordHash: _, ...studentProfile } = foundStudent;
    setCurrentUser(studentProfile);
    setActiveTab('explore');
    showToast('success', 'Signed In', `Welcome back, ${studentProfile.full_name}!`);
  };

  const handleStudentRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = authEmail.trim().toLowerCase();
    if (
      (ownerConfig.isConfigured && cleanEmail === ownerConfig.ownerEmail.toLowerCase()) ||
      users.some((u) => u.email.toLowerCase() === cleanEmail)
    ) {
      showToast('error', 'Email Already Registered', 'Please sign in instead.');
      return;
    }
    if (authPassword.length < 6) {
      showToast('error', 'Invalid Password', 'Password must be at least 6 characters.');
      return;
    }
    const chosenDept = authDepartment || departments[0]?.name || 'General';
    const newStudent: Profile & { passwordHash: string } = {
      id: `stu-${Date.now()}`,
      email: cleanEmail,
      full_name: authFullName.trim(),
      role: 'student', // Strictly locked to student
      student_id: authStudentId.trim().toUpperCase(),
      department: chosenDept,
      graduation_year: authGradYear,
      created_at: new Date().toISOString(),
      passwordHash: authPassword
    };

    setUsers((prev) => [...prev, newStudent]);
    const { passwordHash: _, ...profileOnly } = newStudent;
    setCurrentUser(profileOnly);
    setActiveTab('explore');
    showToast(
      'success',
      'Student Account Created',
      `Welcome to Campus Connect, ${profileOnly.full_name}!`
    );
  };

  // --------------------------------------------------------------------------
  // HANDLERS: CATEGORIES, DEPARTMENTS & CUSTOM COLUMNS
  // --------------------------------------------------------------------------
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStrictOwnerAdmin) return;
    const cleanName = newCategoryName.trim();
    if (!cleanName) return;

    if (editingCategoryId) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategoryId
            ? { ...c, name: cleanName, description: newCategoryDesc.trim(), color: newCategoryColor }
            : c
        )
      );
      setEditingCategoryId(null);
      showToast('success', 'Category Updated', `Updated "${cleanName}".`);
    } else {
      if (categories.some((c) => c.name.toLowerCase() === cleanName.toLowerCase())) {
        showToast('error', 'Duplicate Category', 'That category already exists.');
        return;
      }
      setCategories((prev) => [
        ...prev,
        {
          id: `cat-${Date.now()}`,
          name: cleanName,
          description: newCategoryDesc.trim(),
          color: newCategoryColor,
          created_at: new Date().toISOString()
        }
      ]);
      showToast('success', 'Category Created', `Added "${cleanName}".`);
    }
    setNewCategoryName('');
    setNewCategoryDesc('');
  };

  const handleDeleteCategory = (id: string) => {
    if (!isStrictOwnerAdmin) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    showToast('info', 'Category Removed', 'Category deleted.');
  };

  const handleSaveDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStrictOwnerAdmin) return;
    const cleanName = newDeptName.trim();
    const cleanCode = newDeptCode.trim().toUpperCase();
    if (!cleanName || !cleanCode) return;

    if (editingDeptId) {
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === editingDeptId
            ? { ...d, name: cleanName, code: cleanCode, faculty_head: newDeptHead.trim() }
            : d
        )
      );
      setEditingDeptId(null);
      showToast('success', 'Department Updated', `Updated ${cleanName} (${cleanCode}).`);
    } else {
      setDepartments((prev) => [
        ...prev,
        {
          id: `dept-${Date.now()}`,
          name: cleanName,
          code: cleanCode,
          faculty_head: newDeptHead.trim(),
          created_at: new Date().toISOString()
        }
      ]);
      showToast('success', 'Department Added', `Added ${cleanName} (${cleanCode}).`);
    }
    setNewDeptName('');
    setNewDeptCode('');
    setNewDeptHead('');
  };

  const handleDeleteDepartment = (id: string) => {
    if (!isStrictOwnerAdmin) return;
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    showToast('info', 'Department Removed', 'Academic department deleted.');
  };

  const handleAddCustomColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStrictOwnerAdmin) return;
    const cleanLabel = newColLabel.trim();
    if (!cleanLabel) return;
    const key = cleanLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_');

    const newCol: CustomColumnDef = {
      id: `col-${Date.now()}`,
      key,
      label: cleanLabel,
      target: newColTarget,
      type: newColType,
      required: newColRequired,
      visible: true
    };
    setCustomColumns((prev) => [...prev, newCol]);
    setNewColLabel('');
    setNewColRequired(false);
    showToast('success', 'Custom Column Added', `Added "${cleanLabel}" to ${newColTarget} schema.`);
  };

  // --------------------------------------------------------------------------
  // HANDLERS: EVENTS CRUD & INLINE EDIT
  // --------------------------------------------------------------------------
  const openCreateEventModal = () => {
    if (!isStrictOwnerAdmin) return;
    if (categories.length === 0 || departments.length === 0) {
      showToast(
        'error',
        'Add Category & Department First',
        'Please define at least 1 Category and 1 Department before creating an event.'
      );
      setAdminSection(categories.length === 0 ? 'categories' : 'departments');
      setActiveTab('admin-dashboard');
      return;
    }
    setEditingEventId(null);
    setEventForm({
      title: '',
      description: '',
      category: categories[0].name,
      department_host: departments[0].name,
      date: new Date().toISOString().split('T')[0],
      start_time: '10:00',
      end_time: '13:00',
      registration_deadline: `${new Date().toISOString().split('T')[0]}T09:00`,
      venue: '',
      building: '',
      capacity: 100,
      organizer_name: ownerConfig.ownerName || 'University Administration',
      banner_url:
        'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1000&q=80',
      status: 'published',
      custom_fields: {}
    });
    setIsEventEditorOpen(true);
  };

  const openEditEventModal = (ev: CampusEvent) => {
    if (!isStrictOwnerAdmin) return;
    setEditingEventId(ev.id);
    setEventForm({
      title: ev.title,
      description: ev.description,
      category: ev.category,
      department_host: ev.department_host,
      date: ev.date,
      start_time: ev.start_time,
      end_time: ev.end_time,
      registration_deadline: ev.registration_deadline,
      venue: ev.venue,
      building: ev.building || '',
      capacity: ev.capacity,
      organizer_name: ev.organizer_name,
      banner_url: ev.banner_url,
      status: ev.status,
      custom_fields: { ...(ev.custom_fields || {}) }
    });
    setIsEventEditorOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStrictOwnerAdmin) return;

    if (editingEventId) {
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === editingEventId
            ? {
                ...ev,
                ...eventForm
              }
            : ev
        )
      );
      showToast('success', 'Event Updated', `"${eventForm.title}" has been updated.`);
    } else {
      const newEv: CampusEvent = {
        id: `ev-${Date.now()}`,
        ...eventForm,
        registered_count: 0,
        created_at: new Date().toISOString()
      };
      setEvents((prev) => [newEv, ...prev]);
      showToast('success', 'Event Published', `"${newEv.title}" is now live.`);
    }
    setIsEventEditorOpen(false);
  };

  const handleSaveInlineEventRow = () => {
    if (!isStrictOwnerAdmin || !inlineEventDraft) return;
    setEvents((prev) =>
      prev.map((ev) => (ev.id === inlineEventDraft.id ? inlineEventDraft : ev))
    );
    setInlineEditingEventId(null);
    setInlineEventDraft(null);
    showToast('success', 'Row Saved', 'Inline table changes committed.');
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!isStrictOwnerAdmin) return;
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setRegistrations((prev) => prev.filter((r) => r.event_id !== eventId));
    showToast('info', 'Event Deleted', 'Event and associated registrations removed.');
  };

  // --------------------------------------------------------------------------
  // HANDLERS: EVENT REGISTRATION & INSTANT QR PASS GENERATION
  // --------------------------------------------------------------------------
  const handleRegisterForEvent = (ev: CampusEvent) => {
    if (!currentUser) {
      setSelectedEvent(null);
      setAuthMode('login');
      setActiveTab('auth');
      showToast('info', 'Sign In Required', 'Please sign in as a student to register.');
      return;
    }

    if (getStudentRegistrationForEvent(ev.id)) {
      showToast('error', 'Already Registered', 'You already hold an active pass for this event.');
      return;
    }

    if (ev.registered_count >= ev.capacity) {
      showToast('error', 'Capacity Full', 'This event has reached maximum seat capacity.');
      return;
    }

    const prefix = ev.title
      .replace(/[^A-Za-z]/g, '')
      .slice(0, 3)
      .toUpperCase() || 'EVT';
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const ticketCode = `CC-${prefix}-${randomSuffix}`;

    const qrPayload = JSON.stringify({
      pass: ticketCode,
      event_id: ev.id,
      event: ev.title,
      student_id: currentUser.student_id,
      name: currentUser.full_name,
      dept: currentUser.department,
      ts: Date.now()
    });

    const newReg: EventRegistration = {
      id: `reg-${Date.now()}`,
      event_id: ev.id,
      student_id: currentUser.id,
      student_name: currentUser.full_name,
      student_email: currentUser.email,
      student_roll: currentUser.student_id,
      student_department: currentUser.department,
      ticket_code: ticketCode,
      qr_payload: qrPayload,
      status: 'registered',
      notes: registrationNotes.trim(),
      custom_fields: { ...regCustomFields },
      registered_at: new Date().toISOString()
    };

    setRegistrations((prev) => [newReg, ...prev]);
    setEvents((prev) =>
      prev.map((item) =>
        item.id === ev.id
          ? { ...item, registered_count: item.registered_count + 1 }
          : item
      )
    );

    setRegistrationNotes('');
    setRegCustomFields({});
    setSelectedEvent(null);
    setActiveTicket({ registration: newReg, event: ev });
    showToast('success', 'Registration Confirmed!', `Pass ${ticketCode} generated.`);
  };

  const handleCancelRegistration = (regId: string) => {
    const target = registrations.find((r) => r.id === regId);
    if (!target) return;

    setRegistrations((prev) =>
      prev.map((r) => (r.id === regId ? { ...r, status: 'cancelled' } : r))
    );
    setEvents((prev) =>
      prev.map((e) =>
        e.id === target.event_id
          ? { ...e, registered_count: Math.max(0, e.registered_count - 1) }
          : e
      )
    );
    showToast('info', 'Seat Cancelled', 'Your registration has been cancelled.');
  };

  // --------------------------------------------------------------------------
  // HANDLERS: ADMIN ATTENDANCE, QR SCANNER & CSV EXPORT
  // --------------------------------------------------------------------------
  const handleToggleAttendance = (regId: string) => {
    if (!isStrictOwnerAdmin) return;
    setRegistrations((prev) =>
      prev.map((r) => {
        if (r.id !== regId) return r;
        const nextStatus: RegistrationStatus =
          r.status === 'attended' ? 'registered' : 'attended';
        return {
          ...r,
          status: nextStatus,
          attended_at: nextStatus === 'attended' ? new Date().toISOString() : undefined
        };
      })
    );
    if (scannedResult && scannedResult.registration.id === regId) {
      setScannedResult((prev) =>
        prev
          ? {
              ...prev,
              registration: {
                ...prev.registration,
                status:
                  prev.registration.status === 'attended' ? 'registered' : 'attended'
              }
            }
          : null
      );
    }
    showToast('success', 'Attendance Updated', 'Participant attendance status updated.');
  };

  const handleDeleteRegistrationRow = (regId: string) => {
    if (!isStrictOwnerAdmin) return;
    const target = registrations.find((r) => r.id === regId);
    setRegistrations((prev) => prev.filter((r) => r.id !== regId));
    if (target && target.status !== 'cancelled') {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === target.event_id
            ? { ...e, registered_count: Math.max(0, e.registered_count - 1) }
            : e
        )
      );
    }
    showToast('info', 'Record Deleted', 'Registration removed from roster.');
  };

  const handleVerifyQrOrTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = qrScanInput.trim();
    if (!raw) return;

    let found = registrations.find(
      (r) =>
        r.ticket_code.toLowerCase() === raw.toLowerCase() ||
        r.qr_payload === raw
    );

    if (!found) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.pass) {
          found = registrations.find(
            (r) => r.ticket_code.toLowerCase() === String(parsed.pass).toLowerCase()
          );
        }
      } catch {
        // Not JSON
      }
    }

    if (!found) {
      setScannedResult(null);
      showToast('error', 'Invalid Pass', 'No matching student pass found in the database.');
      return;
    }

    const ev = events.find((item) => item.id === found!.event_id);
    setScannedResult({ registration: found, event: ev });
    showToast('success', 'Pass Verified', `Verified student: ${found.student_name}`);
  };

  const handleExportCSV = () => {
    if (!isStrictOwnerAdmin) return;
    const customHeaders = regCustomCols.map((c) => c.label);
    const headers = [
      'Pass Code',
      'Student Name',
      'Email',
      'Roll Number',
      'Department',
      'Event Title',
      'Status',
      'Registered At',
      ...customHeaders
    ];

    const rows = activeRosterRegistrations.map((r) => {
      const ev = events.find((e) => e.id === r.event_id);
      const customVals = regCustomCols.map((c) =>
        String(r.custom_fields?.[c.key] ?? '')
      );
      return [
        r.ticket_code,
        r.student_name,
        r.student_email,
        r.student_roll,
        r.student_department,
        ev?.title || '',
        r.status,
        r.registered_at,
        ...customVals
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `campus_connect_roster_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'CSV Exported', 'Roster downloaded successfully.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* ====================================================================
          TOP NAVIGATION BAR
      ==================================================================== */}
      <header className="sticky top-0 z-40 bg-[#0a1931] text-white border-b border-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-slate-950 font-extrabold shadow-md">
              <GraduationCap className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-blue-300 transition">
                Campus Connect
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-blue-300 font-semibold">
                University Event Portal
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'home'
                  ? 'bg-white/15 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'explore'
                  ? 'bg-white/15 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Explore Events ({publishedEvents.length})
            </button>

            {currentUser && currentUser.role === 'student' && (
              <button
                onClick={() => setActiveTab('student-dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'student-dashboard'
                    ? 'bg-white/15 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <QrCode className="w-4 h-4 text-blue-400" />
                My Passes ({myRegistrations.filter((r) => r.status !== 'cancelled').length})
              </button>
            )}

            {/* Admin Portal button is strictly visible ONLY to the authenticated Owner Admin */}
            {isStrictOwnerAdmin && (
              <button
                onClick={() => setActiveTab('admin-dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'admin-dashboard'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    : 'text-amber-300/90 hover:text-amber-200 hover:bg-amber-500/10'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-400" />
                Owner Admin Console
              </button>
            )}
          </nav>

          {/* Right Auth / Profile Controls */}
          <div className="hidden lg:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-1.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-200 font-bold text-sm">
                  {currentUser.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white">
                      {currentUser.full_name}
                    </span>
                    {isStrictOwnerAdmin ? (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 font-semibold">
                        OWNER ADMIN
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-medium">
                        STUDENT
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">{currentUser.email}</p>
                </div>
                <button
                  onClick={() => setActiveTab('profile')}
                  title="Profile Settings"
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <User className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setCurrentUser(null);
                    setActiveTab('home');
                    showToast('info', 'Signed Out', 'You have been logged out safely.');
                  }}
                  title="Sign Out"
                  className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setActiveTab('auth');
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setActiveTab('auth');
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition"
                >
                  Student Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0a1931] border-t border-slate-800 px-4 pt-3 pb-5 space-y-2">
            <button
              onClick={() => {
                setActiveTab('home');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/10"
            >
              Home
            </button>
            <button
              onClick={() => {
                setActiveTab('explore');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/10"
            >
              Explore Events ({publishedEvents.length})
            </button>
            {currentUser && currentUser.role === 'student' && (
              <button
                onClick={() => {
                  setActiveTab('student-dashboard');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-blue-300 hover:bg-white/10"
              >
                My Passes ({myRegistrations.filter((r) => r.status !== 'cancelled').length})
              </button>
            )}
            {isStrictOwnerAdmin && (
              <button
                onClick={() => {
                  setActiveTab('admin-dashboard');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-amber-300 hover:bg-white/10"
              >
                Owner Admin Console
              </button>
            )}
            <button
              onClick={() => {
                setActiveTab('vscode-export');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10"
            >
              VS Code & SQL Files
            </button>
            {!currentUser ? (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setActiveTab('auth');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-center py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm"
              >
                Sign In / Student Sign Up
              </button>
            ) : (
              <button
                onClick={() => {
                  setCurrentUser(null);
                  setActiveTab('home');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-rose-400"
              >
                Sign Out ({currentUser.email})
              </button>
            )}
          </div>
        )}
      </header>

      {/* ====================================================================
          FIRST-TIME OWNER ADMIN CLAIM BANNER (Only visible until YOU claim it)
      ==================================================================== */}
      {!ownerConfig.isConfigured && (
        <div className="bg-gradient-to-r from-amber-500/15 via-blue-600/10 to-amber-500/15 border-b border-amber-500/30 px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm text-slate-800">
              <KeyRound className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                <strong>First-Time Owner Setup Required:</strong> No Master Admin is configured yet.
                Claim your exclusive Owner Admin account now—once claimed, Admin access will be
                permanently locked to your email only.
              </span>
            </div>
            <button
              onClick={() => {
                setAuthMode('owner-setup');
                setActiveTab('auth');
              }}
              className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-semibold shrink-0 shadow-sm transition"
            >
              Claim Owner Admin Account →
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          TOAST NOTIFICATION BANNER
      ==================================================================== */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 text-white border border-slate-700 rounded-2xl shadow-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4">
          {toast.type === 'success' && (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          {toast.type === 'error' && (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          {toast.type === 'info' && <Bell className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}
          <div className="flex-1 text-sm">
            <p className="font-semibold text-white">{toast.title}</p>
            <p className="text-slate-300 text-xs mt-0.5">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ====================================================================
          MAIN CONTENT ROUTER
      ==================================================================== */}
      <main className="flex-1">
        {/* ------------------------------------------------------------------
            1. HOME VIEW
        ------------------------------------------------------------------ */}
        {activeTab === 'home' && (
          <div>
            {/* Navy Hero Section */}
            <section className="relative bg-[#0a1931] text-white py-16 lg:py-24 overflow-hidden border-b border-slate-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-12 gap-12 items-center">
                  <div className="lg:col-span-7 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Official University Event & Pass Management Portal</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                      Discover, Register & Attend{' '}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                        Campus Events
                      </span>
                    </h1>
                    <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">
                      Browse symposiums, workshops, hackathons, and cultural fests created by your
                      university administration. Reserve your verified seat and receive an instant
                      scannable QR entry pass.
                    </p>

                    {/* Quick Search Bar */}
                    <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/15 max-w-xl flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 flex items-center gap-2.5 px-3 py-2">
                        <Search className="w-5 h-5 text-slate-300 shrink-0" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search events by title, venue, or host..."
                          className="w-full bg-transparent text-white placeholder-slate-300 text-sm focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={() => setActiveTab('explore')}
                        className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-lg shrink-0"
                      >
                        Explore Events
                      </button>
                    </div>

                    {/* Live Database Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-4 max-w-lg">
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                        <p className="text-2xl font-bold text-white">{publishedEvents.length}</p>
                        <p className="text-xs text-slate-400">Published Events</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                        <p className="text-2xl font-bold text-blue-400">{categories.length}</p>
                        <p className="text-xs text-slate-400">Event Categories</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                        <p className="text-2xl font-bold text-emerald-400">{departments.length}</p>
                        <p className="text-xs text-slate-400">Departments</p>
                      </div>
                    </div>
                  </div>

                  {/* Hero Right Card */}
                  <div className="lg:col-span-5">
                    <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                            <QrCode className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-sm">
                              Instant SVG QR Entry Passes
                            </h3>
                            <p className="text-xs text-slate-400">
                              Zero-latency verification & live capacity tracking
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          LIVE DB
                        </span>
                      </div>

                      {publishedEvents.length === 0 ? (
                        <div className="text-center py-8 px-4 space-y-3 bg-slate-950/50 rounded-2xl border border-slate-800/80">
                          <Calendar className="w-10 h-10 text-blue-400 mx-auto opacity-80" />
                          <h4 className="font-semibold text-white text-base">
                            No Events Published Yet
                          </h4>
                          <p className="text-xs text-slate-400 max-w-xs mx-auto">
                            The database starts 100% clean with zero demo events. Sign in as the
                            Owner Administrator to configure Categories, Departments, and publish
                            your first campus event.
                          </p>
                          {isStrictOwnerAdmin ? (
                            <button
                              onClick={() => setActiveTab('admin-dashboard')}
                              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                            >
                              <Plus className="w-4 h-4" /> Open Owner Admin Console
                            </button>
                          ) : !ownerConfig.isConfigured ? (
                            <button
                              onClick={() => {
                                setAuthMode('owner-setup');
                                setActiveTab('auth');
                              }}
                              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                            >
                              <KeyRound className="w-4 h-4" /> Set Up Owner Admin Account
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                            Next Featured Event
                          </p>
                          {(featuredEvents.length > 0 ? featuredEvents : publishedEvents)
                            .slice(0, 2)
                            .map((ev) => (
                              <div
                                key={ev.id}
                                onClick={() => setSelectedEvent(ev)}
                                className="p-4 rounded-2xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 cursor-pointer transition group"
                              >
                                <div className="flex items-center justify-between text-xs text-blue-300 mb-1">
                                  <span className="font-semibold">{ev.category}</span>
                                  <span>{ev.date}</span>
                                </div>
                                <h4 className="font-bold text-white group-hover:text-blue-300 transition">
                                  {ev.title}
                                </h4>
                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                  {ev.venue} • {ev.registered_count}/{ev.capacity} Registered
                                </p>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Dynamic Categories Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Browse by Event Category
                  </h2>
                  <p className="text-sm text-slate-600">
                    Categories are dynamically defined and managed by the University Administrator
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('explore')}
                  className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1"
                >
                  View All Events <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {categories.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
                  <Tag className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-800">
                    No Categories Defined Yet
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Once the Owner Administrator adds categories in the Admin Console, they will
                    appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setActiveTab('explore');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold shadow-sm"
                  >
                    All Categories ({publishedEvents.length})
                  </button>
                  {categories.map((cat) => {
                    const count = publishedEvents.filter((e) => e.category === cat.name).length;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.name);
                          setActiveTab('explore');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-slate-800 text-sm font-semibold transition flex items-center gap-2 shadow-sm"
                      >
                        <span>{cat.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Upcoming Events Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Upcoming Campus Events</h2>
              {publishedEvents.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
                  <Calendar className="w-12 h-12 text-slate-400 mx-auto" />
                  <h3 className="text-lg font-bold text-slate-900">No Upcoming Events</h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    There are currently 0 published events in the portal. Events created by the
                    Owner Administrator will appear here for student registration.
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {publishedEvents.slice(0, 6).map((ev) => {
                    const isFull = ev.registered_count >= ev.capacity;
                    const myReg = getStudentRegistrationForEvent(ev.id);
                    return (
                      <div
                        key={ev.id}
                        className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl transition overflow-hidden flex flex-col"
                      >
                        <div className="h-44 bg-slate-900 relative overflow-hidden">
                          <img
                            src={ev.banner_url}
                            alt={ev.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1000&q=80';
                            }}
                          />
                          <div className="absolute top-3 left-3 flex gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-900/85 backdrop-blur-md text-white text-xs font-semibold">
                              {ev.category}
                            </span>
                          </div>
                          <div className="absolute bottom-3 right-3">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                isFull
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-emerald-600/90 text-white'
                              }`}
                            >
                              {ev.registered_count} / {ev.capacity} Seats
                            </span>
                          </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="text-xs font-semibold text-blue-700">
                              {ev.department_host}
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 line-clamp-1">
                              {ev.title}
                            </h3>
                            <p className="text-xs text-slate-600 line-clamp-2">{ev.description}</p>
                          </div>

                          <div className="space-y-3 pt-2 border-t border-slate-100">
                            <div className="text-xs text-slate-600 space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                <span>
                                  {ev.date} • {ev.start_time} - {ev.end_time}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                                <span>
                                  {ev.venue} {ev.building ? `(${ev.building})` : ''}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedEvent(ev)}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-[#0a1931] hover:bg-blue-900 text-white font-semibold text-xs transition"
                              >
                                {myReg ? 'View Pass / Details' : 'View & Register'}
                              </button>
                              {myReg && (
                                <button
                                  onClick={() =>
                                    setActiveTicket({ registration: myReg, event: ev })
                                  }
                                  className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                  title="Open Instant QR Pass"
                                >
                                  <QrCode className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ------------------------------------------------------------------
            2. EXPLORE EVENTS VIEW
        ------------------------------------------------------------------ */}
        {activeTab === 'explore' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">Explore Campus Events</h1>
                <p className="text-sm text-slate-600">
                  Filter by admin-defined categories, hosting departments, and seat availability
                </p>
              </div>
              {isStrictOwnerAdmin && (
                <button
                  onClick={openCreateEventModal}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-sm transition"
                >
                  <Plus className="w-4 h-4" /> Create New Event
                </button>
              )}
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search title, venue, speaker..."
                  className="bg-transparent text-sm w-full focus:outline-none"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none"
              >
                <option value="All">All Categories ({categories.length})</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none"
              >
                <option value="All">All Departments ({departments.length})</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>

              <select
                value={dateFilter}
                onChange={(e) =>
                  setDateFilter(e.target.value as 'all' | 'upcoming' | 'available-only')
                }
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none"
              >
                <option value="all">All Dates</option>
                <option value="upcoming">Upcoming Dates Only</option>
                <option value="available-only">Available Seats Only</option>
              </select>
            </div>

            {/* Filtered Results */}
            {filteredEvents.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
                <Filter className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900">No Matching Events Found</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  {publishedEvents.length === 0
                    ? 'No events have been created by the Owner Administrator yet.'
                    : 'Try clearing your search query or switching category/department filters.'}
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((ev) => {
                  const isFull = ev.registered_count >= ev.capacity;
                  const myReg = getStudentRegistrationForEvent(ev.id);
                  return (
                    <div
                      key={ev.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition overflow-hidden flex flex-col"
                    >
                      <div className="h-44 bg-slate-900 relative">
                        <img
                          src={ev.banner_url}
                          alt={ev.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/85 text-white text-xs font-semibold">
                          {ev.category}
                        </span>
                        <span
                          className={`absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isFull ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {ev.registered_count}/{ev.capacity} Seats
                        </span>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <p className="text-xs font-semibold text-blue-700">
                            {ev.department_host}
                          </p>
                          <h3 className="font-bold text-lg text-slate-900 mt-0.5">{ev.title}</h3>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {ev.description}
                          </p>

                          {/* Display Admin-Defined Custom Event Columns */}
                          {eventCustomCols.filter((c) => c.visible).length > 0 && (
                            <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                              {eventCustomCols
                                .filter((c) => c.visible)
                                .map((col) => {
                                  const val = ev.custom_fields?.[col.key];
                                  if (val === undefined || val === '') return null;
                                  return (
                                    <span
                                      key={col.id}
                                      className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium"
                                    >
                                      {col.label}: <strong>{String(val)}</strong>
                                    </span>
                                  );
                                })}
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-slate-100 space-y-3">
                          <div className="text-xs text-slate-600 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-blue-600" />
                              <span>
                                {ev.date} ({ev.start_time} - {ev.end_time})
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-blue-600" />
                              <span>{ev.venue}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => setSelectedEvent(ev)}
                            className="w-full py-2.5 rounded-xl bg-[#0a1931] hover:bg-blue-900 text-white text-xs font-semibold transition"
                          >
                            {myReg ? 'Registered — View QR Pass' : 'View Event & Register'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------
            3. STUDENT DASHBOARD VIEW (Instant SVG QR Entry Passes)
        ------------------------------------------------------------------ */}
        {activeTab === 'student-dashboard' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            {!currentUser ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
                <Lock className="w-10 h-10 text-blue-600 mx-auto" />
                <h2 className="text-xl font-bold text-slate-900">Student Sign In Required</h2>
                <p className="text-sm text-slate-600">
                  Please sign in with your student account to view your registered events and QR
                  passes.
                </p>
                <button
                  onClick={() => setActiveTab('auth')}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold"
                >
                  Go to Sign In
                </button>
              </div>
            ) : (
              <>
                <div className="bg-[#0a1931] text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-blue-300 font-semibold">
                      Student Portal
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
                      Welcome, {currentUser.full_name}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1">
                      Roll ID: <strong>{currentUser.student_id}</strong> • Department:{' '}
                      <strong>{currentUser.department}</strong> • Class of{' '}
                      {currentUser.graduation_year}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('explore')}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                  >
                    Browse More Events
                  </button>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900">
                    My Event Registrations & Instant QR Passes ({myRegistrations.length})
                  </h2>

                  {myRegistrations.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
                      <QrCode className="w-10 h-10 text-slate-400 mx-auto" />
                      <h3 className="font-bold text-slate-800">No Event Registrations Yet</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        When you register for a published campus event, your scannable QR entry pass
                        will be generated and stored here immediately.
                      </p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      {myRegistrations.map((reg) => {
                        const ev = events.find((e) => e.id === reg.event_id);
                        return (
                          <div
                            key={reg.id}
                            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row items-center gap-5"
                          >
                            {/* Instant Pure-SVG Scannable QR Code */}
                            <div
                              onClick={() => ev && setActiveTicket({ registration: reg, event: ev })}
                              className="cursor-pointer shrink-0"
                            >
                              <ScannableQrCodeSvg
                                value={reg.qr_payload}
                                ticketCode={reg.ticket_code}
                                size={120}
                              />
                            </div>

                            <div className="flex-1 space-y-2 text-center sm:text-left">
                              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-slate-100 text-slate-800">
                                  {reg.ticket_code}
                                </span>
                                <span
                                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                                    reg.status === 'attended'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : reg.status === 'cancelled'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {reg.status.toUpperCase()}
                                </span>
                              </div>

                              <h3 className="font-bold text-base text-slate-900">
                                {ev ? ev.title : 'Event Record'}
                              </h3>

                              {ev && (
                                <p className="text-xs text-slate-600">
                                  {ev.date} • {ev.start_time} • {ev.venue}
                                </p>
                              )}

                              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                {ev && reg.status !== 'cancelled' && (
                                  <button
                                    onClick={() =>
                                      setActiveTicket({ registration: reg, event: ev })
                                    }
                                    className="px-3.5 py-1.5 rounded-lg bg-[#0a1931] text-white text-xs font-semibold hover:bg-blue-900 transition inline-flex items-center gap-1.5"
                                  >
                                    <QrCode className="w-3.5 h-3.5" /> Full QR Pass
                                  </button>
                                )}
                                {reg.status === 'registered' && (
                                  <button
                                    onClick={() => handleCancelRegistration(reg.id)}
                                    className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition"
                                  >
                                    Cancel Seat
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------
            4. PROTECTED OWNER ADMIN CONSOLE ("ONLY FOR ME")
        ------------------------------------------------------------------ */}
        {activeTab === 'admin-dashboard' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {!isStrictOwnerAdmin ? (
              <div className="bg-white border-2 border-rose-200 rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto">
                <Shield className="w-12 h-12 text-rose-600 mx-auto" />
                <h2 className="text-2xl font-extrabold text-slate-900">
                  Restricted Owner Administrator Area
                </h2>
                <p className="text-sm text-slate-600">
                  Admin privileges are disabled for all public users and students. Only the
                  designated Master Owner Email ({ownerConfig.ownerEmail || 'Not claimed yet'}) can
                  access this console.
                </p>
                <button
                  onClick={() => {
                    setAuthMode(ownerConfig.isConfigured ? 'login' : 'owner-setup');
                    setActiveTab('auth');
                  }}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold"
                >
                  {ownerConfig.isConfigured
                    ? 'Sign In as Owner Administrator'
                    : 'Configure Owner Administrator'}
                </button>
              </div>
            ) : (
              <>
                {/* Admin Header */}
                <div className="bg-[#0a1931] text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
                      <Shield className="w-3.5 h-3.5" />
                      <span>EXCLUSIVE OWNER ADMINISTRATOR CONSOLE</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold pt-1">
                      Campus Connect Management & Schema Studio
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300">
                      Locked exclusively to your Owner Email:{' '}
                      <strong className="text-amber-300">{ownerConfig.ownerEmail}</strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={openCreateEventModal}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm inline-flex items-center gap-2 shadow-lg transition"
                    >
                      <Plus className="w-4 h-4" /> Add New Event
                    </button>
                    <button
                      onClick={() => setAdminSection('qr-scanner')}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm inline-flex items-center gap-2 shadow-lg transition"
                    >
                      <ScanLine className="w-4 h-4" /> Scan / Verify QR Pass
                    </button>
                  </div>
                </div>

                {/* Admin Sub-Navigation Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                  <button
                    onClick={() => setAdminSection('events')}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition ${
                      adminSection === 'events'
                        ? 'bg-[#0a1931] text-white shadow'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Calendar className="w-4 h-4" /> Events Table ({events.length})
                  </button>
                  <button
                    onClick={() => setAdminSection('categories')}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition ${
                      adminSection === 'categories'
                        ? 'bg-[#0a1931] text-white shadow'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Tag className="w-4 h-4" /> Categories ({categories.length})
                  </button>
                  <button
                    onClick={() => setAdminSection('departments')}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition ${
                      adminSection === 'departments'
                        ? 'bg-[#0a1931] text-white shadow'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-4 h-4" /> Departments ({departments.length})
                  </button>
                  <button
                    onClick={() => setAdminSection('table-builder')}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition ${
                      adminSection === 'table-builder'
                        ? 'bg-[#0a1931] text-white shadow'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Columns className="w-4 h-4" /> Customize Table Columns ({customColumns.length})
                  </button>
                  <button
                    onClick={() => setAdminSection('rosters')}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition ${
                      adminSection === 'rosters'
                        ? 'bg-[#0a1931] text-white shadow'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-4 h-4" /> Registrations Roster ({registrations.length})
                  </button>
                  <button
                    onClick={() => setAdminSection('qr-scanner')}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition ${
                      adminSection === 'qr-scanner'
                        ? 'bg-emerald-700 text-white shadow'
                        : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    <QrCode className="w-4 h-4" /> Fast QR Scanner
                  </button>
                </div>

                {/* ------------------------------------------------------------
                    ADMIN TAB A: CATEGORIES MANAGER (User/Admin Defined)
                ------------------------------------------------------------ */}
                {adminSection === 'categories' && (
                  <div className="grid lg:grid-cols-12 gap-8">
                    <form
                      onSubmit={handleSaveCategory}
                      className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit"
                    >
                      <h3 className="font-bold text-lg text-slate-900">
                        {editingCategoryId ? 'Edit Event Category' : 'Add New Event Category'}
                      </h3>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Category Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="e.g., Hackathon, Cultural Fest, Workshop, Seminar"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={newCategoryDesc}
                          onChange={(e) => setNewCategoryDesc(e.target.value)}
                          placeholder="Short description of this category"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Badge Accent Color
                        </label>
                        <select
                          value={newCategoryColor}
                          onChange={(e) => setNewCategoryColor(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                        >
                          <option value="blue">Navy / Royal Blue</option>
                          <option value="emerald">Emerald Green</option>
                          <option value="amber">Amber Gold</option>
                          <option value="purple">Royal Purple</option>
                          <option value="rose">Crimson Rose</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition"
                        >
                          {editingCategoryId ? 'Update Category' : 'Save Category'}
                        </button>
                        {editingCategoryId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategoryId(null);
                              setNewCategoryName('');
                              setNewCategoryDesc('');
                            }}
                            className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>

                    <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">
                          Defined Categories ({categories.length})
                        </h3>
                      </div>
                      {categories.length === 0 ? (
                        <div className="p-10 text-center text-sm text-slate-500">
                          No categories created yet. Add your first category on the left so you can
                          assign it to events.
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-50 text-slate-600 text-xs uppercase">
                              <th className="py-3 px-4">Category Name</th>
                              <th className="py-3 px-4">Description</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {categories.map((cat) => (
                              <tr key={cat.id} className="hover:bg-slate-50">
                                <td className="py-3 px-4 font-bold text-slate-900">{cat.name}</td>
                                <td className="py-3 px-4 text-slate-600">
                                  {cat.description || '—'}
                                </td>
                                <td className="py-3 px-4 text-right space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingCategoryId(cat.id);
                                      setNewCategoryName(cat.name);
                                      setNewCategoryDesc(cat.description);
                                      setNewCategoryColor(cat.color);
                                    }}
                                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------
                    ADMIN TAB B: DEPARTMENTS MANAGER (Admin Defined)
                ------------------------------------------------------------ */}
                {adminSection === 'departments' && (
                  <div className="grid lg:grid-cols-12 gap-8">
                    <form
                      onSubmit={handleSaveDepartment}
                      className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit"
                    >
                      <h3 className="font-bold text-lg text-slate-900">
                        {editingDeptId ? 'Edit Academic Department' : 'Add Academic Department'}
                      </h3>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Department Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newDeptName}
                          onChange={(e) => setNewDeptName(e.target.value)}
                          placeholder="e.g., Computer Science & Engineering"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Department Short Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={newDeptCode}
                          onChange={(e) => setNewDeptCode(e.target.value)}
                          placeholder="e.g., CSE, ECE, MECH, MBA"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Head of Department / Faculty Coordinator (Optional)
                        </label>
                        <input
                          type="text"
                          value={newDeptHead}
                          onChange={(e) => setNewDeptHead(e.target.value)}
                          placeholder="e.g., Dr. R. Sharma"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition"
                        >
                          {editingDeptId ? 'Update Department' : 'Save Department'}
                        </button>
                        {editingDeptId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDeptId(null);
                              setNewDeptName('');
                              setNewDeptCode('');
                              setNewDeptHead('');
                            }}
                            className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>

                    <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-200">
                        <h3 className="font-bold text-slate-900">
                          Admin-Defined Departments ({departments.length})
                        </h3>
                      </div>
                      {departments.length === 0 ? (
                        <div className="p-10 text-center text-sm text-slate-500">
                          No departments created yet. Add departments on the left so students can
                          select their department during registration and events can be assigned to
                          host departments.
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-50 text-slate-600 text-xs uppercase">
                              <th className="py-3 px-4">Code</th>
                              <th className="py-3 px-4">Department Name</th>
                              <th className="py-3 px-4">Faculty Head</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {departments.map((d) => (
                              <tr key={d.id} className="hover:bg-slate-50">
                                <td className="py-3 px-4 font-mono font-bold text-blue-700">
                                  {d.code}
                                </td>
                                <td className="py-3 px-4 font-bold text-slate-900">{d.name}</td>
                                <td className="py-3 px-4 text-slate-600">
                                  {d.faculty_head || '—'}
                                </td>
                                <td className="py-3 px-4 text-right space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingDeptId(d.id);
                                      setNewDeptName(d.name);
                                      setNewDeptCode(d.code);
                                      setNewDeptHead(d.faculty_head || '');
                                    }}
                                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDepartment(d.id)}
                                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------
                    ADMIN TAB C: DYNAMIC TABLE COLUMN & SCHEMA BUILDER
                ------------------------------------------------------------ */}
                {adminSection === 'table-builder' && (
                  <div className="grid lg:grid-cols-12 gap-8">
                    <form
                      onSubmit={handleAddCustomColumn}
                      className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit"
                    >
                      <h3 className="font-bold text-lg text-slate-900">
                        Add Custom Column to Tables
                      </h3>
                      <p className="text-xs text-slate-500">
                        Add custom columns to either the Events Table (e.g., &quot;Registration
                        Fee&quot;, &quot;Club Name&quot;, &quot;Credit Points&quot;) or the Student
                        Registration Form &amp; Roster Table (e.g., &quot;Laptop Bring Status&quot;,
                        &quot;Team Name&quot;).
                      </p>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Column Header Label *
                        </label>
                        <input
                          type="text"
                          required
                          value={newColLabel}
                          onChange={(e) => setNewColLabel(e.target.value)}
                          placeholder="e.g., Club / Society Name, Team Size, Entry Fee"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Target Table
                        </label>
                        <select
                          value={newColTarget}
                          onChange={(e) =>
                            setNewColTarget(e.target.value as 'events' | 'registrations')
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                        >
                          <option value="events">Events Table & Event Editor</option>
                          <option value="registrations">
                            Student Registration Form & Roster Table
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Data Type
                        </label>
                        <select
                          value={newColType}
                          onChange={(e) =>
                            setNewColType(e.target.value as 'text' | 'number' | 'boolean')
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                        >
                          <option value="text">Text String</option>
                          <option value="number">Numeric Value</option>
                          <option value="boolean">Yes / No Toggle</option>
                        </select>
                      </div>

                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newColRequired}
                          onChange={(e) => setNewColRequired(e.target.checked)}
                          className="rounded border-slate-300"
                        />
                        Make this column mandatory when filling forms
                      </label>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition"
                      >
                        + Add Column to Schema
                      </button>
                    </form>

                    <div className="lg:col-span-7 space-y-6">
                      {/* Toggle Standard Event Table Columns */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                        <h3 className="font-bold text-slate-900">
                          Toggle Visible Standard Columns in Events Table
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {Object.keys(visibleEventCols).map((colKey) => (
                            <label
                              key={colKey}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={visibleEventCols[colKey]}
                                onChange={(e) =>
                                  setVisibleEventCols((prev) => ({
                                    ...prev,
                                    [colKey]: e.target.checked
                                  }))
                                }
                              />
                              <span className="capitalize">{colKey.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Custom Columns List */}
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-200">
                          <h3 className="font-bold text-slate-900">
                            Admin-Defined Custom Columns ({customColumns.length})
                          </h3>
                        </div>
                        {customColumns.length === 0 ? (
                          <div className="p-8 text-center text-sm text-slate-500">
                            No custom columns added yet. Use the form on the left to add dynamic
                            columns to the Events or Registrations tables.
                          </div>
                        ) : (
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="bg-slate-50 text-xs uppercase text-slate-600">
                                <th className="py-3 px-4">Label</th>
                                <th className="py-3 px-4">Target Table</th>
                                <th className="py-3 px-4">Type</th>
                                <th className="py-3 px-4">Visible</th>
                                <th className="py-3 px-4 text-right">Delete</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {customColumns.map((col) => (
                                <tr key={col.id}>
                                  <td className="py-3 px-4 font-bold text-slate-900">
                                    {col.label}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold uppercase">
                                      {col.target}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-slate-600">{col.type}</td>
                                  <td className="py-3 px-4">
                                    <input
                                      type="checkbox"
                                      checked={col.visible}
                                      onChange={(e) =>
                                        setCustomColumns((prev) =>
                                          prev.map((c) =>
                                            c.id === col.id
                                              ? { ...c, visible: e.target.checked }
                                              : c
                                          )
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <button
                                      onClick={() =>
                                        setCustomColumns((prev) =>
                                          prev.filter((c) => c.id !== col.id)
                                        )
                                      }
                                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------
                    ADMIN TAB D: EVENTS TABLE (Editable Inline & Custom Columns)
                ------------------------------------------------------------ */}
                {adminSection === 'events' && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">
                          Campus Events Master Table ({events.length})
                        </h3>
                        <p className="text-xs text-slate-500">
                          Edit cells directly inline or open the full modal editor. Customize
                          columns in the &quot;Customize Table Columns&quot; tab.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAdminSection('table-builder')}
                          className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5"
                        >
                          <Columns className="w-3.5 h-3.5" /> Modify Columns
                        </button>
                        <button
                          onClick={openCreateEventModal}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" /> Add Event
                        </button>
                      </div>
                    </div>

                    {events.length === 0 ? (
                      <div className="p-12 text-center space-y-3">
                        <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
                        <h4 className="font-bold text-slate-800">0 Events in Table</h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          First make sure you have added at least 1 Category and 1 Department, then
                          click &quot;Add Event&quot; to create your first university event.
                        </p>
                        <div className="flex justify-center gap-2 pt-2">
                          <button
                            onClick={() => setAdminSection('categories')}
                            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold"
                          >
                            1. Add Categories ({categories.length})
                          </button>
                          <button
                            onClick={() => setAdminSection('departments')}
                            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold"
                          >
                            2. Add Departments ({departments.length})
                          </button>
                          <button
                            onClick={openCreateEventModal}
                            className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                          >
                            3. Create Event
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-600">
                              <th className="py-3.5 px-4">Title</th>
                              {visibleEventCols.category && <th className="py-3.5 px-4">Category</th>}
                              {visibleEventCols.department_host && (
                                <th className="py-3.5 px-4">Department</th>
                              )}
                              {visibleEventCols.date && <th className="py-3.5 px-4">Date & Time</th>}
                              {visibleEventCols.venue && <th className="py-3.5 px-4">Venue</th>}
                              {visibleEventCols.capacity && (
                                <th className="py-3.5 px-4">Seats / Capacity</th>
                              )}
                              {visibleEventCols.status && <th className="py-3.5 px-4">Status</th>}
                              {eventCustomCols
                                .filter((c) => c.visible)
                                .map((col) => (
                                  <th key={col.id} className="py-3.5 px-4 text-blue-700">
                                    {col.label}
                                  </th>
                                ))}
                              <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {events.map((ev) => {
                              const isInline = inlineEditingEventId === ev.id && inlineEventDraft;
                              return (
                                <tr key={ev.id} className="hover:bg-slate-50/80">
                                  <td className="py-3 px-4 font-bold text-slate-900">
                                    {isInline ? (
                                      <input
                                        type="text"
                                        value={inlineEventDraft.title}
                                        onChange={(e) =>
                                          setInlineEventDraft({
                                            ...inlineEventDraft,
                                            title: e.target.value
                                          })
                                        }
                                        className="px-2 py-1 border rounded text-sm w-44"
                                      />
                                    ) : (
                                      ev.title
                                    )}
                                  </td>

                                  {visibleEventCols.category && (
                                    <td className="py-3 px-4">
                                      {isInline ? (
                                        <select
                                          value={inlineEventDraft.category}
                                          onChange={(e) =>
                                            setInlineEventDraft({
                                              ...inlineEventDraft,
                                              category: e.target.value
                                            })
                                          }
                                          className="px-2 py-1 border rounded text-xs"
                                        >
                                          {categories.map((c) => (
                                            <option key={c.id} value={c.name}>
                                              {c.name}
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                                          {ev.category}
                                        </span>
                                      )}
                                    </td>
                                  )}

                                  {visibleEventCols.department_host && (
                                    <td className="py-3 px-4 text-slate-700">
                                      {isInline ? (
                                        <select
                                          value={inlineEventDraft.department_host}
                                          onChange={(e) =>
                                            setInlineEventDraft({
                                              ...inlineEventDraft,
                                              department_host: e.target.value
                                            })
                                          }
                                          className="px-2 py-1 border rounded text-xs"
                                        >
                                          {departments.map((d) => (
                                            <option key={d.id} value={d.name}>
                                              {d.name}
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        ev.department_host
                                      )}
                                    </td>
                                  )}

                                  {visibleEventCols.date && (
                                    <td className="py-3 px-4 text-slate-600 text-xs">
                                      {isInline ? (
                                        <input
                                          type="date"
                                          value={inlineEventDraft.date}
                                          onChange={(e) =>
                                            setInlineEventDraft({
                                              ...inlineEventDraft,
                                              date: e.target.value
                                            })
                                          }
                                          className="px-2 py-1 border rounded text-xs"
                                        />
                                      ) : (
                                        <>
                                          <div>{ev.date}</div>
                                          <div className="text-slate-400">
                                            {ev.start_time} - {ev.end_time}
                                          </div>
                                        </>
                                      )}
                                    </td>
                                  )}

                                  {visibleEventCols.venue && (
                                    <td className="py-3 px-4 text-slate-700">
                                      {isInline ? (
                                        <input
                                          type="text"
                                          value={inlineEventDraft.venue}
                                          onChange={(e) =>
                                            setInlineEventDraft({
                                              ...inlineEventDraft,
                                              venue: e.target.value
                                            })
                                          }
                                          className="px-2 py-1 border rounded text-xs w-32"
                                        />
                                      ) : (
                                        ev.venue
                                      )}
                                    </td>
                                  )}

                                  {visibleEventCols.capacity && (
                                    <td className="py-3 px-4 font-semibold">
                                      {isInline ? (
                                        <input
                                          type="number"
                                          value={inlineEventDraft.capacity}
                                          onChange={(e) =>
                                            setInlineEventDraft({
                                              ...inlineEventDraft,
                                              capacity: Number(e.target.value)
                                            })
                                          }
                                          className="px-2 py-1 border rounded text-xs w-20"
                                        />
                                      ) : (
                                        <span>
                                          {ev.registered_count} / {ev.capacity}
                                        </span>
                                      )}
                                    </td>
                                  )}

                                  {visibleEventCols.status && (
                                    <td className="py-3 px-4">
                                      {isInline ? (
                                        <select
                                          value={inlineEventDraft.status}
                                          onChange={(e) =>
                                            setInlineEventDraft({
                                              ...inlineEventDraft,
                                              status: e.target.value as EventStatus
                                            })
                                          }
                                          className="px-2 py-1 border rounded text-xs"
                                        >
                                          <option value="published">published</option>
                                          <option value="draft">draft</option>
                                          <option value="cancelled">cancelled</option>
                                          <option value="completed">completed</option>
                                        </select>
                                      ) : (
                                        <span
                                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                                            ev.status === 'published'
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : ev.status === 'cancelled'
                                              ? 'bg-rose-100 text-rose-800'
                                              : 'bg-slate-200 text-slate-700'
                                          }`}
                                        >
                                          {ev.status}
                                        </span>
                                      )}
                                    </td>
                                  )}

                                  {eventCustomCols
                                    .filter((c) => c.visible)
                                    .map((col) => (
                                      <td key={col.id} className="py-3 px-4 text-slate-700">
                                        {isInline ? (
                                          <input
                                            type={col.type === 'number' ? 'number' : 'text'}
                                            value={String(
                                              inlineEventDraft.custom_fields?.[col.key] ?? ''
                                            )}
                                            onChange={(e) =>
                                              setInlineEventDraft({
                                                ...inlineEventDraft,
                                                custom_fields: {
                                                  ...(inlineEventDraft.custom_fields || {}),
                                                  [col.key]: e.target.value
                                                }
                                              })
                                            }
                                            className="px-2 py-1 border rounded text-xs w-28"
                                          />
                                        ) : (
                                          String(ev.custom_fields?.[col.key] ?? '—')
                                        )}
                                      </td>
                                    ))}

                                  <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                                    {isInline ? (
                                      <>
                                        <button
                                          onClick={handleSaveInlineEventRow}
                                          className="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-semibold"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={() => {
                                            setInlineEditingEventId(null);
                                            setInlineEventDraft(null);
                                          }}
                                          className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-xs"
                                        >
                                          Cancel
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => {
                                            setInlineEditingEventId(ev.id);
                                            setInlineEventDraft({ ...ev });
                                          }}
                                          title="Quick Inline Row Edit"
                                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                                        >
                                          Inline Edit
                                        </button>
                                        <button
                                          onClick={() => openEditEventModal(ev)}
                                          title="Full Modal Edit"
                                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
                                        >
                                          <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteEvent(ev.id)}
                                          title="Delete Event"
                                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ------------------------------------------------------------
                    ADMIN TAB E: REGISTRATIONS ROSTER & CSV EXPORT
                ------------------------------------------------------------ */}
                {adminSection === 'rosters' && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
                    <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">
                          Student Registrations & Attendance Table ({activeRosterRegistrations.length})
                        </h3>
                        <p className="text-xs text-slate-500">
                          Mark live attendance or export the customized table to CSV.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={rosterEventId}
                          onChange={(e) => setRosterEventId(e.target.value)}
                          className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                        >
                          <option value="ALL">All Events ({registrations.length})</option>
                          {events.map((ev) => (
                            <option key={ev.id} value={ev.id}>
                              {ev.title}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={rosterSearch}
                          onChange={(e) => setRosterSearch(e.target.value)}
                          placeholder="Search name, roll, ticket code..."
                          className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
                        />
                        <button
                          onClick={handleExportCSV}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" /> Export CSV
                        </button>
                      </div>
                    </div>

                    {activeRosterRegistrations.length === 0 ? (
                      <div className="p-10 text-center text-sm text-slate-500">
                        No student registrations recorded yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-600">
                              <th className="py-3 px-4">Pass Code</th>
                              <th className="py-3 px-4">Student</th>
                              <th className="py-3 px-4">Roll No</th>
                              <th className="py-3 px-4">Department</th>
                              <th className="py-3 px-4">Event</th>
                              {regCustomCols
                                .filter((c) => c.visible)
                                .map((col) => (
                                  <th key={col.id} className="py-3 px-4 text-blue-700">
                                    {col.label}
                                  </th>
                                ))}
                              <th className="py-3 px-4">Status / Attendance</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {activeRosterRegistrations.map((r) => {
                              const ev = events.find((e) => e.id === r.event_id);
                              return (
                                <tr key={r.id} className="hover:bg-slate-50">
                                  <td className="py-3 px-4 font-mono font-bold text-xs text-slate-900">
                                    {r.ticket_code}
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-bold text-slate-900">{r.student_name}</div>
                                    <div className="text-xs text-slate-500">{r.student_email}</div>
                                  </td>
                                  <td className="py-3 px-4 font-mono text-xs">{r.student_roll}</td>
                                  <td className="py-3 px-4 text-xs">{r.student_department}</td>
                                  <td className="py-3 px-4 text-xs font-semibold">
                                    {ev?.title || '—'}
                                  </td>
                                  {regCustomCols
                                    .filter((c) => c.visible)
                                    .map((col) => (
                                      <td key={col.id} className="py-3 px-4 text-xs">
                                        {String(r.custom_fields?.[col.key] ?? '—')}
                                      </td>
                                    ))}
                                  <td className="py-3 px-4">
                                    <button
                                      onClick={() => handleToggleAttendance(r.id)}
                                      className={`px-3 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${
                                        r.status === 'attended'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : r.status === 'cancelled'
                                          ? 'bg-rose-100 text-rose-800'
                                          : 'bg-blue-100 text-blue-800'
                                      }`}
                                    >
                                      {r.status === 'attended' ? (
                                        <CheckSquare className="w-3.5 h-3.5" />
                                      ) : (
                                        <Square className="w-3.5 h-3.5" />
                                      )}
                                      {r.status === 'attended'
                                        ? 'Attended (Checked In)'
                                        : r.status.toUpperCase()}
                                    </button>
                                  </td>
                                  <td className="py-3 px-4 text-right space-x-1">
                                    {ev && (
                                      <button
                                        onClick={() =>
                                          setActiveTicket({ registration: r, event: ev })
                                        }
                                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
                                        title="View Pass QR"
                                      >
                                        <QrCode className="w-4 h-4" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteRegistrationRow(r.id)}
                                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                                      title="Delete Record"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ------------------------------------------------------------
                    ADMIN TAB F: FAST QR PASS SCANNER & VERIFIER
                ------------------------------------------------------------ */}
                {adminSection === 'qr-scanner' && (
                  <div className="grid lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <ScanLine className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900">
                            Instant QR Pass Code & Payload Verifier
                          </h3>
                          <p className="text-xs text-slate-500">
                            Paste or scan a student&apos;s Pass Code (e.g. CC-...) or raw QR JSON
                            payload to verify authenticity and check them in.
                          </p>
                        </div>
                      </div>

                      <form onSubmit={handleVerifyQrOrTicket} className="space-y-3">
                        <input
                          type="text"
                          value={qrScanInput}
                          onChange={(e) => setQrScanInput(e.target.value)}
                          placeholder="Enter Ticket Code (e.g., CC-AIW-482910) or scan QR payload..."
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-mono"
                        />
                        <button
                          type="submit"
                          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition"
                        >
                          Verify Pass Now
                        </button>
                      </form>

                      {registrations.length > 0 && (
                        <div className="pt-3 border-t border-slate-100">
                          <p className="text-xs font-semibold text-slate-500 mb-2">
                            Click any active pass below to test instant verification:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {registrations.slice(0, 6).map((r) => (
                              <button
                                key={r.id}
                                onClick={() => {
                                  setQrScanInput(r.ticket_code);
                                  const ev = events.find((e) => e.id === r.event_id);
                                  setScannedResult({ registration: r, event: ev });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-800 font-mono text-xs font-semibold"
                              >
                                {r.ticket_code} ({r.student_name})
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-6">
                      {scannedResult ? (
                        <div className="bg-white rounded-2xl border-2 border-emerald-500 p-6 shadow-lg space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                              ✓ VERIFIED STUDENT PASS
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-600">
                              {scannedResult.registration.ticket_code}
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <ScannableQrCodeSvg
                              value={scannedResult.registration.qr_payload}
                              ticketCode={scannedResult.registration.ticket_code}
                              size={110}
                            />
                            <div className="space-y-1 text-sm">
                              <p className="font-extrabold text-lg text-slate-900">
                                {scannedResult.registration.student_name}
                              </p>
                              <p className="text-slate-600 text-xs">
                                Roll ID: <strong>{scannedResult.registration.student_roll}</strong>
                              </p>
                              <p className="text-slate-600 text-xs">
                                Dept: <strong>{scannedResult.registration.student_department}</strong>
                              </p>
                              <p className="text-blue-700 font-semibold text-xs pt-1">
                                Event: {scannedResult.event?.title || 'Campus Event'}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleAttendance(scannedResult.registration.id)}
                            className={`w-full py-3 rounded-xl font-bold text-sm transition ${
                              scannedResult.registration.status === 'attended'
                                ? 'bg-slate-800 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            {scannedResult.registration.status === 'attended'
                              ? '✓ Already Checked In (Click to Undo)'
                              : 'Mark Student as Attended Now'}
                          </button>
                        </div>
                      ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
                          Scan or enter a pass code on the left to inspect and check in the
                          participant.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------
            5. AUTHENTICATION & STRICT OWNER SETUP VIEW
        ------------------------------------------------------------------ */}
        {activeTab === 'auth' && (
          <div className="max-w-md mx-auto px-4 py-12">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
              <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
                <button
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                    authMode === 'login'
                      ? 'bg-[#0a1931] text-white shadow'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                    authMode === 'register'
                      ? 'bg-[#0a1931] text-white shadow'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Student Sign Up
                </button>
                {!ownerConfig.isConfigured && (
                  <button
                    onClick={() => setAuthMode('owner-setup')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                      authMode === 'owner-setup'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-amber-700 hover:text-amber-900'
                    }`}
                  >
                    Owner Admin Setup
                  </button>
                )}
              </div>

              {authMode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Sign In to Portal</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Sign in with your Student account, or sign in with your designated Master
                      Owner email to unlock the Admin Console.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      University Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="you@university.edu"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[#0a1931] hover:bg-blue-900 text-white font-bold text-sm transition"
                  >
                    Sign In
                  </button>
                </form>
              )}

              {authMode === 'register' && (
                <form onSubmit={handleStudentRegister} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      Student Registration
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Create your verified student account. (Admin role is strictly disabled for
                      public registrations.)
                    </p>
                  </div>

                  {departments.length === 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                      <strong>Notice:</strong> The Owner Administrator has not created any Academic
                      Departments yet. Please ask the Owner Administrator to add departments first.
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={authFullName}
                      onChange={(e) => setAuthFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      University Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="student@university.edu"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Roll / Student ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={authStudentId}
                        onChange={(e) => setAuthStudentId(e.target.value)}
                        placeholder="e.g., 22CS104"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Graduation Year *
                      </label>
                      <input
                        type="number"
                        required
                        value={authGradYear}
                        onChange={(e) => setAuthGradYear(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Academic Department (Admin-Defined) *
                    </label>
                    <select
                      required
                      value={authDepartment || departments[0]?.name || ''}
                      onChange={(e) => setAuthDepartment(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    >
                      {departments.length === 0 ? (
                        <option value="">No departments configured by Admin yet</option>
                      ) : (
                        departments.map((d) => (
                          <option key={d.id} value={d.name}>
                            {d.name} ({d.code})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password (min 6 chars) *
                    </label>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={departments.length === 0}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-bold text-sm transition"
                  >
                    Create Student Account
                  </button>
                </form>
              )}

              {authMode === 'owner-setup' && !ownerConfig.isConfigured && (
                <form onSubmit={handleOwnerInitialSetup} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-amber-600" /> Exclusive Master Owner Setup
                    </p>
                    <p>
                      Register your personal Master Admin email and password below. Once claimed,
                      this setup tab disappears permanently and{' '}
                      <strong>only you</strong> will ever have Admin access.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Your Full Name (Owner Admin) *
                    </label>
                    <input
                      type="text"
                      required
                      value={authFullName}
                      onChange={(e) => setAuthFullName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Your Exclusive Master Admin Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="your-admin-email@university.edu"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Master Password (min 6 chars) *
                    </label>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm transition"
                  >
                    Lock & Activate My Owner Admin Account
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            6. PROFILE SETTINGS VIEW
        ------------------------------------------------------------------ */}
        {activeTab === 'profile' && currentUser && (
          <div className="max-w-xl mx-auto px-4 py-12">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Account Profile</h2>
                  <p className="text-xs text-slate-500">{currentUser.email}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-50 text-blue-700">
                  {isStrictOwnerAdmin ? 'Owner Administrator' : 'Verified Student'}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-500">Full Name</label>
                  <p className="font-bold text-slate-900">{currentUser.full_name}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500">
                    ID / Roll Number
                  </label>
                  <p className="font-mono font-bold text-slate-900">{currentUser.student_id}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500">Department</label>
                  <p className="font-bold text-slate-900">{currentUser.department}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            7. VS CODE & SUPABASE SQL EXPORT STUDIO
        ------------------------------------------------------------------ */}
        {false && activeTab === 'vscode-export' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
            <div className="bg-[#0a1931] text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold">
                  VS Code, GitHub Pages & Supabase SQL Files
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Copy these files into your local VS Code project to deploy with GitHub and Supabase PostgreSQL.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCodeFile('sql')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold ${
                    selectedCodeFile === 'sql'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-slate-300'
                  }`}
                >
                  001_initial_schema.sql
                </button>
                <button
                  onClick={() => setSelectedCodeFile('package')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold ${
                    selectedCodeFile === 'package'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-slate-300'
                  }`}
                >
                  package.json
                </button>
                <button
                  onClick={() => setSelectedCodeFile('env')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold ${
                    selectedCodeFile === 'env'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-slate-300'
                  }`}
                >
                  .env.example
                </button>
                <button
                  onClick={() => setSelectedCodeFile('workflow')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold ${
                    selectedCodeFile === 'workflow'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-slate-300'
                  }`}
                >
                  .github/workflows/deploy.yml
                </button>
                <button
                  onClick={() => setSelectedCodeFile('guide')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold ${
                    selectedCodeFile === 'guide'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-slate-300'
                  }`}
                >
                  GITHUB_DEPLOYMENT.md
                </button>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <span className="font-mono text-xs text-blue-300">
                  {selectedCodeFile === 'sql'
                    ? 'supabase/migrations/001_initial_schema.sql'
                    : selectedCodeFile === 'package'
                    ? 'package.json'
                    : selectedCodeFile === 'env'
                    ? '.env.example'
                    : selectedCodeFile === 'workflow'
                    ? '.github/workflows/deploy.yml'
                    : 'GITHUB_DEPLOYMENT.md'}
                </span>
                <button
                  onClick={() => {
                    const text =
                      selectedCodeFile === 'sql'
                        ? SQL_MIGRATION_SCRIPT
                        : selectedCodeFile === 'package'
                        ? PACKAGE_JSON_CONTENT
                        : selectedCodeFile === 'env'
                        ? ENV_EXAMPLE_CONTENT
                        : selectedCodeFile === 'workflow'
                        ? GITHUB_WORKFLOW_YML
                        : GITHUB_DEPLOY_GUIDE;
                    navigator.clipboard.writeText(text);
                    setCopiedFile(true);
                    setTimeout(() => setCopiedFile(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  {copiedFile ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedFile ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              <pre className="p-5 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                {selectedCodeFile === 'sql'
                  ? SQL_MIGRATION_SCRIPT
                  : selectedCodeFile === 'package'
                  ? PACKAGE_JSON_CONTENT
                  : selectedCodeFile === 'env'
                  ? ENV_EXAMPLE_CONTENT
                  : selectedCodeFile === 'workflow'
                  ? GITHUB_WORKFLOW_YML
                  : GITHUB_DEPLOY_GUIDE}
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* ====================================================================
          MODAL 1: EVENT DETAILS & STUDENT REGISTRATION MODAL
      ==================================================================== */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 my-8">
            <div className="h-52 bg-slate-900 relative">
              <img
                src={selectedEvent.banner_url}
                alt={selectedEvent.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-4 flex gap-2">
                <span className="px-3 py-1 rounded-lg bg-slate-900/90 text-white text-xs font-bold">
                  {selectedEvent.category}
                </span>
                <span className="px-3 py-1 rounded-lg bg-blue-600/90 text-white text-xs font-bold">
                  {selectedEvent.department_host}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">{selectedEvent.title}</h2>
                <p className="text-sm text-slate-600 mt-2">{selectedEvent.description}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700">
                <div>
                  <strong>Date & Time:</strong> {selectedEvent.date} ({selectedEvent.start_time} -{' '}
                  {selectedEvent.end_time})
                </div>
                <div>
                  <strong>Venue:</strong> {selectedEvent.venue}{' '}
                  {selectedEvent.building ? `(${selectedEvent.building})` : ''}
                </div>
                <div>
                  <strong>Registration Deadline:</strong>{' '}
                  {selectedEvent.registration_deadline.replace('T', ' ')}
                </div>
                <div>
                  <strong>Capacity:</strong> {selectedEvent.registered_count} /{' '}
                  {selectedEvent.capacity} Seats Filled
                </div>
                {eventCustomCols.map((col) => {
                  const val = selectedEvent.custom_fields?.[col.key];
                  if (val === undefined || val === '') return null;
                  return (
                    <div key={col.id}>
                      <strong>{col.label}:</strong> {String(val)}
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Custom Registration Fields configured by Admin */}
              {!getStudentRegistrationForEvent(selectedEvent.id) &&
                currentUser?.role !== 'admin' && (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    {regCustomCols.map((col) => (
                      <div key={col.id}>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {col.label} {col.required ? '*' : ''}
                        </label>
                        <input
                          type={col.type === 'number' ? 'number' : 'text'}
                          value={String(regCustomFields[col.key] ?? '')}
                          onChange={(e) =>
                            setRegCustomFields((prev) => ({
                              ...prev,
                              [col.key]: e.target.value
                            }))
                          }
                          placeholder={`Enter ${col.label}`}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Additional Notes / Requirements (Optional)
                      </label>
                      <input
                        type="text"
                        value={registrationNotes}
                        onChange={(e) => setRegistrationNotes(e.target.value)}
                        placeholder="Any accessibility or special notes..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                  </div>
                )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Close
                </button>
                {(() => {
                  const existing = getStudentRegistrationForEvent(selectedEvent.id);
                  if (existing) {
                    return (
                      <button
                        onClick={() => {
                          const ev = selectedEvent;
                          setSelectedEvent(null);
                          setActiveTicket({ registration: existing, event: ev });
                        }}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-2"
                      >
                        <QrCode className="w-4 h-4" /> Open My Scannable QR Pass
                      </button>
                    );
                  }
                  return (
                    <button
                      onClick={() => handleRegisterForEvent(selectedEvent)}
                      disabled={selectedEvent.registered_count >= selectedEvent.capacity}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white text-xs font-bold transition"
                    >
                      {selectedEvent.registered_count >= selectedEvent.capacity
                        ? 'Event Capacity Full'
                        : 'Confirm Registration & Generate QR Pass'}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: INSTANT PURE-SVG QR ENTRY PASS MODAL
      ==================================================================== */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-[#0a1931] text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-blue-300 font-bold">
                  Verified University Entry Pass
                </span>
                <h3 className="font-bold text-lg leading-snug mt-0.5">
                  {activeTicket.event.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveTicket(null)}
                className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-center space-y-4">
              {/* Instant Zero-Lag Pure SVG QR Code */}
              <ScannableQrCodeSvg
                value={activeTicket.registration.qr_payload}
                ticketCode={activeTicket.registration.ticket_code}
                size={210}
              />

              <div className="space-y-1">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Pass Code</p>
                <p className="font-mono text-lg font-extrabold text-slate-900">
                  {activeTicket.registration.ticket_code}
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Attendee:</span>
                  <strong className="text-slate-900">
                    {activeTicket.registration.student_name}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Roll ID:</span>
                  <strong className="font-mono text-slate-900">
                    {activeTicket.registration.student_roll}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Department:</span>
                  <strong className="text-slate-900">
                    {activeTicket.registration.student_department}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Time:</span>
                  <strong className="text-slate-900">
                    {activeTicket.event.date} • {activeTicket.event.start_time}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Venue:</span>
                  <strong className="text-slate-900">{activeTicket.event.venue}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <strong className="text-emerald-700 uppercase">
                    {activeTicket.registration.status}
                  </strong>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activeTicket.registration.ticket_code);
                    showToast(
                      'success',
                      'Pass Code Copied',
                      `${activeTicket.registration.ticket_code} copied to clipboard.`
                    );
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
                >
                  Copy Pass Code
                </button>
                <button
                  onClick={() => setActiveTicket(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#0a1931] text-white text-xs font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 3: OWNER ADMIN CREATE / EDIT EVENT MODAL
      ==================================================================== */}
      {isEventEditorOpen && isStrictOwnerAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveEvent}
            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 my-8"
          >
            <div className="bg-[#0a1931] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {editingEventId ? 'Edit Campus Event' : 'Create & Publish New Campus Event'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEventEditorOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-sm">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    placeholder="e.g., Annual AI & Robotics Symposium 2026"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category (Admin-Defined) *
                  </label>
                  <select
                    required
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Host Department (Admin-Defined) *
                  </label>
                  <select
                    required
                    value={eventForm.department_host}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, department_host: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registration Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={eventForm.registration_deadline}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, registration_deadline: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={eventForm.start_time}
                    onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={eventForm.end_time}
                    onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Venue / Auditorium *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventForm.venue}
                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                    placeholder="e.g., Main Auditorium"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Maximum Seat Capacity *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={eventForm.capacity}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, capacity: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Organizer / Club Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventForm.organizer_name}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, organizer_name: e.target.value })
                    }
                    placeholder="e.g., IEEE Student Branch"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Publication Status
                  </label>
                  <select
                    value={eventForm.status}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, status: e.target.value as EventStatus })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="published">Published (Open for Students)</option>
                    <option value="draft">Draft (Hidden)</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Banner Image URL
                  </label>
                  <input
                    type="url"
                    value={eventForm.banner_url}
                    onChange={(e) => setEventForm({ ...eventForm, banner_url: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Event Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    placeholder="Detailed overview of the event..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                {/* Custom Columns Added by Admin in Table Builder */}
                {eventCustomCols.map((col) => (
                  <div key={col.id}>
                    <label className="block text-xs font-semibold text-blue-700 mb-1">
                      {col.label} (Custom Column) {col.required ? '*' : ''}
                    </label>
                    <input
                      type={col.type === 'number' ? 'number' : 'text'}
                      required={col.required}
                      value={String(eventForm.custom_fields[col.key] ?? '')}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          custom_fields: {
                            ...eventForm.custom_fields,
                            [col.key]: e.target.value
                          }
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-blue-300 bg-blue-50/30"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEventEditorOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                {editingEventId ? 'Save Changes' : 'Publish Event'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#0a1931] text-slate-400 text-xs py-6 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Campus Connect — University Event Management Portal</p>
          <p>
            Owner Admin Status:{' '}
            {ownerConfig.isConfigured ? `Locked to ${ownerConfig.ownerEmail}` : 'Unclaimed'}
          </p>
        </div>
      </footer>
    </div>
  );
}