import { IItem } from '@esri/arcgis-rest-portal';
import { IDomainEntry } from '@esri/hub-common';
import { defaultCalculatedFields, defaultRequiredFields, getDcatDataset } from './dcat-dataset';
import { DatasetFormatTemplate, formatDcatCatalog, formatDcatDataset, mergeWithDefaultFormatTemplate } from './dcat-formatters';
import { FeedFormatterStream } from './feed-formatter-stream';
import { listDependencies } from 'adlib';

interface IDcatAPOptions {
  siteItem: IItem;
  domainRecord: IDomainEntry,
  orgBaseUrl: string;
  customFormatTemplate?: DatasetFormatTemplate
}

export function getDataStreamDcatAp201(options: IDcatAPOptions) {
  const catalogStr = formatDcatCatalog({ ...options });
  // lop off the "\n}"
  const header = `${catalogStr.substr(
    0,
    catalogStr.length - 2,
  )},\n\t"dcat:dataset": [\n`;

  const footer = '\n\t]\n}';
  
  const datasetFormatTemplate = mergeWithDefaultFormatTemplate(options.customFormatTemplate);
  const formatFn = (chunk) => {
    const dcatDataset = getDcatDataset(chunk, options.orgBaseUrl, options.domainRecord.orgTitle, options.siteItem.url);
    return formatDcatDataset(dcatDataset, datasetFormatTemplate);
  };

  return {
    dcatStream: new FeedFormatterStream(header, footer, ',\n', formatFn),
    dependencies: Array.from(
      new Set([
      ...defaultRequiredFields,
      ...listDependencies(datasetFormatTemplate)
          .filter(dependency => !defaultCalculatedFields.includes(dependency))
      ])
    )
  };
}
