import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadCatalogue } from '../../scripts/catalogue.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CATALOGUE = join(ROOT, 'catalogue');
const LOCAL_PAGES = join(ROOT, 'site', 'rules');

export const SEVERITY_LABELS = { failure: 'Failure', 'ux-failure': 'UX failure', smell: 'Smell' };
export const SEVERITY_RANK = { smell: 1, 'ux-failure': 2, failure: 3 };

function ruleUrl(id, baseUrl) {
  if (baseUrl) return `${baseUrl.replace(/\/+$/, '')}/rules/${id}.html`;
  const local = join(LOCAL_PAGES, `${id}.html`);
  return existsSync(local) ? pathToFileURL(local).href : null;
}

export function loadRules(baseUrl) {
  const rules = new Map();
  for (const { data } of loadCatalogue(CATALOGUE)) {
    rules.set(data.id, {
      id: data.id,
      title: data.title,
      severity: data.severity,
      tier: data.tier,
      failureMode: data.failure_mode,
      wcag: (data.anchor.wcag ?? []).map((w) => `${w.criterion} ${w.name} (Level ${w.level})`),
      gateable: data.detection.automatic === true,
      url: ruleUrl(data.id, baseUrl),
    });
  }
  return rules;
}
