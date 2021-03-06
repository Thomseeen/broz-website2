import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, OnInit, Input } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { NGXLogger } from 'ngx-logger';
import { CookieService } from 'ngx-cookie-service';

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { GalleryDeletePictureDialogComponent } from '../gallery/gallery-delete-picture-dialog/gallery-delete-picture-dialog.component';
import { GalleryEditPictureDialogComponent } from '../gallery/gallery-edit-picture-dialog/gallery-edit-picture-dialog.component';

import { environment } from 'src/environments/environment';
import { ServiceLoginState } from '../app.service.login-state';



export interface Picture {
  id: number,
  name: string,
  tags: string[],
  file: string,
}

export interface PictureData {
  name: string,
  tags: string[],
  file: string,
}

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent implements OnInit {
  minLengthName = 3;
  maxLengthName = 25;
  maxLengthTags = 128;
  snackbarDuration = 3 * 1000; // ms
  isPictureRegEx = new RegExp(/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+\/+[-_a-zA-Z0-9]+((\.jpg)|(\.jpeg)|(\.png)|(\.gif))$/);
  baseUrl = environment.baseUrl + '/gallery';
  visible = true;
  selectable = true;
  removable = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  login_state: number = 0;

  numer_render_columns: number;
  allKnownTags: Set<string> = new Set();
  filterTags: Set<string> = new Set();
  fullPicturesMetadata;
  picturesMetadata: Picture[];
  filteredPicturesMetadata: Picture[];

  constructor(private _logger: NGXLogger, private _http: HttpClient, private _snackBar: MatSnackBar, private _cookieService: CookieService, private _loginState: ServiceLoginState, public dialog: MatDialog) { }

  ngOnInit(): void {
    this.numer_render_columns = Math.ceil(window.innerWidth / 500);
    this._logger.debug('gallery.component: query gallery metadata.');
    this.getGalleryMetadataAPI();
    this._loginState.loginState.subscribe(login_state => this.login_state = login_state);
  }

  addPicture() {
    const addDialogRef = this.dialog.open(GalleryEditPictureDialogComponent, {
      width: '500px',
      data: {
        configData: {
          minLengthName: this.minLengthName,
          maxLengthName: this.maxLengthName,
          maxLengthTags: this.maxLengthTags,
          isPictureRegEx: this.isPictureRegEx,
          allKnownTags: Array.from(this.allKnownTags),
          actionType: 'Neues'
        },
        initData: {
          id: null, name: '', file: '', tags: []
        }
      }
    });
    addDialogRef.afterClosed().subscribe(result => {
      if (result) {
        delete result.id;
        this._logger.debug('gallery.component: add form result:', result);
        this.postPictureAPI(result);
      }
    });
  }

  editPicture(element) {
    const editDialogRef = this.dialog.open(GalleryEditPictureDialogComponent, {
      width: '500px',
      data: {
        configData: {
          minLengthName: this.minLengthName,
          maxLengthName: this.maxLengthName,
          maxLengthTags: this.maxLengthTags,
          isPictureRegEx: this.isPictureRegEx,
          allKnownTags: Array.from(this.allKnownTags),
          actionType: 'Editiere'
        },
        initData: {
          id: element.id, name: element.name, file: element.file, tags: element.tags
        }
      }
    });
    editDialogRef.afterClosed().subscribe(result => {
      if (result) {
        this._logger.debug('gallery.component: edit form result:', result);
        this.putPictureAPI(result);
      }
    });
  }

  deletePicture(element) {
    const deleteDialogRef = this.dialog.open(GalleryDeletePictureDialogComponent, {
      data: { id: element.id, name: element.name, file: element.file, tags: element.tags }
    });
    deleteDialogRef.afterClosed().subscribe(result => {
      if (result) {
        this._logger.debug('gallery.component: delete form result:', result);
        this.deletePictureAPI(result);
      }
    });
  }

  onResize(event) {
    this.numer_render_columns = Math.ceil(window.innerWidth / 500);
  }

  getGalleryMetadataAPI() {
    return this._http.get(this.baseUrl + '/metadata').subscribe(
      (val) => {
        this._logger.log('gallery.component: GET request: all gallery metadata val:', val);
        this.refreshPictureGrid(val);
      },
      response => {
        this._logger.error('gallery.component: GET request error: response:', response);
      },
      () => {
        this._logger.debug('gallery.component: GET observable completed.');
      }
    );
  }

  postPictureAPI(picture: PictureData) {
    let token = this._cookieService.get('login-token');
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Authorization', `Basic ${btoa(token + ':')}`);
    const body = picture;
    this._http.post(this.baseUrl + '/metadata', body, { headers }).subscribe(
      (val) => {
        this._logger.log('gallery.component: POST request: all gallery metadata val:', val);
        this.refreshPictureGrid(val);
        this._snackBar.open('Neues Bild angelegt', 'OK', { duration: this.snackbarDuration });
      },
      response => {
        this._logger.error('gallery.component: POST request error: response:', response);
        if (response.status === 401) {
          this._snackBar.open('ERROR - User unauthorized', 'OK', { duration: this.snackbarDuration });
        } else {
          this._snackBar.open('ERROR - POST call in error', 'OK', { duration: this.snackbarDuration });
        }
      },
      () => {
        this._logger.debug('gallery.component: POST observable completed.');
      }
    );
  }

  putPictureAPI(picture: Picture) {
    let token = this._cookieService.get('login-token');
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Authorization', `Basic ${btoa(token + ':')}`);
    const body = picture;
    this._http.put(this.baseUrl + '/metadata', body, { headers }).subscribe(
      (val) => {
        this._logger.log('gallery.component: PUT request: all gallery metadata val:', val);
        this.refreshPictureGrid(val);
        this._snackBar.open('Bild erfolgreich editiert', 'OK', { duration: this.snackbarDuration });
      },
      response => {
        this._logger.error('gallery.component: PUT request error: response:', response);
        if (response.status === 401) {
          this._snackBar.open('ERROR - User unauthorized', 'OK', { duration: this.snackbarDuration });
        } else {
          this._snackBar.open('ERROR - PUT call in error', 'OK', { duration: this.snackbarDuration });
        }
      },
      () => {
        this._logger.debug('gallery.component: PUT observable completed.');
      }
    );
  }

  deletePictureAPI(picture: Picture) {
    let token = this._cookieService.get('login-token');
    let headers = new HttpHeaders();
    headers = headers.set('Authorization', `Basic ${btoa(token + ':')}`);
    const delUrl = this.baseUrl + `/metadata/${picture.id}`;
    this._http.delete(delUrl, { headers }).subscribe(
      (val) => {
        this._logger.log('gallery.component: DELETE request: all gallery metadata val:', val);
        this.refreshPictureGrid(val);
        this._snackBar.open('Bild erfolgreich gelöscht', 'OK', { duration: this.snackbarDuration });
      },
      response => {
        this._logger.error('gallery.component: DELETE request error: response:', response);
        if (response.status === 401) {
          this._snackBar.open('ERROR - User unauthorized', 'OK', { duration: this.snackbarDuration });
        } else {
          this._snackBar.open('ERROR - DELETE call in error', 'OK', { duration: this.snackbarDuration });
        }
      },
      () => {
        this._logger.debug('gallery.component: DELETE observable completed.');
      }
    );
  }

  refreshPictureGrid(val: any) {
    this.fullPicturesMetadata = val;
    this.picturesMetadata = this.fullPicturesMetadata.pictures;
    for (let ii = 0; ii < this.picturesMetadata.length; ii++) {
      this.picturesMetadata[ii].id = ii;
      for (const tag of this.picturesMetadata[ii].tags) {
        this.allKnownTags.add(tag);
      }
    }
    this._logger.debug('gallery.component: All known tags:', this.allKnownTags);
    this.filterPictures();
  }

  addFilterTag(tag: string) {
    this.filterTags.add(tag);
    this.filterPictures();
  }

  removeFilterTag(tag: string) {
    this.filterTags.delete(tag);
    this.filterPictures();
  }

  filterPictures() {
    this.filteredPicturesMetadata = this.picturesMetadata.filter(picture => picture.tags.filter(tag => this.filterTags.has(tag)).length === this.filterTags.size);
  }
}
