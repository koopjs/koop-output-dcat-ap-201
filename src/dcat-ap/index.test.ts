import { IItem } from '@esri/arcgis-rest-portal';
import {
  cloneObject,
  deleteProp,
  getProp,
  IDomainEntry,
} from '@esri/hub-common';
import { readableFromArray, streamToString } from './stream-utils';
import { getDataStreamDcat201 } from './';

function generateDcatFeed(
  domainRecord,
  siteItem,
  datasets,
  env: 'dev' | 'qa' | 'prod' = 'qa',
) {
  const dcatStream = getDataStreamDcat201({ domainRecord, siteItem, env });

  const docStream = readableFromArray(datasets); // no datasets since we're just checking the catalog

  return streamToString(docStream.pipe(dcatStream)).then(JSON.parse);
}

const domainRecord: IDomainEntry = {
  clientKey: 'auynr75n0omNEZ8u',
  createdAt: '2021-05-18T14:54:46.174Z',
  hostname: 'jules-goes-the-distance-qa-pre-a-hub.hubqa.arcgis.com',
  id: '415379',
  orgId: 'Xj56SBi2udA78cC9',
  orgKey: 'qa-pre-a-hub',
  orgTitle: 'QA Premium Alpha Hub',
  permanentRedirect: false,
  siteId: '884d15dd172c4040b1ed49c0b67b9fff',
  siteTitle: 'Jules Goes The Distance',
  sslOnly: true,
  updatedAt: '2021-05-18T14:54:46.174Z',
};

const siteItem: IItem = {
  id: '884d15dd172c4040b1ed49c0b67b9fff',
  owner: 'qa_pre_a_hub_admin',
  created: 1621349684000,
  isOrgItem: true,
  modified: 1621354324000,
  guid: null,
  name: null,
  title: 'Jules Goes The Distance',
  type: 'Hub Site Application',
  typeKeywords: [
    'Hub',
    'hubSite',
    'hubSolution',
    'JavaScript',
    'Map',
    'Mapping Site',
    'Online Map',
    'OpenData',
    'Ready To Use',
    'selfConfigured',
    'source-934d07d3f163470ab9125e585a0f59fe',
    'source-undefined',
    'Web Map',
    'Registered App',
  ],
  description:
    'Create your own initiative by combining existing applications with a custom site. Use this initiative to form teams around a problem and invite your community to participate.',
  tags: ['Hub Site'],
  snippet:
    "I love front end development and everyone I've met as Esri so far has been really nice and pleasant and I am excited to get to know everyone better yes",
  thumbnail: null,
  documentation: null,
  extent: [],
  categories: [],
  spatialReference: null,
  accessInformation: null,
  licenseInfo: null,
  culture: 'ba-ei',
  properties: {
    schemaVersion: 1.4,
    children: [],
    collaborationGroupId: 'd8ae262d6e524c64965b3906fb8947cf',
    contentGroupId: '879d8747fa58421f91b3110210d46af2',
    followersGroupId: '1d1d555aabdf41fab2ee5b638e3ee504',
    parentInitiativeId: 'fc1e8cde86d443079e8c5dbb200f78f2',
    parentId: '2098f09abe314cfaa0319be9a6245790',
  },
  advancedSettings: null,
  url: 'https://jules-goes-the-distance-qa-pre-a-hub.hubqa.arcgis.com',
  proxyFilter: null,
  access: 'shared',
  size: -1,
  subInfo: 0,
  appCategories: [],
  industries: [],
  languages: [],
  largeThumbnail: null,
  banner: null,
  screenshots: [],
  listed: false,
  ownerFolder: '6d22b9f922074ac4bec7c16ac3c48127',
  protected: true,
  numComments: 0,
  numRatings: 0,
  avgRating: 0,
  numViews: 71,
  scoreCompleteness: 45,
  groupDesignations: null,
  contentOrigin: 'self',
};

const datasetFromIndex = {
  _index: 'hub_qa_1625330584726',
  _type: '_doc',
  _id: 'cf479076dc0f4eaaa775fb3e03581f73_0',
  _score: null,
  _source: {
    server: { supportedExtensions: '' },
    item: {
      owner: 'cityofx_adminqa',
      created: 1498771743000,
      culture: 'en-us',
      description: null,
      title: 'Abandoned Property Parcels',
      tags: ['property', 'vacant', 'abandoned', 'revitalization'],
    },
    default: {
      id: 'cf479076dc0f4eaaa775fb3e03581f73_0',
      url: 'https://gis.southbendin.gov/arcgis/rest/services/OpenData/VacantAbandoned/MapServer/0',
    },
    metadata: {
      metadata: {
        dataIdInfo: {
          searchKeys: {
            keyword: [
              'Test',
              'INSPIRE',
              'Administrative and social governmental services',
              'US',
              'firestations',
              'demo',
            ],
          },
          dataLang: {
            languageCode: {
              '@_value': 'ger',
            },
          },
          idCredit:
            'Myndigheten för samhällsskydd och beredskap ( https://www.msb.se/ ); con terra ( https://www.conterra.de/); Esri (https://www.esri.com/en-us/arcgis/products/arcgis-for-inspire)',
          idCitation: {
            date: {
              pubDate: '2021-04-19T13:30:24.055-04:00',
            },
          },
        },
      },
    },
    org: {
      portalProperties: {
        links: {
          contactUs: {
            url: 'mailto:info@foobar.com',
          },
        },
      },
    },
    layer: { geometryType: 'esriGeometryPolygon' },
  },
  sort: [0],
};

describe('generating DCAT-AP 2.0.1 feed', () => {
  it('DCAT catalog formatted correctly', async function () {
    const feed = await generateDcatFeed(domainRecord, siteItem, []);

    expect(feed['@context']).toEqual({
      dcat: 'http://www.w3.org/ns/dcat#',
      dct: 'http://purl.org/dc/terms/',
      foaf: 'http://xmlns.com/foaf/0.1/',
      vcard: 'http://www.w3.org/2006/vcard/ns#',
      ftype: 'http://publications.europa.eu/resource/authority/file-type/',
      lang: 'http://publications.europa.eu/resource/authority/language/',
    });

    expect(feed['@id']).toBe(siteItem.url);
    expect(feed['@type']).toBe('dcat:Catalog');
    expect(feed['dct:description']).toBe(siteItem.description);
    expect(feed['dct:title']).toBe(siteItem.title);
    expect(feed['dct:publisher']).toBe(domainRecord.orgTitle);
    expect(feed['foaf:homepage']).toEqual({
      'foaf:Document': `${siteItem.url}/search`,
    });
    expect(feed['dct:language']).toEqual({
      '@id': 'lang:BAK',
    });
    expect(feed['dct:creator']).toEqual({
      '@id': 'https://qa-pre-a-hub.mapsqa.arcgis.com',
      '@type': 'foaf:Agent',
      'foaf:name': domainRecord.orgTitle,
    });
    expect(Array.isArray(feed['dcat:dataset'])).toBeTruthy();
    expect(feed['dcat:dataset'].length).toBe(0);
  });

  it('DCAT dataset prefers metadata when available', async function () {
    const feed = await generateDcatFeed(domainRecord, siteItem, [
      datasetFromIndex,
    ]);

    const chk1 = feed['dcat:dataset'][0];

    expect(chk1['dcat:keyword']).toEqual([
      'Test',
      'INSPIRE',
      'Administrative and social governmental services',
      'US',
      'firestations',
      'demo',
    ]);

    expect(chk1['dct:provenance']).toBe(
      'Myndigheten för samhällsskydd och beredskap ( https://www.msb.se/ ); con terra ( https://www.conterra.de/); Esri (https://www.esri.com/en-us/arcgis/products/arcgis-for-inspire)',
    );

    expect(chk1['dct:issued']).toBe('2021-04-19T13:30:24.055-04:00');

    expect(chk1['dct:language']).toEqual({
      '@id': 'lang:GER',
    });
  });

  it('DCAT dataset has defaults when metadata not available', async function () {
    const datasetWithoutMetadata = cloneObject(datasetFromIndex);
    delete datasetWithoutMetadata._source.metadata;

    const feed = await generateDcatFeed(domainRecord, siteItem, [
      datasetWithoutMetadata,
    ]);

    const chk1 = feed['dcat:dataset'][0];

    expect(chk1['dcat:keyword']).toEqual([
      'property',
      'vacant',
      'abandoned',
      'revitalization',
    ]);

    expect(chk1['dct:provenance']).toBe(null);

    expect(chk1['dct:issued']).toBe('2017-06-29T21:29:03.000Z');

    expect(chk1['dct:language']).toEqual({
      '@id': 'lang:ENG',
    });
  });

  it('DCAT dataset attributes default to null where values not available', async function () {
    // define a few mappings to check
    const mappings = [
      [
        'org.portalProperties.links.contactUs.url',
        'dcat:contactPoint.vcard:hasEmail',
      ],
      ['metadata.metadata.dataIdInfo.idCredit', 'dct:provenance'],
      ['item.title', 'dct:title'],
    ];

    const partialDataset = cloneObject(datasetFromIndex);

    // remove props
    for (const mapping of mappings) {
      deleteProp(partialDataset._source, mapping[0]);
    }

    const feed = await generateDcatFeed(domainRecord, siteItem, [
      partialDataset,
    ]);

    const dcatDataset = feed['dcat:dataset'][0];

    for (const mapping of mappings) {
      expect(getProp(dcatDataset, mapping[1])).toBe(null);
    }
  });

  it('DCAT feed responds to AGO environment', async function () {
    const feedDev = await generateDcatFeed(
      domainRecord,
      siteItem,
      [datasetFromIndex],
      'dev',
    );
    expect(feedDev['dct:creator']['@id']).toBe(
      'https://qa-pre-a-hub.mapsdev.arcgis.com',
    );
    expect(
      new URL(feedDev['dcat:dataset'][0]['dcat:contactPoint']['@id']).hostname,
    ).toBe('qa-pre-a-hub.mapsdev.arcgis.com');

    const feedQa = await generateDcatFeed(
      domainRecord,
      siteItem,
      [datasetFromIndex],
      'qa',
    );
    expect(feedQa['dct:creator']['@id']).toBe(
      'https://qa-pre-a-hub.mapsqa.arcgis.com',
    );
    expect(
      new URL(feedQa['dcat:dataset'][0]['dcat:contactPoint']['@id']).hostname,
    ).toBe('qa-pre-a-hub.mapsqa.arcgis.com');

    const feedProd = await generateDcatFeed(
      domainRecord,
      siteItem,
      [datasetFromIndex],
      'prod',
    );
    expect(feedProd['dct:creator']['@id']).toBe(
      'https://qa-pre-a-hub.maps.arcgis.com',
    );
    expect(
      new URL(feedProd['dcat:dataset'][0]['dcat:contactPoint']['@id']).hostname,
    ).toBe('qa-pre-a-hub.maps.arcgis.com');
  });
});
