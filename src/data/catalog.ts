import raw from './catalog.json';
import { buildCatalog, type RawCatalog } from '../engine/catalogIndex';

// catalog.json is the single source of truth; `npm run validate` checks its shape and rules.
export const catalog = buildCatalog(raw as unknown as RawCatalog);
