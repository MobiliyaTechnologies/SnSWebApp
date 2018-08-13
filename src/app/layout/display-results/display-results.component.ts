import { Component, OnInit, NgZone, NgModule } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { UpperCasePipe } from '@angular/common';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Socket } from 'ng-socket-io';
import * as io from 'socket.io-client';
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import * as data from '../../../../config'
import { createElement } from '@angular/core/src/view/element';
declare var $: any;

@Component({
    selector: 'app-display-results',
    templateUrl: './display-results.component.html',
    styleUrls: ['./display-results.component.css']
})
export class DisplayResultsComponent implements OnInit {
    vmUrl: string;
    imgSrc: string;
    result: string;
    bbox: any[];
    jetsonWidth: number;
    jetsonHeight: number;
    rawImageWidth: number;
    rawImageHeight: number;
    resultfield: any[];
    token: string;
    colors: any[];
    camIndex: any[];
    camName: string;
    userId: string;
    isPauseCam: boolean;
    isAddTag: boolean;
    faceRect: any[] = [];
    locationName: string;
    navigationParamPlayCam;
    socket: SocketIOClient.Socket;
    markerDisplay: any[];
    markerCount: any;
    featureName: string;
    feature: string;
    fullScreenMode: boolean = false;
    boundingBoxResult:any;
    isText:boolean;
    constructor(private route: ActivatedRoute, public router: Router, private http: HttpClient, private zone: NgZone, public domSanitizer: DomSanitizer) {
        var session = JSON.parse(localStorage.getItem('sessionConfiguration'));
        console.log("@@@@@@@@@", session);
        if (session != null) {
            this.vmUrl = session.vmUrl;
        }
        this.socket = io.connect(this.vmUrl, { secure: true });

        this.route.queryParams.subscribe(params => {
            this.navigationParamPlayCam = params;

        });

        this.imgSrc = '../../assets/img/loader.gif';
        this.result = '';
        this.bbox = [];
        this.locationName = this.navigationParamPlayCam.location;
        this.jetsonWidth = this.navigationParamPlayCam.jetsonWidth;
        this.jetsonHeight = this.navigationParamPlayCam.jetsonHeight;
        this.camName = this.navigationParamPlayCam.deviceName;
        this.resultfield = [];
        this.camIndex = [];
        this.token = localStorage.getItem("accesstoken");
        this.colors = ['#e38e68', '#f5d2b3', '#c6e1d6', '#E74C3C', '#F8C471', '#3498DB', '#B2BABB', '#5B2C6F'];
        this.userId = localStorage.getItem('userId');
        this.isPauseCam = false;
        this.isAddTag = false;
        this.isText = false;
    }

    ngOnInit() {
        this.socketConnection();
        var self = this;
        $(document).ready(function () {
            //Toggle fullscreen
            $("#panel-fullscreen").click(function (e) {
                e.preventDefault();

                var $this = $(this);

                if ($this.children('i').hasClass('glyphicon-fullscreen')) {
                    $this.children('i').removeClass('glyphicon-fullscreen');
                    self.fullScreenMode = true;
                    $this.children('i').addClass('glyphicon-resize-small');
                }
                else if ($this.children('i').hasClass('glyphicon-resize-small')) {
                    $this.children('i').removeClass('glyphicon-resize-small');
                    self.fullScreenMode = false;
                    $this.children('i').addClass('glyphicon-fullscreen');
                }

                $(this).closest('.live-image-div').toggleClass('panel-fullscreen');
                self.clearAoi();
            });
        });
    }
    ngOnDestroy() {
        var cam = JSON.parse(sessionStorage.getItem('camdetails'));
        var data = {
            "flag": 0,
            "camId": cam._id,
            "aggregatorId": cam.aggregator._id
        }

        this.http.post<any>(this.vmUrl + '/cameras/toggle/streaming', data)
            .subscribe(
            res => {
                console.log(res);

            },
            err => {
                console.log("error response", err);
            });
        this.socket.disconnect();
    }
    socketConnection() {
        this.socket.on('liveImage', (data: any) => {
            if (document.getElementsByClassName('userData')) {
                var elements = document.getElementsByClassName('userData');
                while (elements.length > 0) {
                    elements[0].parentNode.removeChild(elements[0]);
                }
            }

            if (document.getElementsByClassName('text')) {
                var elements = document.getElementsByClassName('text');
                while (elements.length > 0) {
                    elements[0].parentNode.removeChild(elements[0]);
                }
            }

            console.log("img response:", data);

            this.isAddTag = false;
            var index = sessionStorage.getItem('cameraId');
            this.featureName = this.navigationParamPlayCam.featureName;
            if (this.featureName == 'faceRecognition')
                this.isPauseCam = true;
            else if (this.featureName == 'objectDetection')
                this.isPauseCam = false;

            if (index === data.message.camId) {
                console.log("liveimageresponse", data);
                this.feature = data.message.feature;
                this.imgSrc = data.message.imgBase64;


            if(data.message.feature == "textRecognition")
            {
                console.log("isTextisTextisText : ",this.isText);
                this.isText = true;
            }
            else
                {
                    this.isText = false;
                    console.log("isTextisTextisText FALSE : ",this.isText);
                }

                this.liveImage(data.message.bbox, data.message.totalResult, data.message.bboxResults);
            }
        });
    };

    clearAoi() {

        if (document.getElementsByClassName('aoi')) {
            var elements = document.getElementsByClassName('aoi');
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
        if (document.getElementsByClassName('rectangle1')) {
            var elements = document.getElementsByClassName('rectangle1');
            while (elements.length > 0) {
                elements[0].parentNode.removeChild(elements[0]);
            }
        }
        if (document.getElementsByClassName('userData')) {
            var elements = document.getElementsByClassName('userData');
            while (elements.length > 0) {
                elements[0].parentNode.removeChild(elements[0]);
            }
        }

        if (document.getElementsByClassName('text')) {
            var elements = document.getElementsByClassName('text');
            while (elements.length > 0) {
                elements[0].parentNode.removeChild(elements[0]);
            }
        }
    }

    liveImage(bbox, result, bboxResults) {
        if (document.getElementsByClassName('faceTag')) {
            var elements = document.getElementsByClassName('faceTag');
            while (elements.length > 0) {
                elements[0].parentNode.removeChild(elements[0]);
            }
        }
        var canvas = document.getElementById('canvas');
        var frame = canvas.getBoundingClientRect();
        var width = frame.width / 100;
        var height = frame.height / 100;
        if (result) {
            this.result = result;
        }
        else {
            this.result = '0';
        }
        this.bbox = bbox;

        this.markerDisplay = bboxResults;
        //this.boundingBoxResult = bboxResults.boundingBoxes;
        console.log("BBB = ",this.bbox);
        // if(this.bbox.length != 0 )
        //     {
        //         this.isText = true;
        //     }
        var frameWidth = document.getElementById('canvas').getBoundingClientRect();
        var widthRatio = frameWidth.width / this.jetsonWidth;
        var heightRatio = frameWidth.height / this.jetsonHeight;

        var totalresult = 0;
        this.resultfield = [];

        if (document.getElementsByClassName('aoi')) {
            var elements = document.getElementsByClassName('aoi');
            while (elements.length > 0) {
                elements[0].parentNode.removeChild(elements[0]);
            }
        }
        var dataBoundBox = JSON.parse(sessionStorage.getItem('camdetails')).boundingBox;
        var j = 0;
        dataBoundBox.forEach(function (item) {
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
                parent.className = "aoi";

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
                parent.className = "aoi";

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
                parent.className = "aoi";

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
                parent.className = "aoi";

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

        if (document.getElementsByClassName('rectangle')) {
            var elements = document.getElementsByClassName('rectangle');
            while (elements.length > 0) {
                elements[0].parentNode.removeChild(elements[0]);
            }
        }
        this.bbox = bbox;
            // this.bbox.forEach(function (item) {
            //     var mouse = {
            //         x1: item.bboxes.x1 * widthRatio, //width
            //         y1: item.bboxes.y1 * heightRatio, //height
            //         startX: (item.bboxes.x2 - item.bboxes.x1) * widthRatio, //width x2-x1
            //         startY: (item.bboxes.y2 - item.bboxes.y1) * heightRatio //height y2-y1
            //     };
            //     var element = document.createElement('div');
            //     element.id = "rect";
            //     element.className = 'rectangle';
            //     element.style.left = mouse.x1 + 'px';
            //     element.style.top = mouse.y1 + 'px';
            //     element.style.width = mouse.startX + 'px';
            //     element.style.height = mouse.startY + 'px';
            //     element.style.border = "2px solid red";
            //     element.style.position = "absolute";
            //     canvas.appendChild(element);
            // });
            // if (document.getElementsByClassName('info')) {
            //     var elements = document.getElementsByClassName('info');
            //     while (elements.length > 0) {
            //         elements[0].parentNode.removeChild(elements[0]);
            //     }
            // }


            if (this.bbox) {
                this.bbox.forEach(function (item,i) {
                    if (item.wordsArray) {
                        //Implementation using OCR
                        if (item.wordsArray.length != 0) {
                            item.wordsArray.forEach(function (wordItem) {
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
                                element.id = "rect";
                                element.className = 'rectangle';
                                element.style.left = mouse.x1 + 'px';
                                element.style.top = mouse.y1 + 'px';
                                element.style.width = mouse.startX + 'px';
                                element.style.height = mouse.startY + 'px';
                                element.style.border = "2px solid red";
                                element.style.position = "absolute";
                                parent.appendChild(element);

                                var text = document.createElement('div');
                                text.id = "text";
                                text.className = "text";
                                text.innerHTML = wordItem.word ? wordItem.word : "";
                                text.style.left = mouse.x1 + 'px';
                                text.style.top = mouse.y1 + mouse.startY + 'px';
                                text.style.fontSize = 26 + 'px';
                                text.style.color = 'red';
                                text.style.position = "absolute";
                                parent.appendChild(text);
                                canvas.appendChild(parent);
                            })
                        }

                    }
                    else if (item.line) {
                        //Implementation using operation-location API
                        var mouse = {
                            x1: parseInt(item.boundingBox.x1) * widthRatio, //width
                            y1: parseInt(item.boundingBox.y1) * heightRatio, //height
                            startX: parseInt(item.boundingBox.x2) * widthRatio, //width x2-x1
                            startY: parseInt(item.boundingBox.y2) * heightRatio //height y2-y1
                        };


                        if (item.length >= 15) {
                            var parent = document.createElement('div');
                            parent.id = "info";
                            parent.className = "info";

                            var element = document.createElement('div');
                            element.id = "rect";
                            element.className = 'rectangle';
                            element.style.left = mouse.x1 + 'px';
                            element.style.top = mouse.y1 + 'px';
                            element.style.width = mouse.startX + 'px';
                            element.style.height = mouse.startY + 'px';
                            element.style.border = "2px solid red";
                            element.style.position = "absolute";
                            parent.appendChild(element);

                            var text = document.createElement('div');
                            text.id = "text";
                            text.className = "text";
                            text.innerHTML = i ? " [ "+i+" ] " : "";
                            text.style.left = (mouse.x1 - 30) + 'px';
                            text.style.top = mouse.y1 + 'px';
                            text.style.fontSize = 18 + 'px';
                            text.style.color = 'red';
                            text.style.position = "absolute";
                            parent.appendChild(text);
                            canvas.appendChild(parent);

                        }
                        else {
                            var parent = document.createElement('div');
                            parent.id = "info";
                            parent.className = "info";

                            var element = document.createElement('div');
                            element.id = "rect";
                            element.className = 'rectangle';
                            element.style.left = mouse.x1 + 'px';
                            element.style.top = mouse.y1 + 'px';
                            element.style.width = mouse.startX + 'px';
                            element.style.height = mouse.startY + 'px';
                            element.style.border = "2px solid red";
                            element.style.position = "absolute";
                            parent.appendChild(element);

                            var text = document.createElement('div');
                            text.id = "text";
                            text.className = "text";
                            text.innerHTML = item.line ? "["+i+"] "+ item.line : "";
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
                        element.className = 'rectangle';
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
                            userData.className = "userData";
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
        
    };

    backPage() {
        var navparam: NavigationExtras =
            {
                queryParams:
                {
                    flag: true
                }
            }

        this.router.navigate(["/layout/dashboard"], navparam);
    };

    stopCamera() {
        sessionStorage.setItem("selectedItems", JSON.stringify([]));
        var stopCam = JSON.parse(sessionStorage.getItem('camdetails'));
        var data = { "camId": stopCam._id, "deviceName": stopCam.deviceName, "camIdArray": [stopCam._id], "status": "0", "aggregatorId": stopCam.aggregator._id, "computeEngineId": stopCam.computeEngine._id, "deviceType": stopCam.deviceType, "retentionPeriod": 1 };
        this.http.put(this.vmUrl + '/cameras/status', data)
            .subscribe(
            res => {
                this.router.navigate(["/layout/dashboard"]);
            },
            err => {
                console.log("error response", err);
            });

    };

}

