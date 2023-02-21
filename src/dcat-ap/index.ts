import { FeedFormatterStream } from './feed-formatter-stream';
import { TransformsList } from 'adlib';
import { compileDcatFeedEntry } from './compile-dcat-feed';

export function getDataStreamDcatAp201(feedTemplate: any, feedTemplateTransforms: TransformsList) {
  const catalogStr = JSON.stringify({
    '@context': {
      dcat: 'http://www.w3.org/ns/dcat#',
      dct: 'http://purl.org/dc/terms/',
      foaf: 'http://xmlns.com/foaf/0.1/',
      vcard: 'http://www.w3.org/2006/vcard/ns#',
      ftype: 'http://publications.europa.eu/resource/authority/file-type/',
      lang: 'http://publications.europa.eu/resource/authority/language/',
    },
    ...feedTemplate.header
  }, null, '\t');

  const header = `${catalogStr.substr(
    0,
    catalogStr.length - 2,
  )},\n\t"dcat:dataset": [\n`;

  const footer = '\n\t]\n}';

  const formatFn = (chunk) => {
    return compileDcatFeedEntry(chunk, objectWithoutKeys(feedTemplate, ['header']), feedTemplateTransforms);
  };

  return {
    dcatStream: new FeedFormatterStream(header, footer, ',\n', formatFn)
  };
}

/**
 * fast approach to remove keys from an object
 * (from babel transplier)
 */
function objectWithoutKeys(obj, keys) {
  return Object.keys(obj).reduce((newObject, key) => {
    if (keys.indexOf(key) === -1) newObject[key] = obj[key];
    return newObject;
  }, {});
}