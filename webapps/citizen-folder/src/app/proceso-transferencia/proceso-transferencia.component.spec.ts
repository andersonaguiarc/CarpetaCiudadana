import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcesoTransferenciaComponent } from './proceso-transferencia.component';

describe('ProcesoTransferenciaComponent', () => {
  let component: ProcesoTransferenciaComponent;
  let fixture: ComponentFixture<ProcesoTransferenciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProcesoTransferenciaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProcesoTransferenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
