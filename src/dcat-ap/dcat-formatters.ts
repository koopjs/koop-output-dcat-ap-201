import { IItem } from '@esri/arcgis-rest-portal';
import { IDomainEntry } from '@esri/hub-common';
import { DcatDataset, getDownloadUrl, getOgcUrl, hasGeometryType, isFeatureLayer, supportsWFS, supportsWMS } from './dcat-dataset';
import alpha2ToAlpha3Langs from './languages';
import * as _ from 'lodash';
import { adlib, TransformsList } from 'adlib';

/**
 * Takes a locale (e.g. "en-us") and returns an
 * ISO 639-2 language code.
 */
export function localeToLang(locale: string) {
  return alpha2ToAlpha3Langs[locale.split('-')[0]];
}

export type DatasetFormatTemplate = Record<string, any>;

/**
 * Formats a single dataset object as a 'dcat:Dataset'
 */
export function formatDcatDataset(dcatDataset: DcatDataset, template: DatasetFormatTemplate) {
  const transforms: TransformsList = {
    toISO (_key, val) {
      return new Date(val).toISOString();
    },
    toArray (_key, val) {
      if (!val) return [];
      else return _.castArray(val);
    }
  };

  const formattedDataset = adlib(template, dcatDataset, transforms);

  formattedDataset['dcat:distribution'] = generateDistributions(dcatDataset); // wait, why is this 'dcat' when all other props use 'dct'?

  if (dcatDataset.language) {
    formattedDataset['dct:language'] = {
      '@id': `lang:${dcatDataset.language.toUpperCase()}`,
    };
  }

  if (!dcatDataset.provenance) {
    formattedDataset['dct:provenance'] = null;
  }

  return indent(JSON.stringify(formattedDataset, null, '\t'), 2);
}

export interface ICatalogOptions {
  siteItem: IItem,
  domainRecord: IDomainEntry,
  orgBaseUrl: string
}

/**
 * Formats a "dcat:Catalog"
 */
export function formatDcatCatalog({ siteItem, domainRecord, orgBaseUrl }: ICatalogOptions) {
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
      '@id': orgBaseUrl,
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

  if (isFeatureLayer(dataset)) {
    distributionFns.push(getGeoJSONDistribution);
    distributionFns.push(getCSVDistribution);
  }

  if (supportsWFS(dataset)) {
    distributionFns.push(getOGCWFSDistribution);
  }

  if (isFeatureLayer(dataset) && hasGeometryType(dataset)) {
    distributionFns.push(getKMLDistribution);
    distributionFns.push(getShapefileDistribution);
  }

  if (supportsWMS(dataset)) {
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
    'dcat:accessUrl': getDownloadUrl(dataset, 'geojson'),
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
    'dcat:accessUrl': getDownloadUrl(dataset, 'csv'),
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
    'dcat:accessUrl': getDownloadUrl(dataset, 'kml'),
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
    'dcat:accessUrl': getDownloadUrl(dataset, 'zip'),
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
    'dcat:accessUrl': getOgcUrl(dataset, 'WMS'),
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
    'dcat:accessUrl': getOgcUrl(dataset, 'WFS'),
    'dct:format': {
      '@id': 'ftype:WFS_SRVC',
    },
    'dct:description': 'OGC WFS',
    'dct:title': 'OGC WFS',
  };
}
