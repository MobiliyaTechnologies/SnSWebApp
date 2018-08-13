import { Component, OnInit, NgZone, NgModule, ElementRef, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, NavigationExtras } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
@Component({
  selector: 'videoretention',
  templateUrl: './video-retention.component.html',
  styleUrls: ['./video-retention.component.css']
})
export class VideoRetentionComponent implements OnInit {

  @ViewChild('myCanvas') myCanvas: ElementRef;
  public context: CanvasRenderingContext2D;

  vmUrl: string;
  socket: SocketIOClient.Socket;
  userId: string;
  isNewVideo: Boolean;
  isVideoList: Boolean;
  cameraList: any[];
  videosList: any[];
  videoName: string;
  cameraName: string;
  camIdName: string;
  indexId: string;
  height: number;
  Time: any;
  Date: any;
  timeDuration: number;
  retentionDuration: number;
  cameraDetails: any;
  url1: any;
  url2: any;
  loading: boolean;
  isList: boolean;
  isCam: boolean;
  videoId: any;
  analysisCost: any;
  storageCost: any;
  finalCost: any;
  cameras: any[];
  camDetails: any[];
  collapse: boolean;
  camId: any;
  videourl: any;

  current: number = 0;
  items: Array<any>;
  oneHourCost: any;
  camData: any;
  checkData: any;
  deleteVideoDate: any;
  deleteVideoId: any;


  constructor(public router: Router, private http: HttpClient, public domSanitizer: DomSanitizer, private toastrService: ToastrService, private zone: NgZone) {
    var session = JSON.parse(localStorage.getItem('sessionConfiguration'));
    console.log("@@@@@@@@@", session);
    if (session != null) {
      this.vmUrl = session.vmUrl;
    }
    this.socket = io.connect(this.vmUrl, { secure: true });
    this.userId = localStorage.getItem('userId');
    this.isNewVideo = false;
    this.isVideoList = true;
    this.cameraList = [];
    this.cameraName = '';
    this.camIdName = '';
    this.videoName = '';
    this.indexId = '';
    this.loading = false;
    this.isList = false;
    this.isCam = false;
    this.videoId = '';
    this.analysisCost = 0.067;
    // this.storageCost = 0.00019;
    // cost(0.025) / 1024 = perMB cost
    // perMB cost * 25 = storageCost;
    //this.storageCost = 0.000610352;

    this.finalCost = 0.00;
    this.cameras = [];
    this.camDetails = [];
    this.collapse = false;
    this.camId = '';
    this.camData = {};
    this.checkData = false;
  }

  ngOnInit() {
    this.loading = true;
    sessionStorage.setItem("selectedCamIndex", "0");
    sessionStorage.setItem("selectedAggrIndex", "0");
    // this.videoList();
    this.socketConnection();
    this.getCameras();
    this.getRetentionCost();
  }



  ngOnDestroy() {
    this.socket.disconnect();
  }

  collapsePanel(divId) {
    console.log("collapse clicked : ", divId);
    if (this.collapse) {
      this.collapse = false;
      console.log("collapse clicked made false: ", this.collapse);
      document.getElementById(divId).className = "panel-collapse collapse in";
    }
    else {
      this.collapse = true;
      console.log("collapse clicked made true: ", this.collapse);
    }
  }

  downloadVideo(video) {
    console.log("Video :: ", video);
  }

  getRetentionCost() {
    var cost = 0;
    this.http.get<any>(this.vmUrl + '/retention/price')
      .subscribe(
      res => {
        var price = res.price;
        cost = price / 1024;
        this.storageCost = cost * 25;
        this.oneHourCost = this.storageCost * 60;
        console.log("STORAGE COST = ", this.storageCost);
      },
      err => {
        this.toastrService.Error("", "No Data Available");
        console.log("Error occured: ", err);
      });
  }

  getDetails() {
    //this.camIdName = '';
    this.cameras = [];
    this.http.get<any>(this.vmUrl + '/videos/retention/cameras')
      .subscribe(
      res => {
        this.loading = false;
        if (res.length == 0) {
          this.isList = false;
        }
        else {
          this.cameras = res;
          this.isList = true;
        }
      },
      err => {
        this.loading = false;
        this.toastrService.Error("", "No Data Available");
        console.log("Error occured: ", err);
      });
  }

  deleteModal(videoid, camId, camdetails) {
    this.videoId = videoid;
    this.camId = camId;

    if (camdetails.videos.length == 1) {
      this.checkData = true;
    }

  };


  deleteAllModal(camdetails) {
    this.deleteVideoDate = camdetails.date;
    console.log("date : ", this.deleteVideoId);
    if (camdetails.videos.length == 1) {
      this.checkData = true;
    }
  }

  deleteAllVideo() {
    this.loading = true;
    if (this.deleteVideoId == undefined) {
      this.deleteVideoId = this.cameras[0].camId;
    }

    this.http.delete(this.vmUrl + '/videos/retention/all?date=' + this.deleteVideoDate + '&camId=' + this.deleteVideoId,
      { observe: 'response' }
    ).subscribe(
      (res: any) => {
        this.loading = false;
        this.getCameras();
      },
      err => {
        this.loading = false;
        this.videoId = '';
        this.toastrService.Error("", "Failed to delete the Video");
        console.log("error response", err);
        if (err.status == 500) {
          console.log(err);
        }
      })

  }

  loadImage() {

    let base_image = new Image();
    base_image.src = this.videourl;

    this.context = this.myCanvas.nativeElement.getContext("2d");
    let context: CanvasRenderingContext2D = this.myCanvas.nativeElement.getContext("2d");
    base_image.onload = () => {
      context.drawImage(base_image, 0, 0
        , base_image.width, base_image.height, 0, 0, context.canvas.width, context.canvas.height);
      this.loading = false;
      // this.imgResWidth = base_image.width;
      // this.imgResHeight = base_image.height;

    };
  }

  playModal(videoid, camId, camdetails, videoUrl) {

    this.videoId = videoid;
    this.camId = camId;
    this.videourl = videoUrl;
    
    setTimeout(() => {
      this.loadVideo(videoid);
    },200);

    console.log("video url : ", this.videourl);
  };


  loadVideo(videoId) {
  
    var id = document.getElementById(videoId);
    console.log("iddd : ", id);
    if (id) {
      var element = document.createElement('video');
      element.id = videoId + "video";
      element.className = 'playVideo';
      element.style.width = '100%';
      element.style.height = '100%';
      element.src = this.videourl;
      element.autoplay = true;
      element.controls = true;
      id.appendChild(element);
      
    }
  }

  clear() {
    
        if (document.getElementsByClassName('playVideo')) {
            var elements = document.getElementsByClassName('playVideo');
            while (elements.length > 0) {
                elements[0].parentNode.removeChild(elements[0]);
            }
        }
  }

  private draw() {
    this.context.beginPath();
    this.context.moveTo(0, 0);
    this.context.lineTo(300, 150);
    this.context.stroke();
  }

  deleteVideo() {
    this.loading = true;
    this.http.delete(this.vmUrl + '/videos/retention/' + this.videoId,
      { observe: 'response' }
    ).subscribe(
      (res: any) => {
        this.loading = false;
        // this.videoList();
        this.getDetails();
        this.toastrService.Success("", "Video deleted successfully");
        this.videoId = '';

        if (this.checkData == true) {

          console.log("####### NO DATA");
          this.getCameras();
        }
        else {
          console.log("#######  DATA available ");
          this.camDetails = [];
          this.http.get<any>(this.vmUrl + '/videos/retention?camId=' + this.camId)
            .subscribe(
            res => {
              this.loading = false;
              if (res.length == 0) {
              }
              else {
                this.camDetails = res;
                console.log(" camera details : ", this.camDetails);

                this.camData = {};
                var resObj = {
                  deviceName: "",
                  camId: "",
                  videoName: "",
                  dates: [],
                };
                this.camDetails.forEach(function (dateVid) {
                  resObj.deviceName = dateVid.deviceName;
                  resObj.camId = dateVid.camId;
                  resObj.videoName = dateVid.videoName;
                  var tempObj = {
                    date: dateVid.date,
                    videos: dateVid.videos
                  }
                  resObj.dates.push(tempObj);
                });
                console.log("RESULT ========= ", resObj);
                this.camData = resObj;

              }
            },
            err => {
              this.loading = false;
              this.toastrService.Error("", "No Data Available");
              console.log("Error occured: ", err);
            });
        }

      },
      err => {
        this.loading = false;
        this.videoId = '';
        this.toastrService.Error("", "Failed to delete the Video");
        console.log("error response", err);
        if (err.status == 500) {
          console.log(err);
        }
      })

  }


  socketConnection() {
    this.socket.on('videoRetention/' + this.userId, (msg: any) => {
      console.log(msg);
    });
    this.socket.on('notification', (msg: any) => {
      if (msg.type == 'videoRetention') {
        this.toastrService.Success("", "Video has been uploaded on BLOB.");
        this.zone.run(() => {
          this.videoList();
        });
      }
    });
  };

  videoList() {
    this.videosList = [];
    this.http.get<any>(this.vmUrl + '/videos/retention?status=1')
      .subscribe(
      res => {

        this.loading = false;
        if (res.length == 0) {
          this.isList = false;
        }
        else {
          this.videosList = res;
          this.isList = true;
          console.log("videolist : ", this.videosList);
          this.camIdName = this.videosList[0].deviceName;
        }
      },
      err => {
        this.loading = false;
        this.toastrService.Error("", "No Data Available");
        console.log("Error occured: ", err);
      });
  }

  getCameras() {
    //this.camIdName = '';
    this.cameras = [];
    this.http.get<any>(this.vmUrl + '/videos/retention/cameras')
      .subscribe(
      res => {

        this.loading = false;
        console.log("res length : ", res.length);
        if (res.length == 0) {
          this.isList = false;
        }
        else {
          this.cameras = res;
          this.isList = true;

          this.camIdName = this.cameras[0].deviceName;
          console.log("camera List : ", this.cameras);

          this.camDetails = [];
          this.http.get<any>(this.vmUrl + '/videos/retention?camId=' + this.cameras[0].camId)
            .subscribe(
            res => {
              this.loading = false;
              if (res.length == 0) {
              }
              else {
                this.camDetails = res;
                console.log(" camera details : ", this.camDetails);

                this.camData = {};
                var resObj = {
                  deviceName: "",
                  camId: "",
                  videoName: "",
                  dates: [],
                };
                this.camDetails.forEach(function (dateVid) {
                  resObj.deviceName = dateVid.deviceName;
                  resObj.camId = dateVid.camId;
                  resObj.videoName = dateVid.videoName;
                  var tempObj = {
                    date: dateVid.date,
                    videos: dateVid.videos
                  }
                  resObj.dates.push(tempObj);
                });
                console.log("RESULT ========= ", resObj);
                this.camData = resObj;

              }
            },
            err => {
              this.loading = false;
              this.toastrService.Error("", "No Data Available");
              console.log("Error occured: ", err);
            });


        }
      },
      err => {
        this.loading = false;
        this.toastrService.Error("", "No Data Available");
        console.log("Error occured: ", err);
      });
  }



  addVideo() {
    this.loading = true;
    this.videoName = '';
    this.cameraName = '';
    var today = new Date();
    this.Date = new Date().toISOString().split('T')[0];
    this.Time = today.getHours() + ":" + today.getMinutes();
    this.timeDuration = null;
    this.retentionDuration = null;
    this.cameraList = [];
    this.http.get<any>(this.vmUrl + '/cameras/')
      .subscribe(
      res => {
        if (res.length == 0) {
          this.toastrService.Error("", "No camera available for video recording! Please add a camera for Video Retention.")
          this.loading = false;
        }
        else {
          this.loading = false;
          this.isNewVideo = true;
          this.isVideoList = false;
          res.forEach(item => {
            if (item.streamingUrl === undefined || item.streamingUrl === null) {

            }
            else {
              this.cameraList.push({ 'deviceType': item.deviceType, 'deviceName': item.deviceName, 'streamingUrl': item.streamingUrl, "_id": item._id, "aggregatorId": item.aggregator, "computeEngineId": item.computeEngine });
            }
          });
          this.cameraName = this.cameraList[0].deviceName;
          this.cameraDetails = this.cameraList[0];
        }
      },
      err => {
        console.log("Error occured: ", err);
      });
  }

  onChange(cameraName) {
    this.cameraList.forEach(item => {
      if (item.deviceName == cameraName) {
        this.cameraDetails = item;
      }
    });
  }

  calculateCost(element) {
    var time = 0;
    console.log("ELEMENT VALUE === ", element);
    if (element == 0) {
      this.retentionDuration = 1;
      //time = 1440;
      time = 24;
    }
    else if (element == 1) {
      this.retentionDuration = 7;
      //time = 10080;
      time = 168;
    }
    else if (element == 2) {
      this.retentionDuration = 30;
      //time = 43200;
      time = 720;
    }
    else if (element == 3) {
      this.retentionDuration = 90;
      //time = 129600;
      time = 2160;
    }
    else if (element == 4) {
      this.retentionDuration = 365;
      //time = 525600;
      time = 8760;
    }

    this.finalCost = 720 * this.oneHourCost;
    this.finalCost = Math.round(this.finalCost);
    console.log(" FINAL COST :: ", this.finalCost);
  }

  onChangeCamera(cameraName) {
    this.loading = true;
    console.log("camId : ", cameraName);
    var cameraId;
    this.cameras.forEach(item => {
      if (item.deviceName == cameraName) {
        cameraId = item.camId;
      }
    })

    this.deleteVideoId = cameraId;

    this.camDetails = [];
    this.http.get<any>(this.vmUrl + '/videos/retention?camId=' + cameraId)
      .subscribe(
      res => {
        if (res.length != 0) {
          //  this.isList = false;
          this.camDetails = res;
          this.camData = {};
          var resObj = {
            deviceName: "",
            camId: "",
            videoName: "",
            dates: [],
          };
          this.camDetails.forEach(function (dateVid) {
            resObj.deviceName = dateVid.deviceName;
            resObj.camId = dateVid.camId;
            resObj.videoName = dateVid.videoName;
            var tempObj = {
              date: dateVid.date,
              videos: dateVid.videos
            }
            resObj.dates.push(tempObj);
          });
          console.log("RESULT ========= ", resObj);
          this.camData = resObj;
                  this.loading = false;

        }
        else {
        this.loading = false;
          this.toastrService.Error("", "No Data Available");

        }
      },
      err => {
        this.loading = false;
        this.toastrService.Error("", "No Data Available");
        console.log("Error occured: ", err);
      });




  }

  meEvent(e) {
    document.getElementById('Date').setAttribute('min', this.Date);
  }

  onSubmit() {


    console.log("FINAL COST ::: ", this.finalCost);
  }
  addNewVideo() {
    this.isNewVideo = false;
    this.isVideoList = true;
    if (this.timeDuration > 60) {
      this.timeDuration = 60;
      this.toastrService.Info("", "Maximum allowed time is 60 minutes");
    }
    if (this.timeDuration < 0)
      this.timeDuration = 1;

    if (this.retentionDuration > 60) {
      this.retentionDuration = 60;
      this.toastrService.Info("", "Maximum allowed retention duration is 60 Days");
    }
    if (this.retentionDuration < 0)
      this.retentionDuration = 1;

    console.log("CAM Details :: ", this.cameraDetails);
    var data = {
      "videoName": this.videoName,
      "camId": this.cameraDetails._id,
      "retentionPeriod": this.retentionDuration,
      "startTime": this.Time,
      "datetime": this.Date + ' ' + this.Time,
      "duration": this.timeDuration,
      "aggregatorId": this.cameraDetails.aggregatorId,
      "streamingUrl": this.cameraDetails.streamingUrl,
      "deviceName": this.cameraDetails.deviceName
    }
    console.log("data : ", data);
    this.http.post(this.vmUrl + '/videos/retention', data)
      .subscribe(
      res => {
        console.log(res);
        this.toastrService.Success("", "Video Recording has started! You will be notified soon.");
        this.onCancel();
      },
      err => {
        this.toastrService.Error("", "Error Occurred while recording the video. Please try again.");
        console.log("error response", err);
      });
  }

  onCancel() {
    this.isNewVideo = false;
    this.isVideoList = true;
  }


}
