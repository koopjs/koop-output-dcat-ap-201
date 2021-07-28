import { DcatDataset } from './dcat-dataset';
import { formatDcatDataset } from './dcat-formatters';

const dataset = {
  landingPage: 'https://jules-goes-the-distance-qa-pre-a-hub.hubqa.arcgis.com/',
  title: 'Jules Goes The Distance',
  description:
    'Create your own initiative by combining existing applications with a custom site. Use this initiative to form teams around a problem and invite your community to participate.',
  ownerUri: '',
  owner: 'jbartley',
  orgContactUrl: 'contact@funorg.com',
  orgTitle: '',
  language: 'eng',
  keyword: ['property', 'vacant', 'abandoned', 'revitalization'],
  metaProvenance: '',
  issuedDateTime: 1498771743000,
  url: 'https://sampleserver3.arcgisonline.com/arcgis/rest/services/Earthquakes/RecentEarthquakesRendered/MapServer/0',
  getDownloadUrl() {
    return 'foobar-url.com';
  },
  getOgcUrl: () => 'foobar-url.com',
} as unknown as DcatDataset;

describe('formatDcatDataset', () => {
  it('DCAT dataset has correct format', function () {
    const expectedResult = {
      '@type': 'dcat:Dataset',
      '@id': dataset.landingPage,
      'dct:title': dataset.title,
      'dct:description': dataset.description,
      'dcat:contactPoint': {
        '@id': dataset.ownerUri,
        '@type': 'Contact',
        'vcard:fn': dataset.owner,
        'vcard:hasEmail': dataset.orgContactUrl,
      },
      'dct:publisher': dataset.orgTitle,
      'dcat:theme': 'geospatial',
      'dct:accessRights': 'public',
      'dct:identifier': dataset.landingPage,
      'dct:language': {
        '@id': `lang:${dataset.language.toUpperCase()}`,
      },
      'dcat:keyword': dataset.keyword,
      'dct:provenance': dataset.provenance,
      'dct:issued': dataset.issuedDateTime,
    };
    const result = JSON.parse(formatDcatDataset(dataset));

    expect(result['@type']).toBe(expectedResult['@type']);
    expect(result['@id']).toBe(expectedResult['@id']);
    expect(result['dct:title']).toBe(expectedResult['dct:title']);
    expect(result['dct:description']).toBe(expectedResult['dct:description']);
    expect(result['dcat:contactPoint']).toEqual(
      expectedResult['dcat:contactPoint'],
    );
    expect(result['dct:publisher']).toBe(expectedResult['dct:publisher']);
    expect(result['dcat:theme']).toBe(expectedResult['dcat:theme']);
    expect(result['dct:accessRights']).toBe(expectedResult['dct:accessRights']);
    expect(result['dct:indentifier']).toBe(expectedResult['dct:indentifier']);
    expect(result['dct:language']).toEqual(expectedResult['dct:language']);
    expect(result['dcat:keyword']).toEqual(expectedResult['dcat:keyword']);
    expect(result['dct:provenance']).toBe(expectedResult['dct:provenance']);
    expect(result['dct:issued']).toBe(expectedResult['dct:issued']);
    expect(result['dcat:distribution']).toBeTruthy();
  });

  it('DCAT language node null if no language', function () {
    const withoutLanguage = { ...dataset, language: '' } as DcatDataset;
    const result = JSON.parse(formatDcatDataset(withoutLanguage));

    expect(result['dct:language']).toBe(null);
  });

  it('DCAT distributions have correct format', function () {
    const distDataset = {
      ...dataset,
      isFeatureLayer: true,
      hasGeometryType: true,
      supportsWFS: true,
      supportsWMS: true,
    } as DcatDataset;
    const expectedResult = {
      html: {
        '@type': 'dcat:Distribution',
        'dcat:accessUrl':
          'https://jules-goes-the-distance-qa-pre-a-hub.hubqa.arcgis.com/',
        'dct:format': {
          '@id': 'ftype:HTML',
        },
        'dct:description': 'Web Page',
        'dct:title': 'ArcGIS Hub Dataset',
      },
      restAPI: {
        '@type': 'dcat:Distribution',
        'dcat:accessUrl':
          'https://sampleserver3.arcgisonline.com/arcgis/rest/services/Earthquakes/RecentEarthquakesRendered/MapServer/0',
        'dct:format': {
          '@id': 'ftype:JSON',
        },
        'dct:description': 'Esri REST',
        'dct:title': 'ArcGIS GeoService',
      },
      geoJSON: {
        '@type': 'dcat:Distribution',
        'dcat:accessUrl': 'foobar-url.com',
        'dct:format': {
          '@id': 'ftype:GEOJSON',
        },
        'dct:description': 'GeoJSON',
        'dct:title': 'GeoJSON',
      },
      csv: {
        '@type': 'dcat:Distribution',
        'dcat:accessUrl': 'foobar-url.com',
        'dct:format': {
          '@id': 'ftype:CSV',
        },
        'dct:description': 'CSV',
        'dct:title': 'CSV',
      },
      wfs: {
        '@type': 'dcat:Distribution',
        'dcat:accessUrl': 'foobar-url.com',
        'dct:format': {
          '@id': 'ftype:WFS_SRVC',
        },
        'dct:description': 'OGC WFS',
        'dct:title': 'OGC WFS',
      },
      kml: {
        '@type': 'dcat:Distribution',
        'dcat:accessUrl': 'foobar-url.com',
        'dct:format': {
          '@id': 'ftype:KML',
        },
        'dct:description': 'KML',
        'dct:title': 'KML',
      },
      zip: {
        '@type': 'dcat:Distribution',
        'dcat:accessUrl': 'foobar-url.com',
        'dct:format': {
          '@id': 'ftype:ZIP',
        },
        'dct:description': 'Shapefile',
        'dct:title': 'ZIP',
      },
      wms: {
        '@type': 'dcat:Distribution',
        'dcat:accessUrl': 'foobar-url.com',
        'dct:format': {
          '@id': 'ftype:WMS_SRVC',
        },
        'dct:description': 'OGC WMS',
        'dct:title': 'OGC WMS',
      },
    };
    const result = JSON.parse(formatDcatDataset(distDataset));
    expect(result['dcat:distribution'][0]).toEqual(expectedResult.html);
    expect(result['dcat:distribution'][1]).toEqual(expectedResult.restAPI);
    expect(result['dcat:distribution'][2]).toEqual(expectedResult.geoJSON);
    expect(result['dcat:distribution'][3]).toEqual(expectedResult.csv);
    expect(result['dcat:distribution'][4]).toEqual(expectedResult.wfs);
    expect(result['dcat:distribution'][5]).toEqual(expectedResult.kml);
    expect(result['dcat:distribution'][6]).toEqual(expectedResult.zip);
    expect(result['dcat:distribution'][7]).toEqual(expectedResult.wms);
  });

  it('basic DCAT distributions are generated', function () {
    const result = JSON.parse(formatDcatDataset(dataset));
    const dist1 = result['dcat:distribution'][0]['dct:title'];
    const dist2 = result['dcat:distribution'][1]['dct:title'];

    expect(dist2).toBeTruthy();
    expect(dist1).toBe('ArcGIS Hub Dataset');
    expect(dist2).toBe('ArcGIS GeoService');
  });

  it('FeatureLayer DCAT distributions are generated', function () {
    const featureLayerDataset = {
      ...dataset,
      isFeatureLayer: true,
    } as DcatDataset;
    const result = JSON.parse(formatDcatDataset(featureLayerDataset));
    const dist1 = result['dcat:distribution'][2]['dct:title'];
    const dist2 = result['dcat:distribution'][3]['dct:title'];

    expect(dist2).toBeTruthy();
    expect(dist1).toBe('GeoJSON');
    expect(dist2).toBe('CSV');
  });

  it('FeatureLayer DCAT distributions with available geometryType are generated', function () {
    const featureLayerDataset = {
      ...dataset,
      isFeatureLayer: true,
      hasGeometryType: true,
    } as DcatDataset;
    const result = JSON.parse(formatDcatDataset(featureLayerDataset));
    const dist1 = result['dcat:distribution'][4]['dct:title'];
    const dist2 = result['dcat:distribution'][5]['dct:title'];

    expect(dist2).toBeTruthy();
    expect(dist1).toBe('KML');
    expect(dist2).toBe('ZIP');
  });

  it('DCAT distributions include WFS when supported', function () {
    const WFSDataset = { ...dataset, supportsWFS: true } as DcatDataset;
    const result = JSON.parse(formatDcatDataset(WFSDataset));
    const dist = result['dcat:distribution'][2]['dct:title'];

    expect(dist).toBeTruthy();
    expect(dist).toBe('OGC WFS');
  });

  it('DCAT distributions include WMS when supported', function () {
    const WMSDataset = { ...dataset, supportsWMS: true } as DcatDataset;
    const result = JSON.parse(formatDcatDataset(WMSDataset));
    const dist = result['dcat:distribution'][2]['dct:title'];

    expect(dist).toBeTruthy();
    expect(dist).toBe('OGC WMS');
  });
});
