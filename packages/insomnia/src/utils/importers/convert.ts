import { ImportRequest } from './entities';
import { setDefaults } from './utils';

export interface InsomniaImporter {
  id: string;
  name: string;
  description: string;
}

export interface ConvertResult {
  type: InsomniaImporter;
  data: {
    _type: 'export';
    __export_format: 4;
    __export_date: string;
    __export_source: `insomnia.importers:v${string}`;
    resources: ImportRequest[];
  };
}

export const convert = async (rawData: string) => {
  const importers = (await import('./importers')).importers;
  for (const importer of importers) {
    const resources = await importer.convert(rawData);

    if (!resources) {
      continue;
    }
    dotInKeyNameInvariant(resources);

    if (resources.length > 0 && resources[0].variable) {
      resources[0].environment = resources[0].variable;
    }

    const convertedResult = {
      type: {
        id: importer.id,
        name: importer.name,
        description: importer.description,
      },
      data: {
        _type: 'export',
        __export_format: 4,
        __export_date: new Date().toISOString(),
        __export_source: 'insomnia.importers:v0.1.0',
        resources: resources.map(setDefaults) as ImportRequest[],
      },
    };

    return convertedResult;
  }

  throw new Error('No importers found for file');
};

// this checks invalid keys ahead, or nedb would return an error in importing.
export function dotInKeyNameInvariant(entity: object) {
  JSON.stringify(entity, (key, value) => {
    if (key.includes('.')) {
      throw new Error(`Detected invalid key "${key}", which contains '.'. Please update it in the original tool and re-import it.`);
    }

    return value;
  });
}
