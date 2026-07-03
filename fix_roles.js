const fs = require('fs');

const files = [
  'app/staff/customers/page.tsx',
  'app/staff/service/page.tsx',
  'app/staff/route/page.tsx',
  'app/staff/dashboard/page.tsx',
  'app/settings/page.tsx',
  'app/owner/dashboard/page.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace the Firestore checkRole with Supabase checkRole
  const firestoreCheckRoleRegex = /const checkRole = async \(\) => \{\s*try \{\s*const \{ auth, db \} = await import\('@\/lib\/placeholder'\);\s*const \{ doc, getDoc \} = await import\('@\/lib\/placeholder'\);\s*const user = auth\.currentUser;\s*if \(user\) \{\s*const userDoc = await getDoc\(doc\(db, 'users', user\.uid\)\);\s*if \(userDoc\.exists\(\)\) \{\s*const role = userDoc\.data\(\)\.role;\s*if \(role === 'owner' \|\| role === 'manager' \|\| role === 'staff'\) \{\s*setUserRole\(role\);\s*localStorage\.setItem\('userRole', role\);\s*\}\s*\}\s*\}\s*\} catch \(e\) \{\s*console\.error\(e\);\s*\}\s*\};/g;

  const supabaseCheckRole = `const checkRole = async () => {
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
    };`;

  content = content.replace(firestoreCheckRoleRegex, supabaseCheckRole);
  
  // Other replacements if it's slightly different
  content = content.replace(/const \{ auth, db \} = await import\('@\/lib\/placeholder'\);\s*const \{ doc, getDoc \} = await import\('@\/lib\/placeholder'\);\s*const user = auth\.currentUser;\s*if \(user\) \{\s*const userDoc = await getDoc\(doc\(db, 'users', user\.uid\)\);\s*if \(userDoc\.exists\(\)\) \{\s*const role = userDoc\.data\(\)\.role;/g, 
  `const { supabase } = await import('@/src/supabaseClient');
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (user) {
          const { data: userDoc, error } = await supabase.from('users').select('role').eq('id', user.id).single();
          if (userDoc && !error) {
            const role = userDoc.role;`);
            
  // updateProfile / updateDoc in settings
  content = content.replace(/const \{ updateProfile \} = await import\('@\/lib\/placeholder'\);\s*const \{ doc, updateDoc \} = await import\('@\/lib\/placeholder'\);\s*const \{ db, auth \} = await import\('@\/lib\/placeholder'\);\s*const user = auth\.currentUser;\s*if \(user\) \{\s*await updateProfile\(user, \{\s*displayName: name\s*\}\);/g,
  `const { supabase } = await import('@/src/supabaseClient');
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (user) {
          await supabase.auth.updateUser({ data: { name } });`);
          
  content = content.replace(/await updateDoc\(doc\(db, 'users', user\.uid\), \{\s*name\s*\}\);/g,
  `await supabase.from('users').update({ name }).eq('id', user.id);`);
  
  fs.writeFileSync(file, content);
}
