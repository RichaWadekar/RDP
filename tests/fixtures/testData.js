/**
 * Test data constants and configurations
 * Stores all test data in one place so specs don't hardcode values.
 * what is stores: Credentials (admin.devrainyday@yopmail.com), URLs (/content-moderation, /activities...), form data (activity, FAQ, admin user), filter values, timeout configs
 */

const testData = {
  // Login credentials
  credentials: {
    email: 'admin.devrainyday@yopmail.com',
    yopmailInbox: 'admin.devrainyday'
  },

  // URLs
  urls: {
    base: 'https://stage.rainydayparents.com',
    login: '/login',
    contentModeration: '/content-moderation',
    activities: '/activities',
    createActivity: '/activities/create',
    faqs: '/faqs',
    adminUsers: '/admin-users',
    appUsers: '/app-users',
    userModeration: '/user-moderation',
    bannedWords: '/banned-words',
    wordModeration: '/word-moderation'
  },

  // Activity form data
  activity: {
    name: 'Test Automation',
    description: 'I am testing activity with automation',
    startDate: '01/24/2026',
    startTime: '11:00',
    endDate: '01/29/2026',
    endTime: '17:30',
    frequency: 'Hybrid',
    environmentType: 'Outdoor',
    eventType: 'Public Pool',
    entryFee: 'Free',
    ageGroups: ['Prenatal', '0-6 months', '6-12 months', '3 years', '4 years', '5 years', '6 years'],
    locationSearch: 'mindbowser',
    locationName: 'Mindbowser Inc'
  },

  // FAQ form data
  faq: {
    question: 'test Faq',
    answer: 'working fine'
  },

  // Admin user form data
  adminUser: {
    firstName: 'richa',
    lastName: 'wadekar',
    role: 'Admin'
  },

  // Content moderation filter data
  contentModerationFilters: {
    reportedDate: '01/07/2026',
    reportReason: 'Spam',
    status: 'Action Required',
    content: 'Post'
  },

  // Prenatal activity data (Sprint 9)
  prenatalActivity: {
    name: 'Prenatal Test Activity',
    description: 'Testing prenatal age group activity',
    startDate: '03/01/2026',
    startTime: '10:00',
    endDate: '03/15/2026',
    endTime: '12:00',
    frequency: 'Hybrid',
    environmentType: 'Indoor',
    eventType: 'Public Pool',
    entryFee: 'Free',
    ageGroups: ['Prenatal'],
    locationSearch: 'mindbowser',
    locationName: 'Mindbowser Inc'
  },

  // Hybrid activity data with pricing (Sprint 9)
  hybridActivity: {
    name: 'Hybrid Test Activity',
    description: 'Testing hybrid activity type with pricing',
    startDate: '03/01/2026',
    startTime: '09:00',
    endDate: '03/31/2026',
    endTime: '17:00',
    frequency: 'Hybrid',
    environmentType: 'Outdoor',
    eventType: 'Public Pool',
    entryFee: 'Paid',
    ageGroups: ['Prenatal', '0-6 months', '3 years'],
    locationSearch: 'mindbowser',
    locationName: 'Mindbowser Inc',
    hybridDetails: {
      fullSessionPrice: '50',
      dropInPrice: '15',
      dropInRules: 'Maximum 2 drop-in sessions per week'
    }
  },

  // Custom schedule data (Sprint 9)
  customSchedule: {
    date1: '2026-03-10',
    date2: '2026-03-12',
    timeSlots: [
      { start: '09:00', end: '10:00' },
      { start: '14:00', end: '15:30' }
    ],
    overlappingSlot: { start: '09:30', end: '10:30' }
  },

  // Age group validation (Sprint 9)
  ageGroups: {
    expected: ['Prenatal', '0-6 months', '6-12 months', '1 year', '2 years', '3 years', '4 years', '5 years', '6', '7+'],
    deprecated: ['6+']
  },

  // Banned words
  bannedWords: {
    testWord: 'testban'
  },

  // Timeouts
  timeouts: {
    short: 5000,
    medium: 10000,
    long: 30000,
    veryLong: 60000,
    test: 300000
  }
};

module.exports = { testData };
