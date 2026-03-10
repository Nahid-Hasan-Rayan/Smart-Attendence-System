const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;

const filesToCheck = [
  // Part 1: Project Setup
  { name: 'lib/supabase/client.ts', part: 1 },
  { name: 'lib/supabase/server.ts', part: 1 },
  { name: 'middleware.ts', part: 1, note: 'may be named proxy.ts in Next.js 16+' },
  { name: 'app/layout.tsx', part: 1 },
  { name: 'app/page.tsx', part: 1 },

  // Part 2: Authentication
  { name: 'app/register/page.tsx', part: 2 },
  { name: 'app/login/page.tsx', part: 2 },
  { name: 'app/dashboard/page.tsx', part: 2, note: 'enhanced in later parts' },

  // Part 3: Organizations
  { name: 'app/org/create/page.tsx', part: 3 },
  { name: 'app/org/join/page.tsx', part: 3 },

  // Part 4: Sessions
  { name: 'app/dashboard/create-session/page.tsx', part: 4 },
  { name: 'app/dashboard/session/[id]/page.tsx', part: 4, note: 'created in part 4, expanded later' },

  // Part 5: QR Generation
  { name: 'app/api/session/[id]/generate-qr/route.ts', part: 5 },
  { name: 'components/QRCodeDisplay.tsx', part: 5 },

  // Part 6: QR Scanning & Attendance
  { name: 'app/scan/page.tsx', part: 6 },
  { name: 'app/api/attendance/mark/route.ts', part: 6 },
  { name: 'app/scan/actions.ts', part: 6, note: 'if using server actions' },

  // Part 7: Mode & Theming
  { name: 'contexts/ModeContext.tsx', part: 7 },
  { name: 'app/dashboard/DashboardContent.tsx', part: 7 },
  { name: 'components/ui/mode-aware-button.tsx', part: 7, note: 'optional' },
  { name: 'components/ui/button.tsx', part: 7, note: 'shadcn button' },
  { name: 'lib/utils.ts', part: 7, note: 'shadcn utility' },
  { name: 'components.json', part: 7 },
];

console.log('📁 Project File Checker\n');
let allFound = true;

for (const file of filesToCheck) {
  const fullPath = path.join(projectRoot, file.name);
  const exists = fs.existsSync(fullPath);
  const status = exists ? '✅' : '❌';
  const partTag = `[Part ${file.part}]`;
  const note = file.note ? ` (${file.note})` : '';
  console.log(`${status} ${partTag.padEnd(8)} ${file.name}${note}`);
  if (!exists) allFound = false;
}

console.log('\n📊 Summary:');
console.log('✅ = File exists   ❌ = File missing');
if (!allFound) {
  console.log('\nSome files are missing. This may be intentional if you haven’t implemented that part yet.');
}

// Additional check: Database schema (optional)
console.log('\n🗄️  Database Tables (check manually in Supabase):');
console.log('- organizations');
console.log('- profiles');
console.log('- sessions');
console.log('- attendance');