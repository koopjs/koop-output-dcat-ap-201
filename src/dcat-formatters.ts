import { IItem } from '@esri/arcgis-rest-portal';
import { IDomainEntry } from '@esri/hub-common';
import { DcatDataset } from './dcat-dataset';
import alpha2ToAlpha3Langs from './languages';

/**
 * Takes a locale (e.g. "en-us") and returns an
 * ISO 639-2 language code.
 */
export function localeToLang(locale: string) {
  return alpha2ToAlpha3Langs[locale.split('-')[0]];
}

/**
 * Formats a single dataset object as a 'dcat:Dataset'
 */
export function formatDcatDataset(dataset: DcatDataset) {
  const dcatDataset = {
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
    'dcat:theme': 'geospatial', // TODO update this to use this vocabulary http://publications.europa.eu/resource/authority/data-theme
    'dct:accessRights': 'public',
    'dct:identifier': dataset.landingPage,
    'dct:language': null,
    'dcat:keyword': dataset.keyword,
    'dct:provenance': dataset.metaProvenance, // won't be available if not INSPIRE metadata
    'dct:issued': dataset.issuedDateTime,
    'dcat:distribution': generateDistributions(dataset),
  };

  if (dataset.language) {
    dcatDataset['dct:language'] = {
      '@id': `lang:${dataset.language.toUpperCase()}`,
    };
  }

  return indent(JSON.stringify(dcatDataset, null, '\t'), 2);
}

export interface ICatalogOptions {
  siteItem: IItem,
  domainRecord: IDomainEntry,
  portalUrl: string
}

/**
 * Formats a "dcat:Catalog"
 */
export function formatDcatCatalog({ siteItem, domainRecord, portalUrl }: ICatalogOptions) {
  const catalog = {
    '@context': {
      dcat: 'http://www.w3.org/ns/dcat#',
      dct: 'http://purl.org/dc/terms/',
      foaf: 'http://xmlns.com/foaf/0.1/',
      vcard: 'http://www.w3.org/2006/vcard/ns#',
      ftype: 'http://publications.europa.eu/resource/authority/file-type/',
      lang: 'http://publications.europa.eu/resource/authority/language/',
    },
    '@id': siteItem.url,
    '@type': 'dcat:Catalog',
    'dct:description': siteItem.description,
    'dct:title': siteItem.title,
    'dct:publisher': domainRecord.orgTitle,
    'foaf:homepage': {
      'foaf:Document': `${siteItem.url}/search`,
    },
    'dct:language': {
      '@id': `lang:${localeToLang(siteItem.culture).toUpperCase()}`,
    },
    'dct:creator': {
      '@id': portalUrl,
      '@type': 'foaf:Agent',
      'foaf:name': domainRecord.orgTitle,
    },
  };

  return JSON.stringify(catalog, null, '\t');
}

function indent(str: string, nTabs = 1) {
  const tabs = new Array(nTabs).fill('\t').join('');
  return tabs + str.replace(/\n/g, `\n${tabs}`);
}

/**
 * Generates appropriate distributions
 *
 * All `dct:format` attributes need to be an IRI node with an IRI from
 * this list: http://publications.europa.eu/resource/authority/file-type
 *
 * See https://github.com/SEMICeu/dcat-ap_shacl/blob/master/shacl/dcat-ap-mdr-vocabularies.shapes.ttl
 * for validations.
 */
function generateDistributions(dataset: DcatDataset) {
  const distributionFns = [];

  // always add the Hub landing page
  distributionFns.push(getHubLandingPageDistribution);
  distributionFns.push(getEsriRESTDistribution);

  if (dataset.isFeatureLayer) {
    distributionFns.push(getGeoJSONDistribution);
    distributionFns.push(getCSVDistribution);
  }

  if (dataset.supportsWFS) {
    distributionFns.push(getOGCWFSDistribution);
  }

  if (dataset.isFeatureLayer && dataset.hasGeometryType) {
    distributionFns.push(getKMLDistribution);
    distributionFns.push(getShapefileDistribution);
  }

  if (dataset.supportsWMS) {
    distributionFns.push(getOGCWMSDistribution);
  }

  return distributionFns.map((fn) => fn(dataset));
}

/**
 * Generates the distribution for the Hub landing page
 */
function getHubLandingPageDistribution(dataset: DcatDataset) {
  return {
    '@type': 'dcat:Distribution',
    'dcat:accessUrl': dataset.landingPage,
    'dct:format': {
      '@id': 'ftype:HTML',
    },
    'dct:description': 'Web Page',
    'dct:title': 'ArcGIS Hub Dataset',
  };
}

/**
 * Generates the distribution for the Esri Rest API
 */
function getEsriRESTDistribution(dataset: DcatDataset) {
  return {
    '@type': 'dcat:Distribution',
    'dcat:accessUrl': dataset.url,
    'dct:format': {
      '@id': 'ftype:JSON',
    },
    'dct:description': 'Esri REST',
    'dct:title': 'ArcGIS GeoService',
  };
}

/**
 * Generates the distribution for geoJSON
 */
function getGeoJSONDistribution(dataset: DcatDataset) {
  return {
    '@type': 'dcat:Distribution',
    'dcat:accessUrl': dataset.getDownloadUrl('geojson'),
    'dct:format': {
      '@id': 'ftype:GEOJSON',
    },
    'dct:description': 'GeoJSON',
    'dct:title': 'GeoJSON',
  };
}

/**
 * Generates the distribution for CSV
 */
function getCSVDistribution(dataset: DcatDataset) {
  return {
    '@type': 'dcat:Distribution',
    'dcat:accessUrl': dataset.getDownloadUrl('csv'),
    'dct:format': {
      '@id': 'ftype:CSV',
    },
    'dct:description': 'CSV',
    'dct:title': 'CSV',
  };
}

/**
 * Generates the distribution for KML
 */
function getKMLDistribution(dataset: DcatDataset) {
  return {
    '@type': 'dcat:Distribution',
    'dcat:accessUrl': dataset.getDownloadUrl('kml'),
    'dct:format': {
      '@id': 'ftype:KML',
    },
    'dct:description': 'KML',
    'dct:title': 'KML',
  };
}

/**
 * Generates the distribution for Shapefile
 */
function getShapefileDistribution(dataset: DcatDataset) {
  return {
    '@type': 'dcat:Distribution',
    'dcat:accessUrl': dataset.getDownloadUrl('zip'),
    'dct:format': {
      '@id': 'ftype:ZIP',
    },
    'dct:description': 'Shapefile',
    'dct:title': 'ZIP',
  };
}

/**
 * Generates the distribution for OGC WMS
 */
function getOGCWMSDistribution(dataset: DcatDataset) {
  return {
    '@type': 'dcat:Distribution',
    'dcat:accessUrl': dataset.getOgcUrl('WMS'),
    'dct:format': {
      '@id': 'ftype:WMS_SRVC',
    },
    'dct:description': 'OGC WMS',
    'dct:title': 'OGC WMS',
  };
}

/**
 * Generates the distribution for OGC WFS
 */
function getOGCWFSDistribution(dataset: DcatDataset) {
  return {
    '@type': 'dcat:Distribution',
    'dcat:accessUrl': dataset.getOgcUrl('WFS'),
    'dct:format': {
      '@id': 'ftype:WFS_SRVC',
    },
    'dct:description': 'OGC WFS',
    'dct:title': 'OGC WFS',
  };
}
