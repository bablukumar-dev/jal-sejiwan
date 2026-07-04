const TRUNCATED_KEY = 'pk_test_YnVyc3RpbmctcGVhY29jay05OC5jbGVyay5hY2NvdW';
const REPAIRED_KEY = 'pk_test_YnVyc3RpbmctcGVhY29jay05OC5jbGVyay5hY2NvdW50cy5kZXYk';

const KEY_NAME = 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY';

export function getClerkPublishableKey(): string {
  if (typeof process !== 'undefined' && process.env) {
    const envObj = process.env as Record<string, string | undefined>;
    const envKey = envObj[KEY_NAME];
    if (!envKey) return '';
    if (envKey === TRUNCATED_KEY || envKey.startsWith(TRUNCATED_KEY)) {
      return REPAIRED_KEY;
    }
    return envKey;
  }
  return '';
}

// Side-effect: Repair process.env dynamically on module loading
if (typeof process !== 'undefined' && process.env) {
  const envObj = process.env as Record<string, string | undefined>;
  const currentKey = envObj[KEY_NAME];
  if (currentKey === TRUNCATED_KEY || (currentKey && currentKey.startsWith(TRUNCATED_KEY))) {
    envObj[KEY_NAME] = REPAIRED_KEY;
  }
}
