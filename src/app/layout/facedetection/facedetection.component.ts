import { Component, OnInit, NgZone, NgModule, ElementRef, AfterViewInit, ComponentRef, ComponentFactory, ViewChild, ViewContainerRef, ComponentFactoryResolver, EventEmitter, TemplateRef, } from '@angular/core';
import { ImageCropperComponent, CropperSettings, Bounds } from 'ng2-img-cropper';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable'
import { Socket } from 'ng-socket-io';
import * as io from 'socket.io-client';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import * as data from '../../../../config'
import { Contact } from './contact';
import { ToastrService } from '../../services/toastr.service';
import { IEmbedConfiguration, models, factories, } from 'powerbi-client';
import * as  pbi from 'powerbi-client';
import { PagerService } from './_services/index'

@Component({
  selector: 'facerecognition',
  templateUrl: './facedetection.component.html',
  styleUrls: ['./facedetection.component.css']
})

export class FacedetectionComponent implements OnInit {


  public allItemsUnidentified: any[];
  pagerUnidentified: any = {};
  pagedItemsUnidentified: any[];

  public allItemsIdentified: any[];
  pagerIdentified: any = {};
  pagedItemsIdentified: any[];

  public allItemsHistory: any[];
  pagerHistory: any = {};
  pagedItemsHistory: any[];



  public currentPage: number = 0;
  public totalItemsIdentified: number;
  public totalItemsUnidentified: number; // total numbar of page not items
  public maxSize: number = 10; // max page size

  public currentPageHistory: number = 0;
  public totalItemsHistory: number; // total numbar of page not items
  public maxSizeHistory: number = 15; // max page size

  isPaginationIdentified: boolean;
  isPaginationHistory: boolean;
  isPaginationUnidentified: boolean;
  isDataNotAvailable: boolean;
  isDataNotAvailable1: boolean;
  isDataNotAvailable2: boolean;
  isAllUnknown: boolean;
  isAllKnown: boolean;
  recordLengthUnknown: number;
  recordLengthKnown: number;
  isClearAllUnknownChecked: boolean;
  isClearAllKnownChecked: boolean;
  checkSelect1: boolean;
  checkSelect2: boolean;
  toggleSwitch1: boolean;
  toggleSwitch2: boolean;
  tempUserName: any;
  userDetails: any;
  page: any;
  checkFlag: any;
  checkFlag2:any;

  contacts: Array<Contact>;
  // @ViewChild('dynamic', { read: ViewContainerRef }) viewContainerRef: ViewContainerRef
  @ViewChild('dynamicInsert', { read: ViewContainerRef }) dynamicInsert: ViewContainerRef;
  data1: any;
  cropperSettings1: CropperSettings;
  croppedWidth: number;
  name;
  croppedHeight: number;
  cropFlag: boolean = false;

  @ViewChild('cropper', undefined) cropper: ImageCropperComponent;

  isOn: boolean;
  vmUrl: string;
  detectionCameras: any[];
  socket: SocketIOClient.Socket;
  camData: any[];

  totalCount: any[];
  cameraName;
  cameraId;
  time;
  data: any[];
  imgSrc: any;
  tempUserId: any;
  tempAge;
  tempNotification;
  tempNotification1;
  tempGender;
  tempUserId1: any;
  tempAge1;
  tempGender1;
  tempUserData;
  public loading;
  apiCount;
  detectionCamObject: any;
  unidentifiedDetails: any[];
  identifiedDetails: any[];
  userdata: string;
  identified;
  unidentified;
  personName;
  gender;
  age;
  ageArray;
  historyAll: any[];
  historyData: any[];
  isUnidentifiedPresent: boolean;
  isIdentifiedPresent: boolean;
  userName: string[];
  checkBoxes: any[];
  checkBoxesIdentified: any[];
  isUnknownDataPresent: boolean;
  isCameraPresent: boolean;
  cameraObject: any;
  tempArray: any[];
  Math: any;
  intervalId: any = 0;
  socketData: any[];
  dId: any;
  embedUrl: string;
  accessToken: string;
  powerbi: any;
  socketResult: any[];
  USER: any;
  selectedKnownUsers: any[];
  selectedUnknownUsers: any[];
  selectedEnableNotificationKnown: any;
  selectedEnableNotificationUnknown: any;
  checked1: boolean;
  checked2: boolean;
  constructor(public pagerService: PagerService, private sanitizer: DomSanitizer, private toastrService: ToastrService, private route: ActivatedRoute, public router: Router, private http: HttpClient, private zone: NgZone, public domSanitizer: DomSanitizer, private viewContainerRef: ViewContainerRef, private componentFactoryResolver: ComponentFactoryResolver) {
     var session = JSON.parse(localStorage.getItem('sessionConfiguration'));
    if (session != null) {
      this.vmUrl = session.vmUrl;
    }
    this.page = 1;

    this.Math = Math;
    this.toggleSwitch1 = false;
    this.toggleSwitch2 = false;
    this.selectedKnownUsers = [];
    this.selectedUnknownUsers = [];
    this.selectedEnableNotificationKnown = '';
    this.selectedEnableNotificationUnknown = '';
    this.USER = localStorage.getItem('userId');
    this.isPaginationIdentified = false;
    this.isPaginationHistory = false;
    this.totalItemsIdentified = 0;
    this.totalItemsUnidentified = 0;
    this.totalItemsHistory = 0;
    this.isPaginationUnidentified = false;
    this.isDataNotAvailable = false;
    this.isDataNotAvailable1 = false;
    this.isDataNotAvailable2 = false;
    this.totalCount = [];
    this.isAllUnknown = false;
    this.isAllKnown = false;
    this.isUnidentifiedPresent = false;
    this.isIdentifiedPresent = false;
    this.isUnknownDataPresent = false;
    this.recordLengthUnknown = 0;
    this.recordLengthKnown = 0;
    this.isCameraPresent = false;
    this.isClearAllUnknownChecked = false;
    this.isClearAllKnownChecked = false;
    this.checked1 = false;
    this.checked2 = false;
    this.tempArray;
    this.isOn = true;
    this.detectionCameras = [];
    this.checkSelect1 = false;
    this.checkSelect2 = false;
    this.cameraObject = [];
    this.camData = [];
    this.imgSrc = '';
    this.data = [];
    this.socketData = [];
    this.historyAll = [];
    this.historyData = [];
    this.socketResult = [];
    this.identified = 0;
    this.unidentified = 0;
    this.tempUserId = '';
    this.tempAge = '';
    this.tempGender = '';
    this.tempUserId1 = '';
    this.tempAge1 = '';
    this.tempGender1 = '';
    this.tempUserData = [];
    this.tempNotification = false;
    this.tempNotification1 = false;
    this.tempUserName = '';
    this.userDetails = [];
    //this.apiCount = 0;
    this.unidentifiedDetails = [];
    this.identifiedDetails = [];
    this.ageArray = [];
    this.userdata = '';
    for (var i = 22; i <= 65; i++) {
      this.ageArray.push({ "ageEdit": i, "ageDisplay": i + ' Years' });
    }

    this.userName = [];
    this.checkBoxes = [];
    this.checkBoxesIdentified = [];
    this.contacts = [];
    this.socket = io.connect(this.vmUrl, { secure: true });
  }

  ngOnInit() {
    this.loading = true;
    this.maxSize = 10;
    this.apiCount = 0;
    console.log("API COUNT NGONINT ================================================== ", this.apiCount);
    this.getCount();
    this.getToken();
    sessionStorage.setItem("selectedCamIndex", "0");
    sessionStorage.setItem("selectedAggrIndex", "0");
    this.socketConnection();
    document.getElementById("unidentifiedTab").className = "active";
    document.getElementById("unidentified").className += " active";
    this.checkFlag = 0;
    this.checkFlag2=0;
    
  }


  ngOnDestroy() {
    this.socket.disconnect();
  }

  selectMe(user, id) {
    console.log("selected users : ", user);
    if (id == 0) {
      this.selectedKnownUsers.push(user);
    }
    else if (id == 1) {
      this.selectedUnknownUsers.push(user);
    }
  }

  enableNotification = function (event, id) {
    if (id == 0) {

      if (this.toggleSwitch2) {
        this.toggleSwitch2 = false;
      }
      else {
        this.toggleSwitch2 = true;
      }
    }
    else if (id == 1) {
      if (this.toggleSwitch1) {
        this.selectedEnableNotificationUnknown = event.target.value;
        console.log("disabled :: ", this.selectedEnableNotificationUnknown);
        this.toggleSwitch1 = false;
      }
      else {
        this.selectedEnableNotificationUnknown = event.target.value;
        console.log("enabled :: ", this.selectedEnableNotificationUnknown);
        this.toggleSwitch1 = true;
      }
    }
  }

  clickedTab(tab) {
    if (tab == 0) {
      this.checkFlag = 0;
    }
    else if (tab == 1) {
      this.checkFlag = 1;
    }
  }

    clickedTab2(tab) {
      console.log("***** clicked TAB :: ",tab);
    if (tab == 0) {
      this.checkFlag2 = 0;
    }
    else if (tab == 1) {
      this.isPaginationHistory = false;
      this.checkFlag2 = 1;
    }
  }

  getToken() {
    var data = {};
    this.http.get<any>(this.vmUrl + '/powerbi/auth?confName=FaceRecognition', )
      .subscribe(
      res => {
        console.log("Powerbi token:", res);
        this.accessToken = res.access_token;
        this.embedUrl = res.embed_url;
        this.dId = res.dId;

      },
      err => {
        console.log("error response", err);
      });
  }

  deleteReport() {
    this.checkFlag = 1;

  }

  showReport(pdata) {
    console.log("@@@@@@@@@@@@@@@", pdata);
    if (this.dId == '' || this.accessToken == '' || this.embedUrl == '') {
      this.toastrService.Error("", "Unable to get the PowerBi Configurations");
    }
    else {
      let conf: IEmbedConfiguration = {
        accessToken: this.accessToken,
        dashboardId: this.dId,
        embedUrl: this.embedUrl + "'" + pdata.persistedFaceId + "'",
        tokenType: 0,
        settings: {
          filterPaneEnabled: false,
          navContentPaneEnabled: false
        },
        type: 'report'
      };

      let reportContainer = <HTMLElement>document.getElementById('reportContainer1');

      this.powerbi = new pbi.service.Service(pbi.factories.hpmFactory, pbi.factories.wpmpFactory, pbi.factories.routerFactory);
      this.powerbi.reset(document.getElementById("reportContainer1"));
      let report = this.powerbi.embed(reportContainer, conf);

      report.iframe.frameBorder = 'none';
      console.log("powerbi", this.powerbi);
      console.log("report", report);

      report.on("loaded", function () {
        console.log("Loaded");
        this._validate = true;
      });
      report.on("error", function (er) {
        console.log("error", er);
      });
    }
  };
  socketConnection() {
    this.socket.on('notification', (msg: any) => {
      this.loading = false;
      this.isOn = true;
      console.log("Message on socket : ", msg);
      if (msg.type == 'faceRecognition') {
        this.zone.run(() => {
          this.getUnidentifiedDetails(1, 1);
        });
      }
    });

    this.socket.on('faceRecognition/' + localStorage.getItem('userId'), (msg: any) => {
      this.socketData = [];
      this.socketData.push(JSON.parse(msg));
      console.log("SOCKET DATA : ", this.socketData);
      this.addSocketResults(this.socketData);
    });

    this.socket.on('similarFaceRecognition', (msg: any) => {
      console.log("SIMILAR ADDED : ", msg);
      //this.getUnidentifiedDetails(1, 1);
    });

  }

  removeSocketListener() {
    this.socket.removeListener('faceRecognition/' + localStorage.getItem('userId'), (msg: any) => {
      console.log("Listener Removed : ", msg);
    });
  }

  public pageChanged(event: any, flag): void {
    this.loading = true;
    this.checked1 = false;
    this.checked2 = false;
    this.isAllUnknown = false;
    this.isAllKnown = false;
    console.log('### PAGINATION == Current page number : ' + this.currentPage);
    console.log('### PAGINATION == flag  : ' + flag);

    if (flag == 0) {
      this.getIdentifiedDetails(1, this.currentPage);
    }
    else if (flag == 1) {
      this.getUnidentifiedDetails(1, this.currentPage);
    }
  };


  getCount() {
    this.http.get<any[]>(this.vmUrl + '/faces/count',
    ).subscribe(
      res => {

        console.log('count response = ', res);

        res.forEach(item => {
          this.totalCount.push({ 'status': item.status, 'count': item.count });
          if (item.status == 1) {
            this.totalItemsIdentified = item.count;
          }
          else if (item.status == 0) {
            this.totalItemsUnidentified = item.count;
          }
        })

        console.log("this.totalItemsIdentified  : ", this.totalItemsIdentified);
        console.log("this.totalItemsUnidentified  : ", this.totalItemsUnidentified);
         this.getIdentifiedDetails(0, 0);
         this.getUnidentifiedDetails(0, 0);
      },
      err => {
        this.loading = false;
        console.log("Error occured");
      }
      );
  }


    getTotalCount() {
    this.http.get<any[]>(this.vmUrl + '/faces/count',
    ).subscribe(
      res => {

        console.log('count response = ', res);

        res.forEach(item => {
          this.totalCount.push({ 'status': item.status, 'count': item.count });
          if (item.status == 1) {
            this.totalItemsIdentified = item.count;
          }
          else if (item.status == 0) {
            this.totalItemsUnidentified = item.count;
          }
        })

        console.log("this.totalItemsIdentified  : ", this.totalItemsIdentified);
        console.log("this.totalItemsUnidentified  : ", this.totalItemsUnidentified);
      },
      err => {
        this.loading = false;
        console.log("Error occured");
      }
      );
  }


  transform(html) {
    console.log(this.unidentifiedDetails[0].faces[0].imgUrl);
    return this.sanitizer.bypassSecurityTrustStyle('url(' + html + ')');
  }



  onChangeAge(age) {
    console.log(age);
    this.tempAge1 = age;
  }

  onChangeGender(gender) {
    console.log(gender);
    this.tempGender1 = gender;
  }

  onChangeAgeUpdate(age) {
    console.log("age : ", age);
    this.tempAge = age;
  }

  onChangeGenderUpdate(gender) {
    console.log("gender :", gender);
    this.tempGender = gender;
  }


  onChange(camera) {
    console.log("onchange camera", camera);
    this.cameraName = camera;
  };

  onChangeTime(time) {
    console.log("onchange time", time);
    this.time = time;
  }


  trackByIndex(index: number, obj: any): any {
    return index;
  }

  getUsername(name, subArray, mainArray) {
    this.removeSocketListener();
    this.unidentifiedDetails[mainArray].faces[subArray].username = name;
    console.log(" Name added in Identified : ", this.unidentifiedDetails);
  }

  checkAllClicked(all) {
    console.log("Checked all clicked :", all);
  }

  cropped(bounds: Bounds) {
    this.croppedHeight = bounds.bottom - bounds.top;
    this.croppedWidth = bounds.right - bounds.left;
    this.imgSrc = this.data1.image;
    console.log("src : ", this.imgSrc);
  }


  saveValue(pdata) {
    console.log("pdata in save: ", pdata);
    this.tempUserId = pdata._id;
    this.tempAge = pdata.age;
    this.tempGender = pdata.gender;
  }


  saveValueNew(pdata, event, i) {
    console.log("pdata in save value new: ", pdata);
    this.tempUserId = pdata._id;
    this.tempAge = pdata.age;
    this.tempGender = pdata.gender;
    this.tempUserData = pdata;
    this.tempUserName = pdata.userData;
    (<HTMLInputElement>document.getElementById("userdataEdit")).value = this.tempUserData.userData;
    if (pdata.flag == true) {
      this.toggleSwitch2 = true;
    }
    else {
      this.toggleSwitch2 = false;
    }
  }

  toggleSelect = function (event, i, flag) {
    console.log("flag = ", flag, i);
    var length = 0;
    if (flag == 0) {

      if (this.checked2) {
        this.identifiedDetails.forEach(function (item, index) {
          if (i == index) {
            item.faces.forEach(function (item2) {
              console.log("item2 before :", item2);
              item2.selected = event.target.checked;
              console.log("item2 after:", item2);
              length++;
            });
          }
        });

        this.recordLengthKnown = length;
        this.isAllKnown = false;
        this.checked2 = false;
      }
      else {
        this.identifiedDetails.forEach(function (item, index) {
          if (i == index) {
            item.faces.forEach(function (item2) {
              console.log("item2 :", item2);
              item2.selected = event.target.checked;
              console.log("item2 :", item2);
              length++;
            });
          }
        });

        this.recordLengthKnown = length;
        this.isAllKnown = true;
        this.checked2 = true;

      }
    }
    else if (flag == 1) {
      if (this.checked1) {
        this.unidentifiedDetails.forEach(function (item, index) {
          if (i == index) {
            item.faces.forEach(function (item2) {
              console.log("item2 :", item2);
              item2.selected = event.target.checked;
              length++;
            });
          }
        });

        this.recordLengthUnknown = length;
        this.isAllUnknown = false;
        this.checked1 = false;
      }
      else {
        this.unidentifiedDetails.forEach(function (item, index) {
          if (i == index) {
            item.faces.forEach(function (item2) {
              console.log("item2 :", item2);
              item2.selected = event.target.checked;
              length++;
            });
          }
        });

        this.recordLengthUnknown = length;
        this.isAllUnknown = true;
        this.checked1 = true;
      }
    }
  }

  selectAll = function (event, flag) {
    if (flag == 0) {
      if (this.checkSelect1) {
        console.log("UNSELECT");
        this.checkSelect1 = false;
        this.isClearAllKnownChecked = false;
      }
      else {
        this.isClearAllKnownChecked = true;
        this.checkSelect1 = true;
      }
    }
    else if (flag == 1) {

      if (this.checkSelect2) {
        console.log("UNSELECT");
        this.isClearAllUnknownChecked = false;
        this.checkSelect2 = false;
      }
      else {
        this.isClearAllUnknownChecked = true;
        this.checkSelect2 = true;
      }
    }
  }

  clearAll(status) {

    if (this.isClearAllUnknownChecked || this.isClearAllKnownChecked) {
      this.loading = true;
      this.http.delete(this.vmUrl + '/faces/all?status=' + status,
        { observe: 'response' }
      ).subscribe(
        (res: any) => {
          this.loading = false;
          this.socketConnection();
          //this.ngOnInit();

          if (status == 1) {
            // this.ngOnInit2(1);
            this.getIdentifiedDetails(1, 0);
            this.getTotalCount();

            console.log("Cleared all Known records  ::: ", res);
            this.isClearAllKnownChecked = false;
            this.toastrService.Success("", "All Identified User Records Removed Successfully");
          }
          else {
            //this.ngOnInit2(0);
            this.getUnidentifiedDetails(1, 0);
            this.getTotalCount();
            console.log("Cleared all Unknown records  ::: ", res);
            this.isClearAllUnknownChecked = false;
            this.toastrService.Success("", "All Unidentified User Records Removed Successfully");
          }
        },
        err => {
          this.loading = false;
          this.socketConnection();
          this.toastrService.Error("", "Error Occurred While Removing User Record");
          console.log("Error response", err);
          if (err.status == 500) {
            console.log(err);
          }
        })
    }
    else {
      this.toastrService.Warning("", "Please select checkbox to remove all the records.");
    }

  }

  cropImages(details) {

    console.log("CROP RESULT === ", details);
    details.forEach(item2 => {
      console.log("Items : ", item2);

      item2.faces.forEach(item => {
        this.clear(item._id + "div");
        var id = document.getElementById(item._id);
        console.log("iddd", id);
        if (id) {
          var element = document.createElement('div');
          element.id = item._id + "div";
          element.className = 'croppedImage';
          console.log("##########", item.faceRectangle);
          element.style.width = '80px';
          element.style.height = '90px';
          element.style.backgroundImage = "url('" + item.imgUrl + "')";
          element.style.backgroundPositionX = (-1 * item.faceRectangle.left + 20) + 'px';
          element.style.backgroundPositionY = (-1 * item.faceRectangle.top + 30) + 'px';
          id.appendChild(element);
        }
      })
    });
  }

  cropMe(item) {
    console.log("CROP RESULT 2 === ", item);
    var id = document.getElementById(item._id);
    console.log("iddd", id);
    if (id) {
      var element = document.createElement('div');
      element.id = item._id + "div";
      console.log("##########", item.faceRectangle);
      element.style.width = '80px';
      element.style.height = '90px';
      element.style.backgroundImage = "url('" + item.imgUrl + "')";
      element.style.backgroundPositionX = (-1 * item.faceRectangle.left + 20) + 'px';
      element.style.backgroundPositionY = (-1 * item.faceRectangle.top + 30) + 'px';
      id.appendChild(element);
    }
  }

  // ngAfterViewInit() {
  //   const componentFactory = this.componentFactoryResolver.resolveComponentFactory(DynamicComponent);
  //   this.dynamicInsert.clear();
  //   const dyynamicComponent = <DynamicComponent>this.dynamicInsert.createComponent(componentFactory).instance;
  //   dyynamicComponent.someProp = 'Hello World';
  // }


  addUnknown(pdata, j, i) {
    var context = this;
    console.log("pdata  ######## : ", pdata);
    if (this.unidentifiedDetails[i].faces[j].username == undefined) {
      this.toastrService.Error("", "Please Enter Username");
    }
    else {
      this.loading = true;
      if (this.tempAge1 == '') {
        this.tempAge1 = Math.round(this.unidentifiedDetails[i].faces[j].age);
      }

      if (this.tempGender1 == '') {
        this.tempGender1 = this.unidentifiedDetails[i].faces[j].gender;
      }
      var unknownObject =
        {
          "faceId": pdata._id,
          "userData": this.unidentifiedDetails[i].faces[j].username,
          "age": this.tempAge1,
          "gender": this.tempGender1,
          "flag": this.toggleSwitch1
        }
      console.log("unknown object :::::: ", unknownObject);
      this.http.post<any[]>(this.vmUrl + '/faces', unknownObject)
        .subscribe(
        res => {
          this.socketConnection();
          //this.loading = false;
          this.toastrService.Success("", "User Record Added Successfully");
          this.userdata = '';
          this.tempAge1 = '';
          this.tempGender1 = '';
          console.log('ADD face res : ', res);
          this.getUnidentifiedDetails(1, this.currentPage);
          this.getIdentifiedDetails(1, this.currentPage);
          this.getTotalCount();
        },
        err => {
          this.loading = false;
          this.socketConnection();
          this.userdata = '';
          this.tempAge1 = '';
          this.tempGender1 = '';
          this.toastrService.Error("", "Error Occurred While Adding User");
          console.log("error response", err);
        });
    }
  }



  RemoveAllRecords(i, flag) {
    this.removeSocketListener();
    var context = this;
    this.loading = true;
    var temp = [];

    if (flag == 0) {
      if (this.isClearAllKnownChecked) {
        this.clearAll(1);
      }
      else {
        if (this.selectedKnownUsers.length == 0) {
          this.identifiedDetails.forEach(function (item, index) {
            if (i == index) {
              item.faces.forEach(item2 => {
                temp.push(item2._id);
              })
            }
          });
        }
        else {
          temp = this.selectedKnownUsers;
        }

        console.log("tempknown :: ", temp);
        this.http.delete(this.vmUrl + '/faces?faceIds=' + temp,
          { observe: 'response' }
        ).subscribe(
          (res: any) => {
            this.loading = false;
            this.socketConnection();
            console.log("all records removed");
            this.toastrService.Success("", "All User Records Removed Successfully");
            //this.ngOnInit2(1);
            this.getIdentifiedDetails(1, 0);
            this.getTotalCount();
          },
          err => {
            this.loading = false;
            this.socketConnection();
            this.toastrService.Error("", "Error Occurred While Removing User Record");
            console.log("Error response", err);
            if (err.status == 500) {
              console.log(err);
            }
          })
      }
    }
    else if (flag == 1) {

      if (this.isClearAllUnknownChecked) {
        this.clearAll(0);
      }
      else {

        if (this.selectedUnknownUsers.length == 0) {
          this.unidentifiedDetails.forEach(function (item, index) {
            if (i == index) {
              item.faces.forEach(item2 => {
                temp.push(item2._id);
              })
            }
          });
        }
        else {
          temp = this.selectedUnknownUsers;
        }

        console.log("tempunKnown : ", temp);
        this.http.delete(this.vmUrl + '/faces?faceIds=' + temp,
          { observe: 'response' }
        ).subscribe(
          (res: any) => {
            this.loading = false;
            this.toastrService.Success("", "All Unidentified Records Removed Successfully");
            console.log("all record removeds => unknown : ", res);
            //this.ngOnInit2(0);
            this.getUnidentifiedDetails(1, 0);
            this.getTotalCount();
          },
          err => {
            this.loading = false;
            this.toastrService.Error("", "Error Occurred While Removing Unidentified Records");
            console.log("Error response", err);
            if (err.status == 500) {
              console.log(err);

            }
          })
      }
    }
  }


  getIdentifiedDetails(flag, currentPage) {

    if (currentPage < 0) {
      this.isDataNotAvailable1 = true;
    }
    else {
      this.isDataNotAvailable1 = false;
      this.loading = true;
      this.identifiedDetails = [];
      var length = 0;
      var url = '';

      console.log("current page in identified = ", currentPage);
      if (flag == 0) {
        console.log("current flag 0  in identified = ", flag);
        url = this.vmUrl + '/faces?status=1&filter=date&page=0&limit=10';
      }
      else if (flag == 1) {
        url = this.vmUrl + '/faces?status=1&filter=date&page=' + currentPage + '&limit=10';
      }

      this.http.get<any[]>(url,
      ).subscribe(
        res => {
          console.log("** IDENTIFIED RESPONSE : ", res);
          var time: any;
          if (flag == 0) {

            this.apiCount++;
            if (this.apiCount == 2) {
              this.loading = false;
              
            }
          }
          else if (flag == 1) {
            this.loading = false;
            
          }
          console.log("facedetails identified : ", res);
          if (res.length == 0) {
            //this.loading = false;
            this.isPaginationIdentified = false;
            this.isDataNotAvailable1 = true;
          }
          else {
            this.isDataNotAvailable1 = false;
            this.isPaginationIdentified = true;

            var identifieds = [];
            var addedDates = [];
            res.forEach(function (item, index) {

              if (index === 0 || addedDates.indexOf(item.createdDate) < 0) {
                identifieds.push({ "date": item.createdDate, "faces": [item], "timestamp": item.timestamp });
                addedDates.push(item.createdDate);
              }
              else {
                identifieds.forEach(function (addedItem, addedIndex) {
                  if (addedItem.date === item.createdDate) {
                    addedItem.faces.push(item);
                  }
                });
              }
            });
            this.identifiedDetails = identifieds;
            this.allItemsIdentified = this.identifiedDetails;
            this.checkFlag = 1;
            if (flag == 0) {

              this.setPage(-1, 1);
            }

            //this.identified = res.length;
            this.identified = this.totalItemsIdentified;
            if (res.length != 0) {
              this.isIdentifiedPresent = true;
            }

            setTimeout(() => {
              this.cropImages(this.identifiedDetails);
            }, 1000);
          }


        },
        err => {
          //this.loading = false;
          
          this.isIdentifiedPresent = false;
          this.isDataNotAvailable1 = true;
          if (err.status == 404) {
            this.apiCount++;
            if (this.apiCount == 2) {
              this.loading = false;
              
            }
          }
          else {
            this.loading = false;
            
          }
        }
        );

    }

  }

  getUnidentifiedDetails(flag, currentPage) {

    if (currentPage < 0) {
      this.isDataNotAvailable = true;
    }
    else {
      this.isDataNotAvailable = false;
      this.unidentifiedDetails = [];
      this.loading = true;
      var length = 0;
      var url;
      var check = 0;
      var itemId = 0;

      console.log("current page in unidentified = ", currentPage);
      if (flag == 0) {
        url = this.vmUrl + '/faces?status=0&filter=date&page=0&limit=10';
      }
      else if (flag == 1) {
        url = this.vmUrl + '/faces?status=0&filter=date&page=' + currentPage + '&limit=10';
      }

      this.http.get<any[]>(url,
      ).subscribe(
        res => {
          console.log("## UNDENTIFIED RESPONSE : ", res);


          this.unidentifiedDetails = [];
          var time: any;
          if (flag == 0) {
            this.apiCount++;
            if (this.apiCount == 2) {
              this.loading = false;
              

            }

          }
          else if (flag == 1) {
            this.loading = false;
            
          }

          console.log("facedetails getunidentified : ", res);
          if (res.length == 0) {
            //this.loading = false;
            this.isPaginationUnidentified = false;
            this.isDataNotAvailable = true;
          }
          else {
            this.isDataNotAvailable = false;
            this.isPaginationUnidentified = true;

            var unIdentifieds = [];
            var addedDates = [];
            res.forEach(function (item, index) {
              if (index === 0 || addedDates.indexOf(item.createdDate) < 0) {
                unIdentifieds.push({ "date": item.createdDate, "faces": [item], "timestamp": item.timestamp });
                addedDates.push(item.createdDate);
              }
              else {
                unIdentifieds.forEach(function (addedItem, addedIndex) {
                  if (addedItem.date === item.createdDate) {
                    addedItem.faces.push(item);
                  }
                });
              }
            });
            this.unidentifiedDetails = unIdentifieds;
            console.log("unidentified final :", this.unidentifiedDetails);

            this.checkFlag = 0;
            this.allItemsUnidentified = this.unidentifiedDetails;
            if (flag == 0) {

              this.setPage(-1, 0);
            }

            //this.unidentified = res.length;
            this.unidentified = this.totalItemsUnidentified;
            console.log("LENGTH OF unidentified : ", this.unidentified);
            if (res.length != 0) {
              this.isUnidentifiedPresent = true;
            }

            setTimeout(() => {
              this.cropImages(this.unidentifiedDetails);

            }, 1000);
          }


        },
        err => {
          //this.loading = false;
          
          this.isUnidentifiedPresent = false;
          this.isDataNotAvailable = true;
          if (err.status == 404) {
            this.apiCount++;
            if (this.apiCount == 2) {
              this.loading = false;
              
            }

          }
          else {
            this.loading = false;
          
          }
        }
        );
    }

  }


  setPage(page: number, flag) {
    console.log("FLAG HERE :: ", this.checkFlag);
    console.log("PAGE HERE :: ", page);

    this.checked1 = false;
    this.checked2 = false;
    this.isAllUnknown = false;
    this.isAllKnown = false;


    if (this.checkFlag == 0) {

      if (page == -1) {
        this.page = page
        // get pager object from service
        this.pagerUnidentified = this.pagerService.getPager(this.totalItemsUnidentified, page);
        // get current page of items
        this.pagedItemsUnidentified = this.allItemsUnidentified.slice(this.pagerUnidentified.startIndex, this.pagerUnidentified.endIndex + 1);

      }
      else {
        this.page = page
        this.pagerUnidentified = this.pagerService.getPager(this.totalItemsUnidentified, page);
        this.pagedItemsUnidentified = this.allItemsUnidentified.slice(this.pagerUnidentified.startIndex, this.pagerUnidentified.endIndex + 1);
        this.getUnidentifiedDetails(1, page);
      }
    }
    else if (this.checkFlag == 1) {
      if (page == -1) {
        this.page = page
        this.pagerIdentified = this.pagerService.getPager(this.totalItemsIdentified, page);
        this.pagedItemsIdentified = this.allItemsIdentified.slice(this.pagerIdentified.startIndex, this.pagerIdentified.endIndex + 1);
      }
      else {
        this.page = page
        this.pagerIdentified = this.pagerService.getPager(this.totalItemsIdentified, page);
        this.pagedItemsIdentified = this.allItemsIdentified.slice(this.pagerIdentified.startIndex, this.pagerIdentified.endIndex + 1);
        this.getIdentifiedDetails(1, page);
      }
    }
    else if (this.checkFlag == 2) {

      if (page == -1) {
        this.page = 0
        this.pagerHistory = this.pagerService.getPager(this.totalItemsHistory, 0);
        this.pagedItemsHistory = this.allItemsHistory.slice(this.pagerHistory.startIndex, this.pagerHistory.endIndex + 1);
      }
      else {
        this.page = page
        this.pagerHistory = this.pagerService.getPager(this.totalItemsHistory, page);
        this.pagedItemsHistory = this.allItemsHistory.slice(this.pagerHistory.startIndex, this.pagerHistory.endIndex + 1);
        this.getUserHistory(page);
      }

    }
  }

  clear(idHere) {
    var id = document.getElementById(idHere);
    if (id) {
      id.remove();
    }
  }

  addSocketResults(socketData) {
    var check = 0;
    var check = 0;
    if (socketData.length == 0) {
      console.log("### NO SOCKET DATA PRESENT ");
    }
    else {
      this.isUnidentifiedPresent = true;
      this.isDataNotAvailable = false;
      this.unidentifiedDetails.forEach(item => {
        if (socketData[0].createdDate === item.date) {
          check = 1;
          item.faces.unshift({ 'age': socketData[0].age, 'createdAt': socketData[0].createdAt, 'createdDate': socketData[0].createdDate, 'deviceName': socketData[0].deviceName, 'faceRectangle': socketData[0].faceRectangle, 'gender': socketData[0].gender, 'status': socketData[0].status, 'timestamp': socketData[0].timestamp, 'imgUrl': socketData[0].imgUrl, '__type': socketData[0].__type, '_id': socketData[0]._id });
        }
      });
      if (check == 0) {
        this.unidentifiedDetails.unshift({ 'date': socketData[0].createdDate, 'faces': socketData, 'timestamp': socketData[0].timestamp });
      }
      console.log("+++ AFTER OPERATION UNIDENTIFIED ::::  ", this.unidentifiedDetails);
      this.totalItemsUnidentified = this.totalItemsUnidentified + this.unidentifiedDetails.length;
    }

    setTimeout(() => {
      this.cropImages(this.unidentifiedDetails);
    }, 1000);

  }


  removeRecord(flag) {
    this.removeSocketListener();
    var context = this;
    this.loading = true;
    console.log("remove userid : ", this.tempUserId);
    if (flag == 0) {
      this.http.delete(this.vmUrl + '/faces?faceIds=' + this.tempUserId,
        { observe: 'response' }
      ).subscribe(
        (res: any) => {

          console.log("record removed");
          this.socketConnection();
          this.toastrService.Success("", "User Record Removed Successfully");
          //this.ngOnInit2(1);
          this.getIdentifiedDetails(1, 0);
          this.getTotalCount();
        },
        err => {
          this.loading = false;
          this.socketConnection();
          this.toastrService.Error("", "Error Occurred While Removing User Record");
          console.log("Error response", err);
          if (err.status == 500) {
            console.log(err);
          }
        })
    }
    else if (flag == 1) {
      this.http.delete(this.vmUrl + '/faces?faceIds=' + this.tempUserId,
        { observe: 'response' }
      ).subscribe(
        (res: any) => {
          console.log("record removed unknown : ", res);
          this.socketConnection();
          this.toastrService.Success("", "User Record Removed Successfully");
          //this.ngOnInit2(0);
          this.getUnidentifiedDetails(1, 0);
          this.getTotalCount();
        },
        err => {
          this.loading = false;
          this.socketConnection();
          this.toastrService.Error("", "Error Occurred While Removing User Record");
          console.log("Error response", err);
          if (err.status == 500) {
            console.log(err);
          }
        })
    }

  }

  editRecord() {

    this.loading = true;
    if (this.tempAge == '') {
      this.tempAge = 22;
    }

    if (this.tempGender == '') {
      this.tempGender = 'Male';
    }

    if (this.userdata == '') {
      this.userdata = this.tempUserName;
    }

    console.log("$$$ toggleSwitch2 : ", this.toggleSwitch2);
    var updateData =
      {
        "age": this.tempAge,
        "gender": this.tempGender,
        "userData": this.userdata,
        "flag": this.toggleSwitch2
      }

    console.log("updateData :: ", updateData);

    this.http.put(this.vmUrl + '/faces/' + this.tempUserId, updateData)
      .subscribe(
      res => {
        this.toggleSwitch2 = false;
        this.loading = false;
        this.toastrService.Success("", "User Record Updated Successfully");
        console.log("updated res : ", res);
        this.getIdentifiedDetails(1, this.currentPage);
        this.userdata = '';
      },
      err => {
        this.toggleSwitch2 = false;
        this.loading = false;
        this.toastrService.Error("", "Error Occurred While Updating User Record");
        this.userdata = '';
        console.log("error response", err);
      });
  }


  getUserHistory(page) {

    //this.currentPageHistory = 0;
    this.maxSizeHistory = 10;
    //this.checkFlag2 = 0;

    if (page < 0) {
      this.isDataNotAvailable2 = true;
    }
    else {

      this.isDataNotAvailable2 = false;
      var url1 = this.vmUrl + '/users/history/count?persistedFaceId=' + this.userDetails.persistedFaceId
      var url2 = this.vmUrl + '/users/history?persistedFaceId=' + this.userDetails.persistedFaceId + '&page=' + page + '&limit=' + this.maxSizeHistory;
      this.http.get<any>(url1, )
        .subscribe(
        res => {

          console.log("res count : ", res.count);
          if (res.count != 0) {
            this.isPaginationHistory = true;
          }
          console.log("count is :: ", res.count);
          this.totalItemsHistory = res.count;

          this.historyAll = [];
          console.log("view : ", this.userDetails.userData);
          this.loading = true;
          this.http.get<any[]>(url2, ).subscribe(
            res => {
              var time: any;
              this.loading = false;
              console.log("history response all : ", res.length);
              if (res.length != 0) {
                this.isDataNotAvailable2 = false;
                res.forEach(item => {
                  time = item.timestamp;
                  time = new Date(item.timestamp * 1000);
                  time = time.toLocaleString();
                  this.historyAll.push({ 'camId': item.camId, 'timestamp': time, '_id': item._id, 'deviceName': item.deviceName });
                });

              }
              else {
                this.isDataNotAvailable2 = true;
                this.toastrService.Error("", "History Data Not Available");
              }
            },
            err => {
              this.loading = false;
              this.toastrService.Error("", "Something went wrong!!!");
              console.log("Error occured");
            }
          );

        },
        err => {
          console.log("error response", err);
        });
    }
  }

  viewHistory(pdata) {

    //document.getElementById("timelineTab").className = "active";
    console.log(" ***** checkFlag2checkFlag2 :: ",this.checkFlag2);
    this.clickedTab2(0);

    //this.checkFlag2 = 0;
    this.totalItemsHistory = 0;
    this.currentPageHistory = 0;
    this.maxSizeHistory = 15;
    this.showReport(pdata);
    console.log("pdata is :: ", pdata);
    this.userDetails = pdata;

    this.http.get<any>(this.vmUrl + '/users/history/count?persistedFaceId=' + pdata.persistedFaceId, )
      .subscribe(
      res => {


        if (res.count != 0) {
          this.isPaginationHistory = true;
        }
        else {
          this.isDataNotAvailable2 = true;
        }
        console.log("count is :: ", res.count);
        this.totalItemsHistory = res.count;

        this.historyAll = [];
        console.log("view : ", pdata.userData);
        this.http.get<any[]>(this.vmUrl + '/users/history?persistedFaceId=' + pdata.persistedFaceId + '&page=0&limit=' + this.maxSizeHistory, ).subscribe(
          res => {
            this.isDataNotAvailable2 = false;
            var time: any;
            console.log("history response all : ", res.length);
            if (res.length != 0) {
              this.isDataNotAvailable2 = false;

              res.forEach(item => {
                time = item.timestamp;
                time = new Date(item.timestamp * 1000);
                time = time.toLocaleString();
                this.historyAll.push({ 'camId': item.camId, 'timestamp': time, '_id': item._id, 'deviceName': item.deviceName });
              });
              this.allItemsHistory = this.historyAll;
              this.checkFlag = 2;
              this.setPage(-1, 2);
              document.getElementById("historyPopup2").click();

            }
            else {
              this.isDataNotAvailable2 = true;
              this.toastrService.Error("", "History Data Not Available");
            }
          },
          err => {
            this.isDataNotAvailable2 = true;
            console.log("Error occured");
          }
        );

      },
      err => {
        this.isDataNotAvailable2 = true;
        console.log("error response", err);
      });

  }
}
















