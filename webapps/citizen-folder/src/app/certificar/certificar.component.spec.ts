import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificarComponent } from './certificar.component';

describe('CertificarComponent', () => {
  let component: CertificarComponent;
  let fixture: ComponentFixture<CertificarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CertificarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CertificarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
