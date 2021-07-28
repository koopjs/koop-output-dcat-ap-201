import { IItem } from '@esri/arcgis-rest-portal';
import { IDomainEntry } from '@esri/hub-common';
import { DcatDataset as Dataset } from './dcat-dataset';
import { formatDcatCatalog, formatDcatDataset } from './dcat-formatters';
import { FeedFormatterStream } from './feed-formatter-stream';

interface IDcatAPOptions {
  siteItem: IItem;
  domainRecord: IDomainEntry,
  env: 'prod'|'qa'|'dev'
}

export function getDataStreamDcatAp201(options: IDcatAPOptions) {
  const portalUrl = `https://${options.domainRecord.orgKey}.maps${
    options.env === 'prod' ? '' : options.env
  }.arcgis.com`;

  const catalogStr = formatDcatCatalog({ ...options, portalUrl });
  // lop off the "\n}"
  const header = `${catalogStr.substr(
    0,
    catalogStr.length - 2,
  )},\n\t"dcat:dataset": [\n`;

  const footer = '\n\t]\n}';

  const formatFn = (chunk) => {
    const dataset = new Dataset(
      chunk,
      portalUrl,
      options.domainRecord.orgTitle,
      options.siteItem.url,
    );
    return formatDcatDataset(dataset);
  };

  return new FeedFormatterStream(header, footer, ',\n', formatFn);
}
