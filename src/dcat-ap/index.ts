import { IItem } from '@esri/arcgis-rest-portal';
import { IDomainEntry } from '@esri/hub-common';
import { getDcatDataset } from './dcat-dataset';
import { DatasetFormatTemplate, formatDcatCatalog, formatDcatDataset } from './dcat-formatters';
import { FeedFormatterStream } from './feed-formatter-stream';

interface IDcatAPOptions {
  siteItem: IItem;
  domainRecord: IDomainEntry,
  orgBaseUrl: string;
  datasetFormatTemplate: DatasetFormatTemplate
}

export function getDataStreamDcatAp201(options: IDcatAPOptions) {
  const catalogStr = formatDcatCatalog({ ...options });
  // lop off the "\n}"
  const header = `${catalogStr.substr(
    0,
    catalogStr.length - 2,
  )},\n\t"dcat:dataset": [\n`;

  const footer = '\n\t]\n}';

  const formatFn = (chunk) => {
    const dcatDataset = getDcatDataset(chunk, options.orgBaseUrl, options.domainRecord.orgTitle, options.siteItem.url);
    return formatDcatDataset(dcatDataset, options.datasetFormatTemplate);
  };

  return new FeedFormatterStream(header, footer, ',\n', formatFn);
}
