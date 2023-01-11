import * as _ from 'lodash';
import { IItem } from '@esri/arcgis-rest-portal';
import {
  cloneObject,
  IDomainEntry,
  IModel,
} from '@esri/hub-common';
import { readableFromArray, streamToString } from '../test-helpers/stream-utils';
import { getDataStreamDcatAp201 } from './';
import * as datasetFromApi from '../test-helpers/mock-dataset.json';

async function generateDcatFeed(
  domainRecord,
  siteItem,
  datasets,
  orgBaseUrl = 'https://qa-pre-a-hub.mapsqa.arcgis.com',
  customFormatTemplate?
) {
  const { dcatStream, dependencies } = getDataStreamDcatAp201({
    domainRecord, 
    orgBaseUrl, 
    customFormatTemplate,
    siteModel: { item: siteItem } as unknown as IModel,
    siteUrl: siteItem.url // item.url isn't always accurate, but works for this test
  });

  const docStream = readableFromArray(datasets); // no datasets since we're just checking the catalog
  const feedString = await streamToString(docStream.pipe(dcatStream));
  return { feed: JSON.parse(feedString), dependencies };
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

describe('generating DCAT-AP 2.0.1 feed', () => {
  it('DCAT catalog formatted correctly', async function () {
    const { feed } = await generateDcatFeed(domainRecord, siteItem, []);

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
    const { feed } = await generateDcatFeed(domainRecord, siteItem, [
      datasetFromApi,
    ]);

    const chk1 = feed['dcat:dataset'][0];

    expect(chk1['dcat:keyword']).toEqual([
      'some',
      'keywords',
      'from',
      'metadata'
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
    const datasetWithoutMetadata = cloneObject(datasetFromApi);
    delete datasetWithoutMetadata.metadata;

    const { feed } = await generateDcatFeed(domainRecord, siteItem, [
      datasetWithoutMetadata,
    ]);

    const chk1 = feed['dcat:dataset'][0];

    expect(chk1['dcat:keyword']).toEqual([
      'Data collection',
      'just modified'
    ]);

    expect(chk1['dct:issued']).toBe('2021-01-29T15:34:38.000Z');

    expect(chk1['dct:language']).toEqual({
      '@id': 'lang:ENG',
    });
  });

  it('DCAT feed uses org base URL', async function () {
    const { feed: feedProd } = await generateDcatFeed(
      domainRecord,
      siteItem,
      [datasetFromApi],
      'https://qa-pre-a-hub.mapsdev.arcgis.com',
    );
    expect(feedProd['dct:creator']['@id']).toBe(
      'https://qa-pre-a-hub.mapsdev.arcgis.com',
    );
    expect(
      new URL(feedProd['dcat:dataset'][0]['dcat:contactPoint']['@id']).hostname,
    ).toBe('qa-pre-a-hub.mapsdev.arcgis.com');
  });

  it('respects dcat customizations of overwritable attributes', async () => {
    const { feed } = await generateDcatFeed(
      domainRecord, 
      siteItem, 
      [ datasetFromApi ],
      'https://qa-pre-a-hub.mapsqa.arcgis.com',
      {
        'dct:title': 'A Nifty Title', // overwrite existing
        'dct:new-attr': 'New Value', // new attribute
      } 
    );

    const chk1 = feed['dcat:dataset'][0];

    expect(chk1['@type']).toEqual('dcat:Dataset');
    expect(chk1['@id']).toEqual('https://jules-goes-the-distance-qa-pre-a-hub.hubqa.arcgis.com/datasets/qa-pre-a-hub::tahoe-places-of-interest');
    expect(chk1['dct:title']).toEqual('A Nifty Title');
    expect(chk1['dct:description']).toEqual('Description. Here be Tahoe things. You can do a lot here. Here are some more words. And a few more.<div><br /></div><div>with more words</div><div><br /></div><div>adding a few more to test how long it takes for our jobs to execute.</div><div><br /></div><div>Tom was here!</div>');
    expect(chk1['dcat:contactPoint']).toStrictEqual({
      '@id': 'https://qa-pre-a-hub.mapsqa.arcgis.com/sharing/rest/community/users/thervey_qa_pre_a_hub?f=json',
      '@type': 'Contact',
      'vcard:fn': 'thervey_qa_pre_a_hub',
      'vcard:hasEmail': 'mailto:email@service.com',
    });
    expect(chk1['dct:publisher']).toEqual('QA Premium Alpha Hub');
    expect(chk1['dcat:theme']).toEqual('geospatial');
    expect(chk1['dct:accessRights']).toEqual('public');
    expect(chk1['dct:identifier']).toEqual('https://www.arcgis.com/home/item.html?id=f4bcc1035b7d46cba95e977f4affb6be&sublayer=0');
    expect(chk1['dcat:keyword']).toEqual(['some', 'keywords', 'from', 'metadata']);
    expect(chk1['dct:provenance']).toEqual('Myndigheten för samhällsskydd och beredskap ( https://www.msb.se/ ); con terra ( https://www.conterra.de/); Esri (https://www.esri.com/en-us/arcgis/products/arcgis-for-inspire)');
    expect(chk1['dct:issued']).toEqual('2021-04-19T13:30:24.055-04:00');
    expect(chk1['dct:language']).toStrictEqual({ '@id': 'lang:GER' });
    expect(chk1['dct:new-attr']).toEqual('New Value');
  });

  it('scrubs dcat customization of protected fields', async () => {
    const { feed } = await generateDcatFeed(
      domainRecord, 
      siteItem, 
      [datasetFromApi],
      'https://qa-pre-a-hub.mapsqa.arcgis.com',
      {
        '@type': '{{ Type Injection }}',
        '@id': '{{ Id Injection }}',
        'dcat:contactPoint': {
          '@id': '{{ Contact Point Id Injection }}',
          '@type': '{{ Contact Point Type Injection }}',
          "vcard:fn": "{{ owner }}", // default value
          "vcard:hasEmail": "{{ orgContactEmail }}", // default value
        },
        'dct:publisher': '{{ Publisher Injection }}',
        'dcat:theme': '{{ Theme Injection }}',
        'dct:accessRights': '{{ Access Rights Injection }}',
        'dcat:keyword': '{{ Keyword Injection }}',
        'dct:provenance': '{{ Provenance Injection }}',
        'dct:issued': '{{ Issued Injection}}',
        'dct:language': '{{ Language Injection }}',
        'dcat:distribution': '{{ Distribution Injection }}',
      }
    );

    const chk1 = feed['dcat:dataset'][0];

    expect(chk1['@type']).toEqual('dcat:Dataset');
    expect(chk1['@id']).toEqual('https://jules-goes-the-distance-qa-pre-a-hub.hubqa.arcgis.com/datasets/qa-pre-a-hub::tahoe-places-of-interest');
    expect(chk1['dct:title']).toEqual('Tahoe places of interest');
    expect(chk1['dct:description']).toEqual('Description. Here be Tahoe things. You can do a lot here. Here are some more words. And a few more.<div><br /></div><div>with more words</div><div><br /></div><div>adding a few more to test how long it takes for our jobs to execute.</div><div><br /></div><div>Tom was here!</div>');
    expect(chk1['dcat:contactPoint']).toStrictEqual({
      '@id': 'https://qa-pre-a-hub.mapsqa.arcgis.com/sharing/rest/community/users/thervey_qa_pre_a_hub?f=json',
      '@type': 'Contact',
      'vcard:fn': 'thervey_qa_pre_a_hub',
      'vcard:hasEmail': 'mailto:email@service.com',
    });
    expect(chk1['dct:publisher']).toEqual('QA Premium Alpha Hub');
    expect(chk1['dcat:theme']).toEqual('geospatial');
    expect(chk1['dct:accessRights']).toEqual('public');
    expect(chk1['dct:identifier']).toEqual('https://www.arcgis.com/home/item.html?id=f4bcc1035b7d46cba95e977f4affb6be&sublayer=0');
    expect(chk1['dcat:keyword']).toEqual(['some', 'keywords', 'from', 'metadata']);
    expect(chk1['dct:provenance']).toEqual('Myndigheten för samhällsskydd och beredskap ( https://www.msb.se/ ); con terra ( https://www.conterra.de/); Esri (https://www.esri.com/en-us/arcgis/products/arcgis-for-inspire)');
    expect(chk1['dct:issued']).toEqual('2021-04-19T13:30:24.055-04:00');
    expect(chk1['dct:language']).toStrictEqual({ '@id': 'lang:GER' });
  });


  it('replaces values of protected fields with an empty string if adlib returns the templated literal', async () => {
    const clonedDataset = cloneObject(datasetFromApi);
    _.set(clonedDataset, 'metadata.metadata.dataIdInfo.idCredit', undefined);

    const { feed } = await generateDcatFeed(
      domainRecord, 
      siteItem, 
      [clonedDataset],
      'https://qa-pre-a-hub.mapsqa.arcgis.com',
      {
        '@type': '{{ Type Injection }}',
        '@id': '{{ Id Injection }}',
        'dcat:contactPoint': {
          '@id': '{{ Contact Point Id Injection }}',
          '@type': '{{ Contact Point Type Injection }}',
          "vcard:fn": "{{ owner }}", // default value
          "vcard:hasEmail": "{{ orgContactEmail }}", // default value
        },
        'dct:publisher': '{{ Publisher Injection }}',
        'dcat:theme': '{{ Theme Injection }}',
        'dct:accessRights': '{{ Access Rights Injection }}',
        'dcat:keyword': '{{ Keyword Injection }}',
        'dct:provenance': '{{ Provenance Injection }}',
        'dct:issued': '{{ Issued Injection }}',
        'dct:language': '{{ Language Injection }}',
        'dcat:distribution': '{{ Distribution Injection }}',
      }
    );

    const chk1 = feed['dcat:dataset'][0];

    expect(chk1['@type']).toEqual('dcat:Dataset');
    expect(chk1['@id']).toEqual('https://jules-goes-the-distance-qa-pre-a-hub.hubqa.arcgis.com/datasets/qa-pre-a-hub::tahoe-places-of-interest');
    expect(chk1['dct:title']).toEqual('Tahoe places of interest');
    expect(chk1['dct:description']).toEqual('Description. Here be Tahoe things. You can do a lot here. Here are some more words. And a few more.<div><br /></div><div>with more words</div><div><br /></div><div>adding a few more to test how long it takes for our jobs to execute.</div><div><br /></div><div>Tom was here!</div>');
    expect(chk1['dcat:contactPoint']).toStrictEqual({
      '@id': 'https://qa-pre-a-hub.mapsqa.arcgis.com/sharing/rest/community/users/thervey_qa_pre_a_hub?f=json',
      '@type': 'Contact',
      'vcard:fn': 'thervey_qa_pre_a_hub',
      'vcard:hasEmail': 'mailto:email@service.com',
    });
    expect(chk1['dct:publisher']).toEqual('QA Premium Alpha Hub');
    expect(chk1['dcat:theme']).toEqual('geospatial');
    expect(chk1['dct:accessRights']).toEqual('public');
    expect(chk1['dct:identifier']).toEqual('https://www.arcgis.com/home/item.html?id=f4bcc1035b7d46cba95e977f4affb6be&sublayer=0');
    expect(chk1['dcat:keyword']).toEqual(['some', 'keywords', 'from', 'metadata']);
    expect(chk1['dct:provenance']).toEqual('');
    expect(chk1['dct:issued']).toEqual('2021-04-19T13:30:24.055-04:00');
    expect(chk1['dct:language']).toStrictEqual({ '@id': 'lang:GER' });
  });

  it('reports default dependencies when no custom format provided', async () => {
    const expected = [
      'id',
      'access',
      'size',
      'slug',
      'url',
      'owner',
      'name',
      'type',
      'typeKeywords',
      'tags',
      'description',
      'culture',
      'created',
      'modified',
      'metadata',
      'server',
      'geometryType',
      'orgContactEmail'
    ];
    const { dependencies } = await generateDcatFeed(domainRecord, siteItem, [datasetFromApi]);
    
    expect(dependencies).toEqual(expect.arrayContaining(expected));
    expect(dependencies.length).toBe(expected.length);
  });

  it('reports custom dependencies when custom format provided', async () => {
    const expected = [
      'id',
      'access',
      'size',
      'slug',
      'url',
      'owner',
      'name',
      'type',
      'typeKeywords',
      'tags',
      'description',
      'culture',
      'created',
      'metadata',
      'server',
      'modified',
      'geometryType',
      'orgContactEmail',
      'modified.property.path',
      'new.property.path'
    ];
    const { dependencies } = await generateDcatFeed(
      domainRecord, 
      siteItem, 
      [datasetFromApi],
      'https://qa-pre-a-hub.mapsqa.arcgis.com',
      { 
        'dct:title': '{{modified.property.path}}', // Modify default
        property: '{{new.property.path}}' // Add new attribute
      }
    );
    
    expect(dependencies).toEqual(expect.arrayContaining(expected));
    expect(dependencies.length).toBe(expected.length);
  });
});
