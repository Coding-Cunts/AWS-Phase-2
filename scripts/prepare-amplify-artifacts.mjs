import fs from 'node:fs';
import path from 'node:path';

const rootNext = path.resolve('.next');
const frontendNext = path.resolve('frontend/.next');

if (fs.existsSync(frontendNext)) {
  if (!fs.existsSync(rootNext)) {
    try {
      fs.symlinkSync(frontendNext, rootNext, 'junction');
      console.log('[Amplify Artifacts] Symlinked frontend/.next -> .next');
    } catch {
      try {
        fs.cpSync(frontendNext, rootNext, { recursive: true });
        console.log('[Amplify Artifacts] Copied frontend/.next -> .next');
      } catch (err) {
        console.warn('[Amplify Artifacts] Could not copy .next to root:', err.message);
      }
    }
  }
}
