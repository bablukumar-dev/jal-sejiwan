const fs = require('fs');

const walkSync = function(dir, filelist) {
  files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(dir + '/' + file).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        filelist = walkSync(dir + '/' + file, filelist);
      }
    }
    else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        filelist.push(dir + '/' + file);
      }
    }
  });
  return filelist;
};

const allFiles = walkSync('.');

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('@/lib/placeholder')) {
    console.log(`Fixing ${file}`);
    
    // Quick and dirty manual replacements
    if (file.includes('TopAppBar.tsx')) {
        content = content.replace(/import \{ auth \} from '@\/lib\/placeholder';/g, "import { supabase } from '@/src/supabaseClient';");
        content = content.replace(/await auth\.signOut\(\);/g, "await supabase.auth.signOut();");
    } else if (file.includes('unauthorized/page.tsx')) {
        content = content.replace(/import \{ auth \} from '@\/lib\/placeholder';/g, "import { supabase } from '@/src/supabaseClient';");
        content = content.replace(/await auth\.signOut\(\);/g, "await supabase.auth.signOut();");
    } else if (file.includes('staff/dashboard/page.tsx')) {
        content = content.replace(/import \{ auth \} from '@\/lib\/placeholder';/g, "import { supabase } from '@/src/supabaseClient';");
        content = content.replace(/await auth\.signOut\(\);/g, "await supabase.auth.signOut();");
    } else if (file.includes('settings/page.tsx')) {
        content = content.replace(/import \{ auth \} from '@\/lib\/placeholder';/g, "import { supabase } from '@/src/supabaseClient';");
        content = content.replace(/await auth\.signOut\(\);/g, "await supabase.auth.signOut();");
        
        // Also the getDoc stuff
        content = content.replace(/const \{ doc, getDoc \} = await import\('@\/lib\/placeholder'\);\s*const \{ db \} = await import\('@\/lib\/placeholder'\);\s*const userDoc = await getDoc\(doc\(db, 'users', user\.uid\)\);\s*if \(userDoc\.exists\(\) && userDoc\.data\(\)\.role && !unmounted\) \{\s*setUserRole\(userDoc\.data\(\)\.role\);\s*localStorage\.setItem\('userRole', userDoc\.data\(\)\.role\);\s*\}/g,
        `const { data: userDoc, error } = await supabase.from('users').select('role').eq('id', user.id).single();
          if (userDoc && userDoc.role && !unmounted) {
            setUserRole(userDoc.role);
            localStorage.setItem('userRole', userDoc.role);
          }`);
          
        content = content.replace(/const \{ updateProfile \} = await import\('@\/lib\/placeholder'\);\s*const \{ doc, updateDoc \} = await import\('@\/lib\/placeholder'\);\s*const \{ db, auth \} = await import\('@\/lib\/placeholder'\);\s*if \(auth\.currentUser\) \{\s*await updateProfile\(auth\.currentUser, \{ displayName: cleanName \}\);\s*await updateDoc\(doc\(db, 'users', auth\.currentUser\.uid\), \{ name: cleanName \}\);\s*\}/g,
        `const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase.auth.updateUser({ data: { name: cleanName } });
          await supabase.from('users').update({ name: cleanName }).eq('id', session.user.id);
        }`);
    } else if (file.includes('OnboardingOverlay.tsx')) {
        content = content.replace(/import \{ db \} from '@\/lib\/placeholder';\nimport \{ doc, updateDoc, setDoc \} from '@\/lib\/placeholder';/g, "import { supabase } from '@/src/supabaseClient';");
        
        content = content.replace(/await updateDoc\(doc\(db, 'users', user\.id\), \{ onboardingCompleted: true, role: 'owner' \}\);/g, "await supabase.from('users').update({ onboardingCompleted: true, role: 'owner' }).eq('id', user.id);");
        
        content = content.replace(/await setDoc\(doc\(db, 'users', user\.id\), \{ onboardingCompleted: true, role: 'owner', email: user\.email \}\);/g, "await supabase.from('users').update({ onboardingCompleted: true, role: 'owner' }).eq('id', user.id);");
        
        content = content.replace(/const userDoc = await doc\(db, 'users', user\.id\);/g, "// unused");
    } else if (file.includes('cron/route.ts')) {
        content = content.replace(/import \{ collection, getDocs, doc, setDoc \} from '@\/lib\/placeholder';\nimport \{ db \} from '@\/lib\/placeholder';/g, "import { supabase } from '@/src/supabaseClient';");
        
        content = content.replace(/const usersRef = collection\(db, 'users'\);\s*const snapshot = await getDocs\(usersRef\);\s*const users: any\[\] = \[\];\s*snapshot\.forEach\(\(doc\) => \{\s*users\.push\(\{ id: doc\.id, \.\.\.doc\.data\(\) \}\);\s*\}\);/g, 
        "const { data: users, error } = await supabase.from('users').select('*');");
    }
    
    // customers add and edit
    if (file.includes('customers/add/page.tsx') || file.includes('customers/edit/[id]/page.tsx')) {
        content = content.replace(/import \{ storage \} from '@\/lib\/placeholder';\nimport \{ ref, uploadBytes, getDownloadURL \} from '@\/lib\/placeholder';/g, "import { supabase } from '@/src/supabaseClient';");
        
        content = content.replace(/const storageRef = ref\(storage, `customers\/\$\{Date\.now\(\)\}_\$\{file\.name\}`\);\n\s*await uploadBytes\(storageRef, file\);\n\s*const url = await getDownloadURL\(storageRef\);/g,
        `const filePath = \`customers/\${Date.now()}_\${file.name}\`;
      await supabase.storage.from('customers').upload(filePath, file);
      const { data } = supabase.storage.from('customers').getPublicUrl(filePath);
      const url = data.publicUrl;`);
    }

    fs.writeFileSync(file, content);
  }
}
