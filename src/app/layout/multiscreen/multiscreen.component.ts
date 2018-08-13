import { Component, OnInit, NgZone, NgModule, ElementRef, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable'
import { Socket } from 'ng-socket-io';
import * as io from 'socket.io-client';
import * as data from '../../../../config'
declare var $: any;

@Component({
  selector: 'app-multiscreen',
  templateUrl: './multiscreen.component.html',
  styleUrls: ['./multiscreen.component.css']
})
export class MultiscreenComponent implements OnInit {
  userId: string;
  vmUrl: string;
  socket: SocketIOClient.Socket;
  liveCameras: any[];
  camId: string;
  imgSrc: string;
  isList: boolean;
  loading: boolean;
  fullScreenMode: boolean = false;
  markerCountArr: any[];

  constructor(private route: ActivatedRoute, public router: Router, private http: HttpClient, private zone: NgZone, public domSanitizer: DomSanitizer) {
    var session = JSON.parse(localStorage.getItem('sessionConfiguration'));
    if (session != null) {
      this.vmUrl = session.vmUrl;
    }
    this.userId = localStorage.getItem('userId');
    this.socket = io.connect(this.vmUrl, { secure: true });
    this.liveCameras = [];
    this.isList = false;
    this.imgSrc = '../../assets/img/loader.gif';
    this.markerCountArr = [];
  }

  ngOnInit() {
    this.loading = true;
    sessionStorage.setItem("selectedCamIndex", "0");
    sessionStorage.setItem("selectedAggrIndex", "0");
    this.socketConnection();
    this.displayList();
  }

  ngOnDestroy() {
    var _self = this;
    this.liveCameras.forEach(function (item) {
      var data = {
        "flag": 0,
        "camId": item.camId,
        "aggregatorId": item.aggregatorId
      }
      _self.http.post<any>(_self.vmUrl + '/cameras/toggle/streaming', data)
        .subscribe(
        res => {
          console.log(res);
        },
        err => {
          console.log("error response", err);
        });
    });
    this.socket.disconnect();
  }

  socketConnection() {
    this.socket.on('liveImage', (data: any) => {
      console.log("img response:", data);
      this.DisplayImages(data);
    });
  }

  displayList() {
    this.liveCameras = [];
    this.http.get<any[]>(this.vmUrl + '/cameras?status=1',
    ).subscribe(
      res => {
        this.loading = false;
        if (res.length === 0) {
          this.isList = false;
        } else {
          this.isList = true;
        }
        res.forEach(item => {
          this.liveCameras.push({ 'deviceName': item.deviceName, 'streamingUrl': item.streamingUrl, "camId": item._id, "aggregatorId": item.aggregator, "computeEngineId": item.computeEngine, "bbox": item.boundingBox, "jetsonWidth": item.imageWidth, "jetsonHeight": item.imageHeight });
        });
        console.log("Live Cameras: ", this.liveCameras);

        var _self = this;
        this.liveCameras.forEach(function (item) {
          var data = {
            "flag": 1,
            "camId": item.camId,
            "aggregatorId": item.aggregatorId
          }
          _self.http.post<any>(_self.vmUrl + '/cameras/toggle/streaming', data)
            .subscribe(
            res => {
              console.log(res);
              _self.camId = item.camId;
              $(document).ready(function () {
                //Toggle fullscreen
                $("#" + _self.camId + "_fullscreen").click(function (e) {
                  e.preventDefault();
                  var $this = $(this);

                  if ($this.children('i').hasClass('glyphicon-fullscreen')) {
                    $this.children('i').removeClass('glyphicon-fullscreen');
                    _self.markerCountArr = [];
                    _self.fullScreenMode = true;
                    $this.children('i').addClass('glyphicon-resize-small');
                  }
                  else if ($this.children('i').hasClass('glyphicon-resize-small')) {
                    $this.children('i').removeClass('glyphicon-resize-small');
                    _self.fullScreenMode = false;
                    $this.children('i').addClass('glyphicon-fullscreen');
                  }

                  $(this).closest('.imageDiv').toggleClass('panel-fullscreen');
                  _self.clearAoi(_self.camId);
                });
              });
            },
            err => {
              console.log("error response", err);
            });
        });
      },
      err => {
        console.log("Error occured");
      }
      );
  }

  selectedScreen(camId) {
    this.camId = camId;
  }

  clearAoi(camId) {
    console.log("In clear field!!!!!!!!!!");
    if (document.getElementsByClassName('aoi' + camId)) {
      var elements = document.getElementsByClassName('aoi' + camId);
      while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
      }
    }
    if (document.getElementsByClassName('rectangle' + camId)) {
      var elements = document.getElementsByClassName('rectangle' + camId);
      while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
      }
    }
        if (document.getElementsByClassName('userData' + camId)) {
      var elements = document.getElementsByClassName('userData' + camId);
      while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
      }
    }
    if (document.getElementsByClassName('info' + camId)) {
      var elements = document.getElementsByClassName('info' + camId);
      while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
      }
    }

    if (document.getElementsByClassName('textRect' + camId)) {
      var elements = document.getElementsByClassName('textRect' + camId);
      while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
      }
    }


    if (document.getElementsByClassName('text' + camId)) {
      var elements = document.getElementsByClassName('text' + camId);
      while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
      }
    }
  }

  DisplayImages(data) {
    var _self = this;
    this.liveCameras.forEach(function (item) {
      if (data.message.camId === item.camId) {
        var image = document.getElementById(item.camId + '_img');
        image.setAttribute("src", data.message.imgBase64);
        if (_self.camId === data.message.camId) {
          _self.markerCountArr = data.message.bboxResults;
        }
        _self.DisplayMarkers(data.message.bboxResults, data.message.camId);
        _self.Display(item.bbox, data.message.camId);
        _self.DisplayResults(data.message.bbox, data.message.camId, item.jetsonHeight, item.jetsonWidth)
      }
    });
  }

  Display(bbox, camId) {
    var canvas = document.getElementById(camId);
    var frame = canvas.getBoundingClientRect();
    var width = frame.width / 100;
    var height = frame.height / 100;



    if (document.getElementsByClassName('aoi' + camId)) {
      var elements = document.getElementsByClassName('aoi' + camId);
      while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
      }
    }

    var j = 0;
    bbox.forEach(function (item) {
      if (item.shape === 'Line') {
        var l1 = (item.x2 - item.x) * width;
        var l2 = (item.y2 - item.y) * height;
        var length = Math.sqrt((l1 * l1) + (l2 * l2));
        var angle = Math.atan2(l2, l1) * 180 / Math.PI;
        var transform = 'rotate(' + angle + 'deg)';
        var line = {
          x: item.x * width, //x
          y: item.y * height, //y
        };

        var parent = document.createElement('div');
        parent.id = "aoi";
        parent.className = "aoi" + camId;

        var markerName = document.createElement('div');
        markerName.id = "marker";
        markerName.className = "marker";
        markerName.innerHTML = item.markerName;
        markerName.style.left = line.x + 'px';
        markerName.style.top = ((line.y - 15) < 0 ? 5 : (line.y - 15)) + 'px';
        markerName.style.color = "orange";
        markerName.style.position = "absolute";
        parent.appendChild(markerName);

        var element = document.createElement('div');
        element.id = "line";
        element.className = 'rectangle1';
        element.style.transformOrigin = 0 + "%" + " " + 100 + "%";
        element.style.transform = transform;
        element.style.width = length + 'px';
        element.style.left = line.x + 'px';
        element.style.top = line.y + 'px';
        element.style.border = "1px solid lawngreen";
        element.style.borderColor = '#e38e68';
        element.style.position = "absolute";
        parent.appendChild(element);
        canvas.appendChild(parent);
        j = j + 1;
      }

      else if (item.shape === 'Rectangle') {
        var rect = {
          x1: item.x * width, //width
          y1: item.y * height, //height
          startX: (item.x2 - item.x) * width, //width x2-x1
          startY: (item.y2 - item.y) * height //height y2-y1
        };

        var parent = document.createElement('div');
        parent.id = "aoi";
        parent.className = "aoi" + camId;

        var markerName = document.createElement('div');
        markerName.id = "marker";
        markerName.className = "marker";
        markerName.innerHTML = item.markerName;
        markerName.style.left = rect.x1 + 'px';
        markerName.style.top = ((rect.y1 - 20) < 0 ? 10 : (rect.y1 - 20)) + 'px';
        markerName.style.color = "orange";
        markerName.style.position = "absolute";
        parent.appendChild(markerName);

        var element = document.createElement('div');
        element.id = "rectangle";
        element.className = 'rectangle1';
        element.style.left = rect.x1 + 'px';
        element.style.top = rect.y1 + 'px';
        element.style.width = rect.startX + 'px';
        element.style.height = rect.startY + 'px';
        element.style.border = "2px solid lawngreen";
        element.style.borderColor = '#e38e68';
        element.style.zIndex = "1";
        element.style.position = "absolute";
        parent.appendChild(element);
        canvas.appendChild(parent);
        j = j + 1;
      }

      else if (item.shape === 'Circle') {
        var circle = {
          x: item.startX * width,
          y: item.startY * height,
          x2: item.radiusX * 2 * width,
          y2: item.radiusY * 2 * height
        };

        var parent = document.createElement('div');
        parent.id = "aoi";
        parent.className = "aoi" + camId;

        var markerName = document.createElement('div');
        markerName.id = "marker";
        markerName.className = "marker";
        markerName.innerHTML = item.markerName;
        markerName.style.left = ((circle.x + circle.x2) / 2) + 'px';
        markerName.style.top = ((circle.y - 15) < 0 ? 5 : (circle.y - 15)) + 'px';
        markerName.style.color = "orange";
        markerName.style.position = "absolute";
        parent.appendChild(markerName);

        var element = document.createElement('div');
        element.id = "circle";
        element.className = 'rectangle1';
        element.style.left = circle.x + 'px';
        element.style.top = circle.y + 'px';
        element.style.width = circle.x2 + 'px';
        element.style.height = circle.y2 + 'px';
        element.style.border = "2px solid lawngreen";
        element.style.borderColor = '#e38e68';
        element.style.position = "absolute";
        element.style.borderRadius = 50 + '%';
        parent.appendChild(element);
        canvas.appendChild(parent);
        j = j + 1;
      }

      else if (item.shape === 'Triangle') {
        var l1 = (item.x2 - item.x) * width;
        var l2 = (item.y2 - item.y) * height;
        var length1 = Math.sqrt((l1 * l1) + (l2 * l2));
        var angle = Math.atan2(l2, l1) * 180 / Math.PI;
        var transform1 = 'rotate(' + angle + 'deg)';
        var line = {
          x: item.x * width, //width
          y: item.y * height, //height
        };

        var element = document.createElement('div');
        element.id = "triangle1";
        element.className = 'rectangle1';
        element.style.transformOrigin = 0 + "%" + " " + 100 + "%";
        element.style.transform = transform1;
        element.style.width = length1 + 'px';
        element.style.left = line.x + 'px';
        element.style.top = line.y + 'px';
        element.style.border = "1px solid lawngreen";
        element.style.borderColor = '#e38e68';
        element.style.position = "absolute";
        canvas.appendChild(element);
        j = j + 1;

        var l3 = (item.x3 - item.x2) * width;
        var l4 = (item.y3 - item.y2) * height;
        var length1 = Math.sqrt((l3 * l3) + (l4 * l4));
        var angle = Math.atan2(l4, l3) * 180 / Math.PI;
        var transform1 = 'rotate(' + angle + 'deg)';
        var line = {
          x: item.x2 * width, //width
          y: item.y2 * height, //height
        };

        var parent = document.createElement('div');
        parent.id = "aoi";
        parent.className = "aoi" + camId;

        var minY = Math.min(item.y, item.y2, item.y3) * height;
        var markerName = document.createElement('div');
        markerName.id = "marker";
        markerName.className = "marker";
        markerName.innerHTML = item.markerName;
        markerName.style.left = line.x + 'px';
        markerName.style.top = ((minY - 15) < 0 ? 5 : (minY - 15)) + 'px';
        markerName.style.color = "orange";
        markerName.style.position = "absolute";
        parent.appendChild(markerName);

        var element = document.createElement('div');
        element.id = "triangle2";
        element.className = 'rectangle1';
        element.style.transformOrigin = 0 + "%" + " " + 100 + "%";
        element.style.transform = transform1;
        element.style.width = length1 + 'px';
        element.style.left = line.x + 'px';
        element.style.top = line.y + 'px';
        element.style.border = "1px solid lawngreen";
        element.style.borderColor = '#e38e68';
        element.style.position = "absolute";
        parent.appendChild(element);
        canvas.appendChild(parent);
        j = j + 1;

        var l5 = (item.x3 - item.x) * width;
        var l6 = (item.y3 - item.y) * height;
        var length1 = Math.sqrt((l5 * l5) + (l6 * l6));
        var angle = Math.atan2(l6, l5) * 180 / Math.PI;
        var transform1 = 'rotate(' + angle + 'deg)';
        var line = {
          x: item.x * width, //width
          y: item.y * height, //height
        };

        var element = document.createElement('div');
        element.id = "triangle3";
        element.className = 'rectangle1';
        element.style.transformOrigin = 0 + "%" + " " + 100 + "%";
        element.style.transform = transform1;
        element.style.width = length1 + 'px';
        element.style.left = line.x + 'px';
        element.style.top = line.y + 'px';
        element.style.border = "1px solid lawngreen";
        element.style.borderColor = '#e38e68';
        element.style.position = "absolute";
        canvas.appendChild(element);
        j = j + 1;
      }
    });
  }

  DisplayMarkers(markerArr, camId) {
    var canvas = document.getElementById(camId);
    if (document.getElementsByClassName('markerOverlay' + camId)) {
      var elements = document.getElementsByClassName('markerOverlay' + camId);
      while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
      }
    }

    markerArr.forEach(function (item, index) {

      console.log(item.markerName, item.count);

      var markerName = document.createElement('div');
      markerName.id = 'marker' + camId;
      markerName.className = 'markerOverlay' + camId;
      markerName.innerText = item.markerName + ": " + item.count;
      markerName.style.backgroundColor = 'white';
      markerName.style.opacity = '0.3' + '%';
      markerName.style.left = 3 + '%';
      markerName.style.top = 82 - (index * 8) + '%';
      markerName.style.color = 'red';
      markerName.style.position = "absolute";
      canvas.appendChild(markerName);
    })
  }

  DisplayResults(resultBbox, camId, jetsonHeight, jetsonWidth) {
    var canvas = document.getElementById(camId);
    var frame = canvas.getBoundingClientRect();
    var widthRatio = frame.width / jetsonWidth;
    var heightRatio = frame.height / jetsonHeight;

    if (document.getElementsByClassName('rectangle' + camId)) {
      var elements = document.getElementsByClassName('rectangle' + camId);
      while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
      }
    }

    if (document.getElementsByClassName('userData' + camId)) {
      var elements = document.getElementsByClassName('userData' + camId);
      while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
      }
    }

    if (document.getElementsByClassName('info' + camId)) {
      var elements = document.getElementsByClassName('info' + camId);
      while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
      }
    }

    if (document.getElementsByClassName('textRect' + camId)) {
      var elements = document.getElementsByClassName('textRect' + camId);
      while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
      }
    }


    if (document.getElementsByClassName('text' + camId)) {
      var elements = document.getElementsByClassName('text' + camId);
      while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
      }
    }

    if (resultBbox) {
      resultBbox.forEach(function (item) {

        console.log("result ::::::::::: ", camId);

        if (item.wordsArray) {

          if (item.wordsArray.length != 0) {
            item.wordsArray.forEach(function (wordItem) {
              if (document.getElementsByClassName('info' + camId)) {
                var elements = document.getElementsByClassName('info' + camId);
                while (elements.length > 0) {
                  elements[0].parentNode.removeChild(elements[0]);
                }
              }

              if (document.getElementsByClassName('textRect' + camId)) {
                var elements = document.getElementsByClassName('textRect' + camId);
                while (elements.length > 0) {
                  elements[0].parentNode.removeChild(elements[0]);
                }
              }


              if (document.getElementsByClassName('text' + camId)) {
                var elements = document.getElementsByClassName('text' + camId);
                while (elements.length > 0) {
                  elements[0].parentNode.removeChild(elements[0]);
                }
              }

              var mouse = {
                x1: parseInt(wordItem.boundingBox.x1) * widthRatio, //width
                y1: parseInt(wordItem.boundingBox.y1) * heightRatio, //height
                startX: (parseInt(wordItem.boundingBox.x2) - parseInt(wordItem.boundingBox.x1)) * widthRatio, //width x2-x1
                startY: (parseInt(wordItem.boundingBox.y2) - parseInt(wordItem.boundingBox.y1)) * heightRatio //height y2-y1
              };

              var parent = document.createElement('div');
              parent.id = "info";
              parent.className = "info";

              var element = document.createElement('div');
              element.id = "textRect";
              element.className = 'textRect' + camId;
              element.style.left = mouse.x1 + 'px';
              element.style.top = mouse.y1 + 'px';
              element.style.width = mouse.startX + 'px';
              element.style.height = mouse.startY + 'px';
              element.style.border = "2px solid red";
              element.style.position = "absolute";
              parent.appendChild(element);

              //  item.wordsArray.forEach(function (wordd) {
              var text = document.createElement('div');
              text.id = "text";
              text.className = "text" + camId;
              text.innerHTML = wordItem.word ? wordItem.word : "";
              text.style.left = mouse.x1 + 'px';
              text.style.top = mouse.y1 + mouse.startY + 'px';
              text.style.fontSize = 26 + 'px';
              text.style.color = 'red';
              text.style.position = "absolute";
              parent.appendChild(text);
              //   })
              canvas.appendChild(parent);
            })
          }
        }
        else if (item.line) {

          var mouse = {
            x1: parseInt(item.boundingBox.x1) * widthRatio, //width
            y1: parseInt(item.boundingBox.y1) * heightRatio, //height
            startX: parseInt(item.boundingBox.x2) * widthRatio, //width x2-x1
            startY: parseInt(item.boundingBox.y2) * heightRatio //height y2-y1
          };

          if (item.length <= 5) {
          //display text with rectangle
          var parent = document.createElement('div');
          parent.id = "info";
          parent.className = "info";

          var element = document.createElement('div');
          element.id = "textRect";
          element.className = 'textRect' + camId;
          element.style.left = mouse.x1 + 'px';
          element.style.top = mouse.y1 + 'px';
          element.style.width = mouse.startX + 'px';
          element.style.height = mouse.startY + 'px';
          element.style.border = "2px solid red";
          element.style.position = "absolute";
          parent.appendChild(element);

          var text = document.createElement('div');
          text.id = "text";
          text.className = "text" + camId;
          text.innerHTML = item.line ? item.line : "";
          text.style.left = mouse.x1 + 'px';
          text.style.top = mouse.y1 + mouse.startY + 'px';
          text.style.fontSize = 22 + 'px';
          text.style.color = 'red';
          text.style.position = "absolute";
          parent.appendChild(text);
          canvas.appendChild(parent);

          }
          else {
          // disply only rectangle

          var parent = document.createElement('div');
          parent.id = "info";
          parent.className = "info";

          var element = document.createElement('div');
          element.id = "textRect";
          element.className = 'textRect' + camId;
          element.style.left = mouse.x1 + 'px';
          element.style.top = mouse.y1 + 'px';
          element.style.width = mouse.startX + 'px';
          element.style.height = mouse.startY + 'px';
          element.style.border = "2px solid red";
          element.style.position = "absolute";
          parent.appendChild(element);

          var text = document.createElement('div');
          text.id = "text";
          text.className = "text" + camId;
          text.innerHTML = item.line ? item.line : "";
          text.style.left = mouse.x1 + 'px';
          text.style.top = mouse.y1 + mouse.startY + 'px';
          text.style.fontSize = 22 + 'px';
          text.style.color = 'red';
          text.style.position = "absolute";
          parent.appendChild(text);
          canvas.appendChild(parent);

          }

        }
        else {
          console.log("REGION ============= ", item.region);
          var mouse = {
            x1: parseInt(item.bboxes.x1) * widthRatio, //width
            y1: parseInt(item.bboxes.y1) * heightRatio, //height
            startX: (parseInt(item.bboxes.x2) - parseInt(item.bboxes.x1)) * widthRatio, //width x2-x1
            startY: (parseInt(item.bboxes.y2) - parseInt(item.bboxes.y1)) * heightRatio //height y2-y1
          };

          var parent = document.createElement('div');
          parent.id = "info";
          parent.className = "info";


          var element = document.createElement('div');
          element.id = "rect";
          element.className = 'rectangle' + camId; 
          element.style.left = mouse.x1 + 'px';
          element.style.top = mouse.y1 + 'px';
          element.style.width = mouse.startX + 'px';
          element.style.height = mouse.startY + 'px';
          element.style.border = "2px solid red";
          element.style.position = "absolute";
          parent.appendChild(element);


          if (item.age || item.gender || item.userData || item.objectType) {
            var userData = document.createElement('div');
            userData.id = "userData";
            userData.className = "userData" + camId;
            if (item.userData == 'Unknown') {
              userData.innerHTML = item.userData + (item.age ? item.age + ", " : "") + (item.gender ? item.gender : "") + (item.objectType ? item.objectType : "");
            }
            else {
              userData.innerHTML = (item.userData ? item.userData + ", " : "") + (item.age ? item.age + ", " : "") + (item.gender ? item.gender : "");
            }
            userData.style.left = mouse.x1 + 'px';
            userData.style.top = mouse.y1 + mouse.startY + 'px';
            userData.style.color = 'red';
            userData.style.position = "absolute";
            parent.appendChild(userData);
          }
          canvas.appendChild(parent);
        }

      });
    }
  }
}