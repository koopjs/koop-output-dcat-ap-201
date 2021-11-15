import { getUserUrl, IItem } from '@esri/arcgis-rest-portal';
import { localeToLang } from './dcat-formatters';
import * as _ from 'lodash';
import { isPage } from '@esri/hub-sites';
import { UserSession } from '@esri/arcgis-rest-auth';

// Required fields from the API
export const defaultRequiredFields = [
  'id',
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
  'geometryType',
  'orgContactEmail'
];

// Fields calculated from API Values
export const defaultCalculatedFields = [
  'landingPage',
  'ownerUri',
  'language',
  'keyword',
  'issuedDateTime',
  'orgTitle',
  'provenance'
];

export function getDcatDataset(hubDataset: any, orgBaseUrl: string, orgTitle: string, siteUrl: string) {
  return Object.assign({}, hubDataset, {
    landingPage: `${siteUrl}/datasets/${hubDataset.id}`,
    ownerUri: getUserUrl({
        portal: `${orgBaseUrl}/sharing/rest`,
        username: hubDataset.owner
      } as UserSession) + '?f=json',
    language: _.get(hubDataset, 'metadata.metadata.dataIdInfo.dataLang.languageCode.@_value') || localeToLang(hubDataset.culture) || '',
    keyword: getDatasetKeyword(hubDataset),
    issuedDateTime: _.get(hubDataset, 'metadata.metadata.dataIdInfo.idCitation.date.pubDate') || new Date(hubDataset.created).toISOString(),
    orgTitle,
    provenance: _.get(hubDataset, 'metadata.metadata.dataIdInfo.idCredit', ''),
  });
}

function getDatasetKeyword(dataset: any) {
    const metaKeyword = _.get(dataset, 'metadata.metadata.dataIdInfo.searchKeys.keyword');
    
    if (metaKeyword) {
      return metaKeyword;
    }

    const { tags, type, typeKeywords } = dataset;
    const hasNoTags = !tags || tags.length === 0 || !tags[0]; // if tags is undefined, the tags array is empty, or tags is an empty string
    
    if (isPage({ type, typeKeywords } as IItem) && hasNoTags) {
      return ['ArcGIS Hub page'];
    }

    return tags;
}

// TODO: Should we test these individually?
export const isFeatureLayer = (dcatDataset: any) => /_/.test(dcatDataset.id);
export const hasGeometryType = (dcatDataset: any) => !!dcatDataset.geometryType;
export const supportsWFS = (dcatDataset: any) => _.get(dcatDataset, 'supportedExtensions', []).includes('WFSServer');
export const supportsWMS = (dcatDataset: any) => _.get(dcatDataset, 'supportedExtensions', []).includes(('WMSServer'));
export const getDownloadUrl = (dcatDataset: any, format: 'geojson'|'kml'|'csv'|'zip') => {
  const spatialReference = _.get(dcatDataset, 'server.spatialReference');
  let queryStr = '';
  if (spatialReference) {
    const { latestWkid, wkid } = spatialReference;
    if (wkid) {
      const outSR = JSON.stringify({ latestWkid, wkid });
      queryStr = `?outSR=${encodeURIComponent(outSR)}`;
    }
  }
  return `${dcatDataset.landingPage}.${format}${queryStr}`;
};
export const getOgcUrl = (dcatDataset: any, type: 'WMS'|'WFS' = 'WMS') => dcatDataset.url.replace(/rest\/services/i, 'services').replace(/\d+$/, `${type}Server?request=GetCapabilities&service=${type}`);
