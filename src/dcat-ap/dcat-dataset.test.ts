import { cloneObject } from '@esri/hub-common';
import { DcatDataset } from './dcat-dataset';

const datasetFromIndex = {
  _index: 'hub_qa_1625330584726',
  _type: '_doc',
  _id: 'cf479076dc0f4eaaa775fb3e03581f73_0',
  _score: null,
  _source: {
    server: { supportedExtensions: '', spatialReference: undefined },
    item: {
      owner: 'cityofx_adminqa',
      created: 1498771743000,
      culture: 'en-us',
      description: 'My fun dataset',
      title: 'Abandoned Property Parcels',
      type: 'Hub Page',
      typeKeywords: [
        'Hub',
        'hubPage',
        'JavaScript',
        'Map',
        'Mapping Site',
        'Online Map',
        'OpenData',
        'selfConfigured',
        'Web Map'
      ],
      tags: ['property', 'vacant', 'abandoned', 'revitalization']
    },
    default: {
      id: 'cf479076dc0f4eaaa775fb3e03581f73_0',
      url: 'https://gis.southbendin.gov/arcgis/rest/services/OpenData/VacantAbandoned/MapServer/0'
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
              'demo'
            ]
          },
          dataLang: {
            languageCode: {
              '@_value': 'ger'
            }
          },
          idCredit: 'Myndigheten för samhällsskydd och beredskap ( https://www.msb.se/ ); con terra ( https://www.conterra.de/); Esri (https://www.esri.com/en-us/arcgis/products/arcgis-for-inspire)',
          idCitation: {
            date: {
              pubDate: '2021-04-19T13:30:24.055-04:00'
            }
          }
        }
      }
    },
    org: {
      portalProperties: {
        links: {
          contactUs: {
            url: 'mailto:info@foobar.com'
          }
        }
      }
    },
    layer: { geometryType: 'esriGeometryPolygon' }
  },
  sort: [0]
}

const siteUrl = 'https://foobar.hub.arcgis.com'
const orgTitle = 'My Fun Org'
const portalUrl = 'https://my-fun-org.maps.arcgis.com'

it('DCAT DATASET: Dataset props come from right places', function() {
  const dataset = new DcatDataset(datasetFromIndex._source, portalUrl, orgTitle, siteUrl)

  expect(dataset.id).toBe('cf479076dc0f4eaaa775fb3e03581f73_0')
  expect(dataset.url).toBe(
    'https://gis.southbendin.gov/arcgis/rest/services/OpenData/VacantAbandoned/MapServer/0'
  )
  expect(dataset.landingPage).toBe(
    'https://foobar.hub.arcgis.com/datasets/cf479076dc0f4eaaa775fb3e03581f73_0'
  )
  expect(dataset.title).toBe('Abandoned Property Parcels')
  expect(dataset.description).toBe('My fun dataset')
  expect(dataset.owner).toBe('cityofx_adminqa')
  expect(dataset.ownerUri).toBe(
    'https://my-fun-org.maps.arcgis.com/sharing/rest/community/users/cityofx_adminqa?f=json'
  )
  expect(dataset.language).toBe('ger')
  expect(dataset.keyword).toEqual([
    'Test',
    'INSPIRE',
    'Administrative and social governmental services',
    'US',
    'firestations',
    'demo'
  ])
  expect(dataset.issuedDateTime).toBe('2021-04-19T13:30:24.055-04:00')
  expect(dataset.orgTitle).toBe('My Fun Org')
  expect(dataset.orgContactUrl).toBe('mailto:info@foobar.com')
  expect(dataset.metaProvenance).toBe(
    'Myndigheten för samhällsskydd och beredskap ( https://www.msb.se/ ); con terra ( https://www.conterra.de/); Esri (https://www.esri.com/en-us/arcgis/products/arcgis-for-inspire)'
  )
})

it('DCAT DATASET: non-metadata fallbacks', function() {
  const noMetadata = cloneObject(datasetFromIndex)
  delete noMetadata._source.metadata

  const dataset = new DcatDataset(noMetadata._source, portalUrl, orgTitle, siteUrl)

  expect(dataset.language).toBe('eng')
  expect(dataset.keyword).toEqual(['property', 'vacant', 'abandoned', 'revitalization'])
  expect(dataset.issuedDateTime).toBe('2017-06-29T21:29:03.000Z')
})

it('DCAT DATASET: Hub Page has default keyword when tags has empty string', function() {
  const noMetadata = cloneObject(datasetFromIndex)
  delete noMetadata._source.metadata
  noMetadata._source.item.tags = ['']

  const dataset = new DcatDataset(noMetadata._source, portalUrl, orgTitle, siteUrl)

  const expectedKeyword = 'ArcGIS Hub page'

  expect(dataset.keyword[0]).toBe(expectedKeyword)
})

it('DCAT DATASET: Hub Page has default keyword when tags is empty', function() {
  const noMetadata = cloneObject(datasetFromIndex)
  delete noMetadata._source.metadata
  noMetadata._source.item.tags = []

  const dataset = new DcatDataset(noMetadata._source, portalUrl, orgTitle, siteUrl)

  const expectedKeyword = 'ArcGIS Hub page'

  expect(dataset.keyword[0]).toBe(expectedKeyword)
})

it('DCAT DATASET: Hub Page has default keyword when tags is undefined', function() {
  const noMetadata = cloneObject(datasetFromIndex)
  delete noMetadata._source.metadata
  noMetadata._source.item.tags = undefined

  const dataset = new DcatDataset(noMetadata._source, portalUrl, orgTitle, siteUrl)

  const expectedKeyword = 'ArcGIS Hub page'

  expect(dataset.keyword[0]).toBe(expectedKeyword)
})

it('DCAT DATASET: getDownloadUrl', function() {
  const noSR = cloneObject(datasetFromIndex)
  const withSR = cloneObject(datasetFromIndex)

  withSR._source.server.spatialReference = {
    wkid: 4325,
    latestWkid: 8374
  }

  const datasetNoSR = new DcatDataset(noSR._source, portalUrl, orgTitle, siteUrl)
  const datasetSR = new DcatDataset(withSR._source, portalUrl, orgTitle, siteUrl)

  expect(datasetNoSR.getDownloadUrl('geojson')).toBe(
    'https://foobar.hub.arcgis.com/datasets/cf479076dc0f4eaaa775fb3e03581f73_0.geojson'
  )
  expect(datasetSR.getDownloadUrl('csv')).toBe(
    'https://foobar.hub.arcgis.com/datasets/cf479076dc0f4eaaa775fb3e03581f73_0.csv?outSR=%7B%22latestWkid%22%3A8374%2C%22wkid%22%3A4325%7D'
  )
})

it('DCAT DATASET: getOgcUrl', function() {
  const dataset = new DcatDataset(datasetFromIndex._source, portalUrl, orgTitle, siteUrl)

  expect(dataset.getOgcUrl()).toBe(
    'https://gis.southbendin.gov/arcgis/services/OpenData/VacantAbandoned/MapServer/WMSServer?request=GetCapabilities&service=WMS'
  )
  expect(dataset.getOgcUrl('WFS')).toBe(
    'https://gis.southbendin.gov/arcgis/services/OpenData/VacantAbandoned/MapServer/WFSServer?request=GetCapabilities&service=WFS'
  )
})

it('DCAT DATASET: getOgcUrl', function() {
  const dataset = new DcatDataset(datasetFromIndex._source, portalUrl, orgTitle, siteUrl)

  expect(dataset.getOgcUrl()).toBe(
    'https://gis.southbendin.gov/arcgis/services/OpenData/VacantAbandoned/MapServer/WMSServer?request=GetCapabilities&service=WMS'
  )
  expect(dataset.getOgcUrl('WFS')).toBe(
    'https://gis.southbendin.gov/arcgis/services/OpenData/VacantAbandoned/MapServer/WFSServer?request=GetCapabilities&service=WFS'
  )
})

it('DCAT DATASET: correctly reports WFS/WMS support', function() {
  const supportsWFS = cloneObject(datasetFromIndex)
  const supportsWMS = cloneObject(datasetFromIndex)

  supportsWFS._source.server.supportedExtensions = 'WFSServer'
  supportsWMS._source.server.supportedExtensions = 'WMSServer'

  const datasetWFS = new DcatDataset(supportsWFS._source, portalUrl, orgTitle, siteUrl)
  const datasetWMS = new DcatDataset(supportsWMS._source, portalUrl, orgTitle, siteUrl)

  expect(datasetWFS.supportsWFS).toBeTruthy()
  expect(datasetWFS.supportsWMS).toBeFalsy()

  expect(datasetWMS.supportsWMS).toBeTruthy()
  expect(datasetWMS.supportsWFS).toBeFalsy()
})
