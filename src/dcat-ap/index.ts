import { FeedFormatterStream } from './feed-formatter-stream';
import { TransformsList } from 'adlib';
import { compileDcatFeedEntry } from './compile-dcat-feed';
import {
  DEFAULT_CATALOG_HEADER_2X,
  DEFAULT_CATALOG_HEADER_3X,
} from './constants/headers';

const FOOTER = '\n\t]\n}';

export function getDataStreamDcatAp(
  feedTemplate: any,
  feedTemplateTransforms: TransformsList,
  version: string = undefined,
) {
  const { header: templateHeader, ...restFeedTemplate } = feedTemplate;

  const streamFormatter = (chunk) => {
    return compileDcatFeedEntry(
      chunk,
      restFeedTemplate,
      feedTemplateTransforms,
    );
  };

  const streamHeader = getStreamHeader(templateHeader, version);

  return {
    dcatStream: new FeedFormatterStream(
      streamHeader,
      FOOTER,
      ',\n',
      streamFormatter,
    ),
  };
}

function getStreamHeader(templateHeader, version: string): string {
  if (version === undefined || version.startsWith('2.')) {
    const feedHeader = JSON.stringify(
      { ...DEFAULT_CATALOG_HEADER_2X, ...templateHeader },
      null,
      '\t',
    );
    return `${feedHeader.substring(
      0,
      feedHeader.length - 2,
    )},\n\t"dcat:dataset": [\n`;
  } else if (version === '3.0.0') {
    const feedHeader = JSON.stringify(
      { ...DEFAULT_CATALOG_HEADER_3X, ...templateHeader },
      null,
      '\t',
    );
    return `${feedHeader.substring(
      0,
      feedHeader.length - 2,
    )},\n\t"dcat:dataset": [\n`;
  }
  throw new Error('unsupported dcat ap version header');
}
