// Services offered
export const SERVICES = [
  { id: 's1', name: "Women's Cut & Style", duration: 60, price: 65 },
  { id: 's2', name: "Men's Cut", duration: 30, price: 35 },
  { id: 's3', name: 'Full Color', duration: 120, price: 150 },
  { id: 's4', name: 'Balayage / Highlights', duration: 150, price: 200 },
  { id: 's5', name: 'Blowout & Style', duration: 45, price: 50 },
  { id: 's6', name: 'Deep Conditioning', duration: 30, price: 40 },
  { id: 's7', name: 'Bridal / Special Event', duration: 180, price: 250 },
  { id: 's8', name: 'Consultation', duration: 15, price: 0 },
];

// Day names
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Default weekly hours (day index 0=Sun ... 6=Sat)
export const DEFAULT_WEEKLY_HOURS = {
  0: { open: false, start: '09:00', end: '19:00' }, // Sun
  1: { open: false, start: '09:00', end: '19:00' }, // Mon
  2: { open: true, start: '09:00', end: '19:00' },  // Tue
  3: { open: true, start: '09:00', end: '19:00' },  // Wed
  4: { open: true, start: '09:00', end: '19:00' },  // Thu
  5: { open: true, start: '09:00', end: '19:00' },  // Fri
  6: { open: true, start: '09:00', end: '19:00' },  // Sat
};

// Helper to get today's date string
const today = new Date();
const fmt = (d) => d.toISOString().split('T')[0];
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

// Demo users
export const INITIAL_USERS = [
  {
    id: 'u1',
    name: 'Lon Hoey',
    email: 'lon@lonmichaels.com',
    password: 'admin123',
    phone: '(412) 260-9275',
    role: 'admin',
  },
  {
    id: 'u2',
    name: 'Sarah Johnson',
    email: 'sarah@email.com',
    password: 'pass123',
    phone: '(412) 555-0102',
    role: 'customer',
  },
  {
    id: 'u3',
    name: 'Emily Davis',
    email: 'emily@email.com',
    password: 'pass123',
    phone: '(412) 555-0203',
    role: 'customer',
  },
  {
    id: 'u4',
    name: 'Jessica Martinez',
    email: 'jessica@email.com',
    password: 'pass123',
    phone: '(412) 555-0304',
    role: 'customer',
  },
];

// Find next open day from today
function findNextOpenDay(offset) {
  let d = addDays(today, offset);
  let dow = d.getDay();
  while (!DEFAULT_WEEKLY_HOURS[dow].open) {
    d = addDays(d, 1);
    dow = d.getDay();
  }
  return d;
}

const nextOpen1 = findNextOpenDay(0);
const nextOpen2 = findNextOpenDay(1);
const nextOpen3 = findNextOpenDay(2);
const nextOpen4 = findNextOpenDay(3);

// Demo appointments
export const INITIAL_APPOINTMENTS = [
  {
    id: 'a1',
    userId: 'u2',
    serviceId: 's1',
    date: fmt(nextOpen1),
    time: '10:00',
    duration: 60,
    status: 'confirmed',
    notes: 'Trim and layers please',
  },
  {
    id: 'a2',
    userId: 'u3',
    serviceId: 's4',
    date: fmt(nextOpen2),
    time: '13:00',
    duration: 150,
    status: 'pending',
    notes: 'Want to go lighter for summer',
  },
  {
    id: 'a3',
    userId: 'u4',
    serviceId: 's5',
    date: fmt(nextOpen3),
    time: '11:00',
    duration: 45,
    status: 'confirmed',
    notes: '',
  },
  {
    id: 'a4',
    userId: 'u2',
    serviceId: 's3',
    date: fmt(nextOpen4),
    time: '14:00',
    duration: 120,
    status: 'pending',
    notes: 'Thinking about going red',
  },
];

// Unsplash photos for gallery
export const INITIAL_GALLERY = [
  { id: 'g1', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=600&fit=crop', caption: 'Luxury balayage transformation', featured: true, instagram: true },
  { id: 'g2', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=600&fit=crop', caption: 'Effortless waves for date night', featured: true, instagram: true },
  { id: 'g3', url: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&h=600&fit=crop', caption: 'Precision men\'s cut', featured: true, instagram: false },
  { id: 'g4', url: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=600&fit=crop', caption: 'Rich brunette color melt', featured: true, instagram: true },
  { id: 'g5', url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=600&fit=crop', caption: 'Golden highlights for fall', featured: false, instagram: true },
  { id: 'g6', url: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&h=600&fit=crop', caption: 'Studio 6 vibes', featured: false, instagram: false },
  { id: 'g7', url: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=600&h=600&fit=crop', caption: 'Bridal updo perfection', featured: true, instagram: true },
  { id: 'g8', url: 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=600&h=600&fit=crop', caption: 'Sleek and polished blowout', featured: false, instagram: true },
];

// Demo messages
export const INITIAL_MESSAGES = [
  {
    id: 'm1',
    type: 'appointment_request',
    to: 'u1',
    from: 'u3',
    title: 'New Appointment Request',
    body: 'Emily Davis has requested Balayage / Highlights on ' + fmt(nextOpen2) + ' at 1:00 PM.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false,
  },
  {
    id: 'm2',
    type: 'appointment_confirmed',
    to: 'u2',
    from: 'u1',
    title: 'Appointment Confirmed!',
    body: "Your Women's Cut & Style on " + fmt(nextOpen1) + " at 10:00 AM has been confirmed. See you then!",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    read: false,
  },
  {
    id: 'm3',
    type: 'general',
    to: 'u2',
    from: 'u1',
    title: 'Welcome to Lon Michael\'s!',
    body: 'Thank you for joining us. We look forward to making you look and feel amazing!',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    read: true,
  },
  {
    id: 'm4',
    type: 'appointment_request',
    to: 'u1',
    from: 'u2',
    title: 'New Appointment Request',
    body: 'Sarah Johnson has requested Full Color on ' + fmt(nextOpen4) + ' at 2:00 PM.',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    read: false,
  },
];

// Default blocked times
export const DEFAULT_BLOCKED_TIMES = [
  { id: 'bt1', type: 'recurring', day: null, start: '12:00', end: '12:30', reason: 'Lunch break', recurring: true },
];
