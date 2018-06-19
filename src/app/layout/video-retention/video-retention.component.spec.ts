import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoRetentionComponent } from './video-retention.component';

describe('VideoRetentionComponent', () => {
  let component: VideoRetentionComponent;
  let fixture: ComponentFixture<VideoRetentionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VideoRetentionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoRetentionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
