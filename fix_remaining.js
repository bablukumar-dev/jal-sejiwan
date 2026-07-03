const fs = require('fs');
const files = [
  'app/owner/dashboard/page.tsx',
  'app/staff/customers/page.tsx',
  'app/staff/service/page.tsx',
  'app/staff/route/page.tsx',
  'app/staff/dashboard/page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/const checkRole = async \(\) => \{[\s\S]*?checkRole\(\);/m, 
  `const checkRole = async () => {
      try {
        const { supabase } = await import('@/src/supabaseClient');
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (user) {
          const { data: userDoc, error } = await supabase.from('users').select('role').eq('id', user.id).single();
          if (userDoc && !error) {
            const role = userDoc.role;
            if (role === 'owner' || role === 'manager' || role === 'staff') {
              setUserRole(role);
              localStorage.setItem('userRole', role);
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkRole();`);
    
  // staff/service/page.tsx has updateDoc for order completion
  if (file.includes('staff/service/page.tsx')) {
      content = content.replace(/const \{ db \} = await import\('@\/lib\/placeholder'\);\s*const \{ doc, updateDoc \} = await import\('@\/lib\/placeholder'\);\s*await updateDoc\(doc\(db, 'services', serviceId\), \{\s*status: 'completed',\s*completedAt: new Date\(\)\.toISOString\(\)\s*\}\);/m,
      `const { supabase } = await import('@/src/supabaseClient');
      await supabase.from('services').update({ status: 'completed', completedAt: new Date().toISOString() }).eq('id', serviceId);`);
  }

  fs.writeFileSync(file, content);
}
