import { setLocale } from './localization';

// Existing regression tests assert canonical English copy. Tests that cover
// Chinese opt in explicitly, while real first-launch behavior remains zh-CN.
setLocale('en');
