import { Component, OnInit, NgZone, NgModule, ElementRef, ViewChild, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Socket } from 'ng-socket-io';
import * as io from 'socket.io-client';
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import * as data from '../../../../config'
import { concat } from 'rxjs/operators/concat';
import { concatAll } from 'rxjs/operators/concatAll';
import { ToastrService } from '../../services/toastr.service';
declare const $: any;
@Component({
  selector: 'app-floor-map',
  templateUrl: './floor-map.component.html',
  styleUrls: ['./floor-map.component.css']
})

export class FloorMapComponent implements OnInit {
  vmUrl: string;
  userId: string;
  socket: SocketIOClient.Socket;
  floormap: string;
  cameras1: any[];
  aggregators: any[];
  thumbnail: string;
  thumbnailImg: boolean;
  floorMapFlag: boolean;
  editMapFlag: boolean;
  aggrType: string;
  mapName: string;
  maps: any[];
  errors: Array<string> = [];
  floorname: string;
  plotCamera: any[];
  substring: string;
  filter: string;
  dragAreaClass: string = 'dragarea';
  inBounds = true;
  drawEyesightFlag:boolean = false;
  eyesightId: string;
  drawCheckFlag:boolean = false;
  edge = {
    top: true,
    bottom: true,
    left: true,
    right: true
  };
  resetChangesFlag:boolean = false;
  dragposition:string='';


  @Input() fileExt: string = "JPG, GIF, PNG";
  @Input() maxFiles: number = 1;
  @Input() maxSize: number = 5; // 5MB
  @Output() uploadStatus = new EventEmitter();
  public loading;

  constructor(private toastrService: ToastrService,public router: Router, private http: HttpClient, private zone: NgZone, public domSanitizer: DomSanitizer) {
    var session = JSON.parse(localStorage.getItem('sessionConfiguration'));
    console.log("@@@@@@@@@",session);
    if(session != null){
      this.vmUrl = session.vmUrl;
    }
    this.floorMapFlag = false;
    this.userId = localStorage.getItem('userId');
    this.socket = io.connect(this.vmUrl, { secure: true });
    this.floormap = data.configData.rawImgSrc;
    this.thumbnail = data.configData.rawImgSrc;
    this.cameras1 = [];
    this.mapName = '';
    this.maps = [];
    this.plotCamera = [];
    this.floorname = '';
    this.substring = '';
    this.filter = 'aggregator';
    this.eyesightId = '';
  }

  ngOnInit() {
    this.loading = true;
    sessionStorage.setItem("selectedCamIndex", "0");
    sessionStorage.setItem("selectedAggrIndex", "0");
    this.getFloorMaps();
    this.socketConnection();   
  }

  socketConnection() {
    this.socket.on('rawImage/' + this.userId, (msg: any) => {
      this.thumbnail = '';
      console.log("Raw image received");
      var data = JSON.parse(msg.message);
      this.thumbnailImg = true;
      this.thumbnail = data.imgBase64;
    });
  };

  addFloorMap() {
    console.log("in add floor map");
    this.editMapFlag = false;
    this.floorMapFlag = false;
  };

  resetChanges(){
    this.getFloorMaps();
    this.drawEyesightFlag = false;
  };

  mapEyesight(){
      this.initDraw(this.eyesightId);
  }

  initDraw(eyesightId) {
    this.drawCheckFlag = true;
    var canvas = document.getElementById('floorMapId');
    console.log("CANVAS:",canvas.getBoundingClientRect());
    function setMousePosition(e) {
      //console.log("in set position");
        var ev = e || window.event; //Moz || IE
        //console.log("######",ev.clientX,ev.clientY);
        mouse.x = ev.clientX - canvas.getBoundingClientRect().left;
        mouse.y = ev.clientY - canvas.getBoundingClientRect().top;
    };
    var mouse = {
        x: 0,
        y: 0,
        startX: 0,
        startY: 0
    };
    var element = null;
    var _this = this;
   
      canvas.onmousemove = function (e) {
        if(_this.drawCheckFlag === true){
        setMousePosition(e);
        }
        if (element !== null) {
            element.style.width = Math.abs(mouse.x - mouse.startX) + 'px';
            element.style.height = Math.abs(mouse.y - mouse.startY) + 'px';
            element.style.left = (mouse.x - mouse.startX < 0) ? mouse.x + 'px' : mouse.startX + 'px';
            element.style.top = (mouse.y - mouse.startY < 0) ? mouse.y + 'px' : mouse.startY + 'px';
        }
        
    }
    canvas.onclick = function (e) {
      
        if (element !== null) {
            element = null;
            canvas.style.cursor = "default";
            console.log("finsihed.",mouse);  
            _this.drawCheckFlag = false;
        } else {
          if(_this.drawCheckFlag === true){
            console.log("begun.");
            mouse.startX = mouse.x;
            mouse.startY = mouse.y;
            element = document.createElement('div');
            element.className = 'rectangle';
            element.id = eyesightId + '_box';
            element.style.left = (mouse.x) + 'px';
            element.style.top = (mouse.y) + 'px';
            element.style.position = 'absolute';
            element.style.border = '2px solid red';
            canvas.appendChild(element);
            canvas.style.cursor = "crosshair";      
        }
      }
    }
  }

  onDragBegin(event) {
    console.log("Initial drag position:",this.dragposition);
    this.resetChangesFlag = true;
    this.drawEyesightFlag = false;
    //this.drawCheckFlag = true;
    console.log("Flag:",this.resetChangesFlag);
  };
  
  checkEdge(event) {
    this.edge = event;
    console.log('edge:', event);
  }
  onDragEnd(event) {
    console.log("EVENT:",event);
    this.drawEyesightFlag = true;
    //this.drawCheckFlag = true;
    var canvas = document.getElementById('floorMapImage');
    var frame = JSON.parse(JSON.stringify(canvas.getBoundingClientRect()));
    this.eyesightId = event.id;
    var objects = document.getElementById(event.id);
    var objectRatio = JSON.parse(JSON.stringify(objects.getBoundingClientRect()));
    //console.log(objectRatio);
    if (objectRatio.x > frame.x && objectRatio.x < (frame.x + frame.width) &&
      objectRatio.y > frame.y && objectRatio.y < (frame.y + frame.height)) {
        console.log("lol",event);
    }
    else {
      
    }
  };

  rotate(cam1){
    console.log(cam1.camId);
    var rotationAngle = cam1.rotationAngle;

    var canvas = document.getElementById('floorMapImage');
    var frame = JSON.parse(JSON.stringify(canvas.getBoundingClientRect()));

    var objects = document.getElementById(cam1.camId);
    var objectRatio = JSON.parse(JSON.stringify(objects.getBoundingClientRect()));
    //console.log(objectRatio);
    if (objectRatio.x > frame.x && objectRatio.x < (frame.x + frame.width) &&
      objectRatio.y > frame.y && objectRatio.y < (frame.y + frame.height)) {
        var cssrotate = 'rotate(' + rotationAngle + 'deg)';
        objects.style.webkitTransform = objects.style.transform + cssrotate;
        console.log(objects.style.webkitTransform);
        cam1.rotationAngle = rotationAngle + 45;
        console.log( "angle: " + cam1.rotationAngle);
    }
    else {
    
    }
  };

  getFloorMaps() {
    this.http.get<any[]>(this.vmUrl + '/maps'
    ).subscribe(
      res => {
        console.log("get mapssss ");
        this.loading = false;
        console.log("maps", res);
        if (res.length === 0) {
          this.editMapFlag = false;
          this.floorMapFlag = false;
        }
        else {
          this.maps = res;
          this.editMapFlag = true;
          console.log(this.maps[0].name);
          this.floorname = this.maps[0]._id;
          this.onMapChange(this.floorname);
          // var event = 'aggregator';
          this.onChangeRadio(this.filter);
        }

      },
      err => {
        this.loading = false;
        console.log("Error occured");
      });

  };

  onMapChange(mapId) {
    console.log("Mapname:", mapId);
    this.maps.forEach(item => {
      if (mapId === item._id) {
        this.floormap = item.base64;
        this.plotCamera = item.cameras;
        console.log("Plot camera:", this.plotCamera);
        setTimeout(()=>{    //<<<---    using ()=> syntax
          var divHeight = $('#floormaps').height();
          console.log("DIVHEIGHT:",divHeight);
          $('#sidebarfloor').css('min-height', divHeight+'px');
        }, 1000);
        this.drawEyeSight(this.plotCamera);
      }
    });
  };

  clearEyeSight(){
    if (document.getElementsByClassName('eyesight')) {
      var elements = document.getElementsByClassName('eyesight');
      while (elements.length > 0) {
          elements[0].parentNode.removeChild(elements[0]);
      }
    }
    if (document.getElementsByClassName('rectangle1')) {
      var elements = document.getElementsByClassName('rectangle1');
      while (elements.length > 0) {
          elements[0].parentNode.removeChild(elements[0]);
      }
    }
    if (document.getElementsByClassName('rectangle')) {
      var elements = document.getElementsByClassName('rectangle');
      while (elements.length > 0) {
          elements[0].parentNode.removeChild(elements[0]);
      }
    }
  }

  drawEyeSight(eyeSight){
    this.clearEyeSight();
    console.log("@@@@@@@@@",eyeSight);
    setTimeout(() => {    //<<<---    using ()=> syntax
      var imageDiv = document.getElementById('floorMapId');
      var resolution =  JSON.parse(JSON.stringify(imageDiv.getBoundingClientRect()));
      if(imageDiv!=null){
        console.log("$$$$$$$",resolution);
        eyeSight.forEach(item=>{
          //console.log(item);
          
          console.log(item.eyesight);
          if(item.eyesight !=undefined ){
            
            var element = document.createElement('div');
            element.id = item.camId + "_eyesight";
            element.className = 'rectangle1';
            element.style.left = (item.eyesight.x*resolution.width)/100 + 'px';
            element.style.top = (item.eyesight.y*resolution.height)/100 + 'px';
            element.style.width = ((item.eyesight.x2-item.eyesight.x)*resolution.width)/100 + 'px';
            element.style.height = ((item.eyesight.y2-item.eyesight.y)*resolution.height)/100 + 'px';
            element.style.border = "2px solid red";
            element.style.position = "absolute";
            imageDiv.appendChild(element);
          }
        });
      } 
    }, 1000);
  };

  filterCameras(string) {
    this.substring = string;
    console.log(this.substring);
    this.onChangeRadio(this.filter);
  };


  onChangeRadio(event) {

    console.log("On change radio:", event, this.substring);
    this.filter = event;
    this.http.get<any[]>(this.vmUrl + '/analytics/cameras/list?filter=' + event + '&deviceName=' + this.substring
    ).subscribe(
      res => {
        console.log("Cameras:",res);
        this.cameras1 = res;
        this.cameras1.forEach(item=>{
            //console.log(item);
            item.cameras.forEach(item1=>{
                item1["rotationAngle"] = 0;
                //console.log(item1);
            });
        });
      },
      err => {
        console.log("Error occured");
      });
  };


  mapCamera() {
    this.loading = true;
    console.log(this.mapName);
    var cameramappings = [];
    var updateCam = [];
    var canvas = document.getElementById('floorMapImage');
    var frame = JSON.parse(JSON.stringify(canvas.getBoundingClientRect()));
    console.log("frameratio:", frame);
    this.cameras1.forEach(item => {
      console.log(this.cameras1);
      item.cameras.forEach(item1 => {
        console.log(item1);
        console.log(item1.camId);
        var objects = document.getElementById(item1.camId);

        var objectRatio = JSON.parse(JSON.stringify(objects.getBoundingClientRect()));
        console.log(objectRatio);
        console.log(frame);
        if (objectRatio.x > frame.x && objectRatio.x < (frame.x + frame.width) &&
          objectRatio.y > frame.y && objectRatio.y < (frame.y + frame.height)) {
            console.log("In upper validation");
            if(document.getElementById(item1.camId + '_box')){
              console.log("in if");
              var bboxCords = document.getElementById(item1.camId + '_box');
              var data = { 
                "camId": item1.camId, 
                "rotationAngle":item1.rotationAngle-45,
                "deviceName": item1.deviceName, 
                "x": ((objectRatio.x - frame.x) / frame.width) * 100, 
                "y": ((objectRatio.y - frame.y) / frame.height) * 100,
                "eyesight": {
                    "x": ((parseInt(bboxCords.style.left)) / frame.width) * 100,
                    "y": ((parseInt(bboxCords.style.top))/ frame.height) * 100,
                    "x2": ((parseInt(bboxCords.style.left) + parseInt(bboxCords.style.width)) / frame.width) * 100,
                    "y2": ((parseInt(bboxCords.style.top) + parseInt(bboxCords.style.height))/ frame.height) * 100,
                }
              };
              cameramappings.push(data);    
            }
            else{
              console.log("in else");
              var data1 = { 
                "camId": item1.camId, 
                "rotationAngle":item1.rotationAngle-45,
                "deviceName": item1.deviceName, 
                "x": ((objectRatio.x - frame.x) / frame.width) * 100, 
                "y": ((objectRatio.y - frame.y) / frame.height) * 100,
                "eyesight": {}
              };
              cameramappings.push(data1);
            }
          updateCam.push(item1.camId);

        }
      });
    });
    console.log("cameramappings:", cameramappings);

    var mappingData = {
      "name": this.mapName,
      "base64": this.floormap,
      "cameras": cameramappings
    };
    console.log("mappingData", mappingData, "updateCam:", updateCam);
    this.http.post(this.vmUrl + '/maps', mappingData)
      .subscribe(
      res => {
        console.log("MAP preview");
        console.log(res);
        this.resetChangesFlag = false;
        var requestBody = {
          "isPlotted": 1
    
        };
        this.http.put<any[]>(this.vmUrl + '/cameras/plot?camIds=' + updateCam, requestBody)
          .subscribe(
          res => {
            console.log("Update camera");
            console.log(res);
          },
          err => {
            console.log("error response", err);
        });
        this.toastrService.Success("","Floor map added successfully");
        this.getFloorMaps();
        //window.alert("Floor map added successfully");
      },
      err => {
        console.log("error response", err);
        this.loading = false;
        this.toastrService.Error("","Unique map name should be given");
      });
    
  };

  camRemove(cam) {
    // console.log(cam);
    var requestBody = {
      "isPlotted": 0

    };
    this.http.put<any[]>(this.vmUrl + '/cameras/plot?camIds=' + cam.camId, requestBody)
      .subscribe(
      res => {
        console.log("Update camera");
        console.log(res);

      },
      err => {
        console.log("error response", err);
      });
    console.log("plotted cameras:", this.plotCamera);
    this.plotCamera.forEach((item1, index) => {
      if (cam.camId === item1.camId) {
        console.log(item1);
        this.plotCamera.splice(index, 1);
      }
    });
    console.log("plotted cameras:", this.plotCamera);
    var camUpdateReq = { "cameras": this.plotCamera };
    this.http.put<any[]>(this.vmUrl + '/maps/' + this.floorname, camUpdateReq)
      .subscribe(
      res => {
        console.log("Update camera");
        console.log(res);
        this.toastrService.Success("","Camera removed");
        //window.alert("Camera removed");
        this.substring = '';
        this.onChangeRadio(this.filter);
      },
      err => {
        console.log("error response", err);
      });
    
      if(document.getElementById(cam.camId + '_eyesight')){
        var eyesightDiv = document.getElementById(cam.camId + '_eyesight');
        eyesightDiv.parentNode.removeChild(eyesightDiv); 
      }
  };

  editCamera() {
    this.loading = true;
    console.log(this.floorname);
    var camUpdate = [];
    var updateCam = [];
    var canvas = document.getElementById('floorMapImage');
    var frame = JSON.parse(JSON.stringify(canvas.getBoundingClientRect()));
    console.log("frameratio:", frame);

    this.plotCamera.forEach(item1 => {
    
      var objects = document.getElementById(item1.camId);
      console.log(objects);
      var objectRatio = JSON.parse(JSON.stringify(objects.getBoundingClientRect()));

      if (objectRatio.x > frame.x && objectRatio.x < (frame.x + frame.width) &&
        objectRatio.y > frame.y && objectRatio.y < (frame.y + frame.height)) {
        camUpdate.push({ "camId": item1.camId, "rotationAngle":item1.rotationAngle,"eyesight":item1.eyesight,"deviceName": item1.deviceName, "x": ((objectRatio.x - frame.x) / frame.width) * 100, "y": ((objectRatio.y - frame.y) / frame.height) * 100 });
        updateCam.push(item1.camId);
      }
    });

    this.cameras1.forEach(item => {
      item.cameras.forEach(item1 => {
        if (item1.isPlotted === 0) {
          console.log(item1.camId);
          var objects = document.getElementById(item1.camId);
          var objectRatio = JSON.parse(JSON.stringify(objects.getBoundingClientRect()));
          console.log(objectRatio);
          if (objectRatio.x > frame.x && objectRatio.x < (frame.x + frame.width) &&
            objectRatio.y > frame.y && objectRatio.y < (frame.y + frame.height)) {
            //camUpdate.push({ "camId": item1.camId,"rotationAngle":item1.rotationAngle-45,"deviceName": item1.deviceName, "x": ((objectRatio.x - frame.x) / frame.width) * 100, "y": ((objectRatio.y - frame.y) / frame.height) * 100 });
            updateCam.push(item1.camId);
            if(document.getElementById(item1.camId + '_box')){
              console.log("in if");
              var bboxCords = document.getElementById(item1.camId + '_box');
              var data = { 
                "camId": item1.camId, 
                "rotationAngle":item1.rotationAngle-45,
                "deviceName": item1.deviceName, 
                "x": ((objectRatio.x - frame.x) / frame.width) * 100, 
                "y": ((objectRatio.y - frame.y) / frame.height) * 100,
                "eyesight": {
                    "x": ((parseInt(bboxCords.style.left)) / frame.width) * 100,
                    "y": ((parseInt(bboxCords.style.top))/ frame.height) * 100,
                    "x2": ((parseInt(bboxCords.style.left) + parseInt(bboxCords.style.width)) / frame.width) * 100,
                    "y2": ((parseInt(bboxCords.style.top) + parseInt(bboxCords.style.height))/ frame.height) * 100,
                }
              };
              camUpdate.push(data); 
              console.log("!!!!!!!!!!",camUpdate);   
            }
            else{
              console.log("in else");
              var data1 = { 
                "camId": item1.camId, 
                "rotationAngle":item1.rotationAngle-45,
                "deviceName": item1.deviceName, 
                "x": ((objectRatio.x - frame.x) / frame.width) * 100, 
                "y": ((objectRatio.y - frame.y) / frame.height) * 100,
                "eyesight": {}
              };
              camUpdate.push(data1);
            }   
          }
        }
      });
    });
    console.log("!!!!!!!!!!",camUpdate);
    var camUpdateReq = { "cameras": camUpdate };
    this.http.put<any[]>(this.vmUrl + '/maps/' + this.floorname, camUpdateReq)
      .subscribe(
      res => {
        this.loading = false;
        console.log("Update camera");
        console.log(res);
        //window.alert("Cameras updated");
        this.toastrService.Success("","Cameras updated");
        var requestBody = {
          "isPlotted": 1
    
        };
        this.http.put<any[]>(this.vmUrl + '/cameras/plot?camIds=' + updateCam, requestBody)
          .subscribe(
          res => {
            this.clearEyeSight();
            this.getFloorMaps();
            console.log("Update camera");
            console.log(res);
          },
          err => {
            console.log("error response", err);
        });
      },
      err => {
        console.log("error response", err);
      });
  };

  deleteMap(){
    console.log("########",this.plotCamera);
    var deleteCams = [];
    this.plotCamera.forEach(item => {
      deleteCams.push(item.camId);
    });
    console.log(deleteCams);
    this.loading = true;
    console.log(this.floorname);
    this.http.delete(this.vmUrl + '/maps/' + this.floorname,
    { observe: 'response' }
      ).subscribe(
    (res: any) => {
      this.toastrService.Success("","Floor map deleted successfully");
      this.getFloorMaps();
      //this.loading = false;
      var requestBody = {
        "isPlotted": 0
  
      };
      this.http.put<any[]>(this.vmUrl + '/cameras/plot?camIds=' + deleteCams, requestBody)
        .subscribe(
        res => {
          console.log("Update camera");
          console.log(res);         
        },
        err => {
          console.log("error response", err);
      });
      
    },
    err => {
      this.loading = false;
      console.log("Error response", err);
      this.toastrService.Error("","Error in deleting maps");
    });
  }

  onFileChange(event) {
    let files = event.target.files;
    console.log(event);
    this.saveFiles(files);
  }

  saveFiles(files) {
    this.errors = []; // Clear error
    // Validate file size and allowed extensions
    if (files.length > 0 && (!this.isValidFiles(files))) {
      this.uploadStatus.emit(false);
      return;
    }
    if (files.length > 0) {
      console.log(files);
      let formData: FormData = new FormData();
      for (var j = 0; j < files.length; j++) {
        formData.append("file[]", files[j], files[j].name);
      }
      var file: File = files[0];
      var myReader: FileReader = new FileReader();
      myReader.onloadend = (e) => {
        //console.log("!!!!!!!!!!",myReader.target);
        this.floormap = myReader.result;
        this.floorMapFlag = true;
        setTimeout(()=>{    //<<<---    using ()=> syntax
          var divHeight = $('#floormaps').height();
          console.log("DIVHEIGHT:",divHeight);
          $('#sidebarfloor').css('min-height', divHeight+'px');
        }, 1000);

        this.filter = 'aggregator';
        this.onChangeRadio(this.filter);
      }
      myReader.readAsDataURL(file);
    }
  };


  private isValidFiles(files) {
    // Check Number of files
    if (files.length > this.maxFiles) {
      this.errors.push("Error: At a time you can upload only " + this.maxFiles + " files");
      return;
    }
    this.isValidFileExtension(files);
    return this.errors.length === 0;
  };

  private isValidFileExtension(files) {
    // Make array of file extensions
    var extensions = (this.fileExt.split(','))
      .map(function (x) { return x.toLocaleUpperCase().trim() });
    for (var i = 0; i < files.length; i++) {
      // Get file extension
      var ext = files[i].name.toUpperCase().split('.').pop() || files[i].name;
      // Check the extension exists
      var exists = extensions.includes(ext);
      if (!exists) {
        this.errors.push("Error (Extension): " + files[i].name);
      }
      // Check file size
      this.isValidFileSize(files[i]);
    }
  };

  private isValidFileSize(file) {
    var fileSizeinMB = file.size / (1024 * 1000);
    var size = Math.round(fileSizeinMB * 100) / 100; // convert upto 2 decimal place
    if (size > this.maxSize)
      this.errors.push("Error (File Size): " + file.name + ": exceed file size limit of " + this.maxSize + "MB ( " + size + "MB )");
  };

  cancelMap() {
    this.editMapFlag = false;
    this.floorMapFlag = false;
    this.drawEyesightFlag = false;
  }

  getRawImage(cam) {
    console.log("Raw image:", cam);
    var data = {
      "deviceType": cam.deviceType,
      "streamingUrl": cam.streamingUrl,
      "cameraId": cam.camId,
      "aggregatorId": cam.aggregator,
      "computeEngineId": cam.computeEngine
    };
    console.log(data);
    this.http.post(this.vmUrl + '/cameras/raw', data)
      .subscribe(
      res => {
        console.log("In take preview");
        console.log(res);
      },
      err => {
        console.log("error response", err);
      });
  };
}
