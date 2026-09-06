import joaoFirstVoyage from './dialogue/joaoFirstVoyage';
import joaoLisbon from './dialogue/joaoLisbon';
import { terms } from './terms';
import { ui } from './ui';

export const mergeCatalogs = (
  ...catalogs: Record<string, string>[]
): Record<string, string> => {
  const merged: Record<string, string> = Object.create(null);
  catalogs.forEach((catalog) => {
    Object.entries(catalog).forEach(([source, translated]) => {
      if (source in merged && merged[source] !== translated) {
        throw new Error(`Conflicting translation for "${source}"`);
      }
      merged[source] = translated;
    });
  });
  return merged;
};

export const dialogueCatalog = mergeCatalogs(joaoLisbon, joaoFirstVoyage);
export const chineseCatalog = mergeCatalogs(ui, terms, dialogueCatalog);

export default chineseCatalog;
