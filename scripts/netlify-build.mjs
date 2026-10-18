import { spawnSync } from 'node:child_process';

// Accept the existing hosting names as aliases. Never use a service-role key.
process.env.VITE_SUPABASE_URL ||= process.env.SUPABASE_URL || '';
process.env.VITE_SUPABASE_ANON_KEY ||= process.env.SUPABASE_ANON_KEY || '';
process.env.VITE_SUPPORT_WHATSAPP ||= process.env.NORI_SUPPORT_WHATSAPP || '5547992739983';
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY na hospedagem.');
}
const result = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', '--version'], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status || 1);
for (const [file, args] of [
  ['node_modules/typescript/bin/tsc', ['-b']],
  ['node_modules/vite/bin/vite.js', ['build']],
]) {
  const build = spawnSync(process.execPath, [file, ...args], { stdio: 'inherit' });
  if (build.status !== 0) process.exit(build.status || 1);
}
