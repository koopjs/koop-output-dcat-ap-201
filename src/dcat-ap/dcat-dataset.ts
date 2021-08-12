import { getUserUrl, IItem } from '@esri/arcgis-rest-portal';
import { localeToLang } from './dcat-formatters';
import * as _ from 'lodash';
import { isPage } from '@esri/hub-sites';
import { UserSession } from '@esri/arcgis-rest-auth';

export const requiredFields = [
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
  'geometryType'
];

export class DcatDataset {
  private _dto: any;
  private _orgBaseUrl: string;
  private _orgTitle: string;
  private _siteUrl: string;

  constructor (dto: any, orgBaseUrl: string, orgTitle: string, siteUrl: string) {
    this._dto = dto;
    this._orgBaseUrl = orgBaseUrl;
    this._orgTitle = orgTitle;
    this._siteUrl = siteUrl;
  }

  /**
    * Lookup fn
    */
  private _get (path) {
    return _.get(this._dto, path, null);
  }

  get id (): string { return this._get('id'); }
  get url (): string { return this._get('url'); }
  get landingPage (): string { return `${this._siteUrl}/datasets/${this.id}`; }
  get title (): string { return this._get('name'); }
  get description (): string { return this._get('description'); }
  get owner (): string { return this._get('owner'); }
  get ownerUri (): string {
    return getUserUrl({
      portal: `${this._orgBaseUrl}/sharing/rest`,
      username: this.owner
    } as UserSession) + '?f=json';
  }

  get language (): string {
    return this._metaLanguage || localeToLang(this._get('culture')) || null;
  }

  get keyword (): string[] {
    if (this._metaKeyword) {
      return this._metaKeyword;
    }

    let tags = this._get('tags');

    const hasNoTags = !tags || tags.length === 0 || !tags[0]; // if tags is undefined, the tags array is empty, or tags is an empty string
    if (isPage({
      type: this._dto.type,
      typeKeywords: this._dto.typeKeywords
    } as IItem) && hasNoTags) {
      tags = ['ArcGIS Hub page'];
    }

    return tags;
  }

  /**
    * Returns an ISO string
    */
  get issuedDateTime (): string {
    return this._metaPubDate || new Date(this._get('created')).toISOString();
  }

  get isFeatureLayer (): boolean { return /_/.test(this.id); }
  get hasGeometryType (): boolean { return !!this._get('geometryType'); }
  private get _supportedExtensions () { return _.get(this._dto, 'supportedExtensions'); }
  get supportsWFS (): boolean { return this._supportedExtensions && this._supportedExtensions.includes('WFSServer'); }
  get supportsWMS (): boolean { return this._supportedExtensions && this._supportedExtensions.includes('WMSServer'); }

  get orgTitle (): string { return this._orgTitle; }

  // TODO - add to search API
  get orgContactUrl (): string { return null; }

  /* BEGIN INSPIRE METADATA PROPS (may want to introduce a metadata class to manage formats eventually) */

  get provenance (): string { return this._get('metadata.metadata.dataIdInfo.idCredit'); }
  private get _metaKeyword (): string[] { return this._get('metadata.metadata.dataIdInfo.searchKeys.keyword'); }
  private get _metaLanguage (): string { return this._get('metadata.metadata.dataIdInfo.dataLang.languageCode.@_value'); }
  private get _metaPubDate (): string { return this._get('metadata.metadata.dataIdInfo.idCitation.date.pubDate'); }

  /* BEGIN METHODS */

  getDownloadUrl (format: 'geojson'|'kml'|'csv'|'zip') {
    // get spatial reference
    const spatialReference = this._get('server.spatialReference');
    let queryStr = '';
    if (spatialReference) {
      const { latestWkid, wkid } = spatialReference;
      if (wkid) {
        const outSR = JSON.stringify({ latestWkid, wkid });
        queryStr = `?outSR=${encodeURIComponent(outSR)}`;
      }
    }
    return `${this.landingPage}.${format}${queryStr}`;
  }

  getOgcUrl (type: 'WMS'|'WFS' = 'WMS') {
    return this.url.replace(/rest\/services/i, 'services').replace(/\d+$/, `${type}Server?request=GetCapabilities&service=${type}`);
  }
}
