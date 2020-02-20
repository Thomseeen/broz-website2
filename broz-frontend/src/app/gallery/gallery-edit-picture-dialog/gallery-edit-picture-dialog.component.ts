import { Component, OnInit, Inject } from '@angular/core';
import { FormControl, Validators, FormGroup, FormBuilder } from '@angular/forms';

import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-gallery-edit-picture-dialog',
  templateUrl: './gallery-edit-picture-dialog.component.html',
  styleUrls: ['./gallery-edit-picture-dialog.component.css']
})
export class GalleryEditPictureDialogComponent implements OnInit {
  pictureForm = this.formBuilder.group({
    'name': [null, [Validators.required, Validators.maxLength(12)]],
    'description': [null, [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    'file': [null, Validators.required],
  });

  constructor(
    private formBuilder: FormBuilder,
    public editDialogRef: MatDialogRef<GalleryEditPictureDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: number, name: string, description: string, file: string }
  ) {
    // Preset dialog fields on old values
    this.pictureForm.setValue({ name: this.data.name, description: this.data.description, file: this.data.file });
  }

  ngOnInit(): void { }

  submit() {
    this.editDialogRef.close(this.pictureForm.value);
  }

  close() {
    this.editDialogRef.close(null);
  }

}
