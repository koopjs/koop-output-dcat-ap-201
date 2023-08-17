import { FeedFormatterStream } from './feed-formatter-stream';
import { TransformsList } from 'adlib';
import { compileDcatFeedEntry } from './compile-dcat-feed';

const DEFAULT_CATALOG_HEADER = {
  '@context': {
    dcat: 'http://www.w3.org/ns/dcat#',
    dct: 'http://purl.org/dc/terms/',
    foaf: 'http://xmlns.com/foaf/0.1/',
    vcard: 'http://www.w3.org/2006/vcard/ns#',
    ftype: 'http://publications.europa.eu/resource/authority/file-type/',
    lang: 'http://publications.europa.eu/resource/authority/language/',
    skos: "http://www.w3.org/2004/02/skos/core#",
    access: "http://publications.europa.eu/resource/authority/access-right/",
    xsd: "http://www.w3.org/2001/XMLSchema#"
  }
};
const FOOTER = '\n\t]\n}';

export function getDataStreamDcatAp201(feedTemplate: any, feedTemplateTransforms: TransformsList) {
  const { header: templateHeader, ...restFeedTemplate } = feedTemplate;

  const streamFormatter = (chunk) => {
    return compileDcatFeedEntry(chunk, restFeedTemplate, feedTemplateTransforms);
  };

  const streamHeader = getStreamHeader(templateHeader);

  return {
    dcatStream: new FeedFormatterStream(streamHeader, FOOTER, ',\n', streamFormatter)
  };
}

function getStreamHeader(templateHeader): string {
  const feedHeader = JSON.stringify({ ...DEFAULT_CATALOG_HEADER, ...templateHeader }, null, '\t');

  return `${feedHeader.substring(0, feedHeader.length - 2)},\n\t"dcat:dataset": [\n`;
}
