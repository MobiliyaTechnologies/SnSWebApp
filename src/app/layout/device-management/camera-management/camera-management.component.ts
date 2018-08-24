import { Component, OnInit, NgZone, NgModule, ElementRef, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Socket } from 'ng-socket-io';
import * as io from 'socket.io-client';
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import * as data from '../../../../../config'
import { concat } from 'rxjs/operators/concat';
import { concatAll } from 'rxjs/operators/concatAll';
import { ToastrService } from '../../../services/toastr.service';

const now = new Date();


@Component({
    selector: 'app-camera-management',
    templateUrl: './camera-management.component.html',
    styleUrls: ['./camera-management.component.css']
})
export class CameraManagementComponent implements OnInit {
    vmUrl: string;
    cameras: any[];
    socket: SocketIOClient.Socket;
    deviceName: string;
    streamingUrl: string;
    previewSrc: string;
    userId: string;
    deviceType: string;
    camStatus: string;
    aggregatorName: string;
    computeEngineName: string;
    substring: string;
    filter: string;
    cameraDetailflag: boolean;
    location: string;
    featureName: string;
    feature: string;
    jetsonWidth: number;
    jetsonHeight: number;
    frameWidth: number;
    frameHeight: number;
    selectedCamIndex: number;
    selectedAggrIndex: number;
    dataBoundBox: any[] = [];
    bboxes: any[] = [];
    public loading;
    cloudServiceUrl: string;
    rawImageArray: any[] = [];
    storeImage: Boolean;
    checkboxCamArr: any[];
    toggleCheckbox: boolean = false;
    hideOptions: boolean;
    checkSelect: boolean;
    checkboxAll: boolean;
    addRetention: boolean;
    retentionDuration: any;
    finalCost: any;
    storageCost: any;
    showCost: boolean;
    navigationParam;
    clear: boolean;
    videoName: string;
    oneHourCost: any;
    checkFlag: any;


    constructor(private toastrService: ToastrService, private route: ActivatedRoute, public router: Router, private http: HttpClient, private zone: NgZone, public domSanitizer: DomSanitizer) {
        var session = JSON.parse(localStorage.getItem('sessionConfiguration'));
        console.log("@@@@@@@@@", session);
        if (session != null) {
            this.vmUrl = session.vmUrl;
        }

        this.route.queryParams.subscribe(params => {
            this.navigationParam = params;
        });

        setTimeout(() => {
            this.checkCamera();
        }, 100);


        this.previewSrc = data.configData.rawImgSrc;
        this.userId = localStorage.getItem('userId');
        console.log(this.userId);
        this.socket = io.connect(this.vmUrl, { secure: true });
        this.filter = 'aggregator';
        this.featureName = '';
        this.jetsonWidth = 0;
        this.jetsonHeight = 0;
        this.frameHeight = 0;
        this.frameWidth = 0;
        this.cloudServiceUrl = '';
        this.cameraDetailflag = false;
        this.storeImage = false;
        this.toggleCheckbox = false;
        this.checkboxCamArr = [];
        this.hideOptions = false;
        this.checkSelect = false;
        this.checkboxAll = false;
        this.addRetention = false;
        // this.storageCost=0.00019;
        this.finalCost = 0.00;
        this.showCost = false;
        this.clear = false;
        this.videoName = '';
        this.checkFlag = 0;
    }

    ngOnInit() {
        this.loading = true;
        this.substring = '';
        // this.filter = 'aggregator';
        this.getRetentionCost();
        this.camDisplay(this.filter, this.substring);
        this.checkboxCamArr = [];
        this.socketConnection();
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


    checkCamera() {
        if (this.navigationParam) {
            document.forms["radioForm"]["aggregator"].checked = true;
            if (this.navigationParam.webUrl == 'cancelCamera') {
                console.log("feature name : ", this.navigationParam.cameraType);
                this.filter = this.navigationParam.cameraType;
                if (this.filter == 'aggregator') {
                    document.forms["radioForm"]["aggregator"].checked = true;
                    //this.onChangeRadio('aggregator');
                    this.camDisplay('aggregator', this.substring);
                }
                else if (this.filter == 'feature') {
                    document.forms["radioForm"]["feature"].checked = true;
                    this.onChangeRadio('feature');
                    this.camDisplay('feature', this.substring);
                }
            }
        }
    }

    socketConnection() {
        this.socket.on('rawImage/' + this.userId, (msg: any) => {
            var selectedCam = JSON.parse(sessionStorage.getItem("camdetails"));

            console.log("$$ selectedCam :: ", selectedCam);

            var data = JSON.parse(msg.message);

            if (this.storeImage === true) {
                this.rawImageArray.push({ "streamingUrl": JSON.parse(msg.message).streamingUrl, "imgBase64": JSON.parse(msg.message).imgBase64 });
                sessionStorage.setItem("rawImages", JSON.stringify(this.rawImageArray));
                this.storeImage = false;
            }
            console.log(this.rawImageArray);
            if (selectedCam != null) {
                if (data.camId === selectedCam._id) {
                    this.zone.run(() => {
                        this.previewSrc = data.imgBase64;
                        console.log("Image applied", JSON.parse(msg.message));
                    });
                }
            }

            let base_image = new Image();
            base_image.src = this.previewSrc;
            base_image.onload = () => {
                this.jetsonWidth = base_image.width;
                this.jetsonHeight = base_image.height;
                console.log("imageSize", base_image.width, base_image.height);
            };
            this.draw(selectedCam);
        });
    };

    onChangeRadio(value) {
        console.log(value);
        this.filter = value;
        this.camDisplay(this.filter, this.substring);
    };
    filterCameras(event) {
        console.log("Event:", event);
        this.substring = event;
        this.camDisplay(this.filter, this.substring);
    };

    camDisplay(filtervalue, substring) {
        console.log("inCamDisaply");
        this.selectedCamIndex = JSON.parse(sessionStorage.getItem('selectedCamIndex'));
        this.selectedAggrIndex = JSON.parse(sessionStorage.getItem('selectedAggrIndex'));
        this.cameras = [];

        this.http.get<any[]>(this.vmUrl + '/analytics/cameras/list?filter=' + filtervalue + '&deviceName=' + substring
        ).subscribe(
            res => {
                this.loading = false;
                this.cameras = res;
                if (this.cameras.length === 0) {
                    this.cameraDetailflag = false;
                }
                else {
                    console.log("in 0th position");
                    this.cameraDetailflag = true;
                    this.getCameraDetails(this.cameras[this.selectedAggrIndex].cameras[this.selectedCamIndex], this.selectedAggrIndex, this.selectedCamIndex);
                }
            },
            err => {
                this.loading = false;
                console.log("Error occured");
            });
    };

    getCameraDetails(cam, AggrIndex, CamIndex) {
        sessionStorage.setItem("camdetails", JSON.stringify(cam));
        sessionStorage.setItem("cameraId", cam.camId);
        console.log("camdetails = ", cam);

        if (cam.aggregator == null || cam.aggregator == undefined) {
            this.aggregatorName = 'Other';
            this.computeEngineName = 'Other';
        }



        var isRawImageStored = false;
        var previewSrc = '';
        this.selectedCamIndex = CamIndex;
        this.selectedAggrIndex = AggrIndex;
        sessionStorage.setItem("selectedCamIndex", JSON.stringify(this.selectedCamIndex));
        sessionStorage.setItem("selectedAggrIndex", JSON.stringify(this.selectedAggrIndex));
        this.deviceName = cam.deviceName;
        this.streamingUrl = cam.streamingUrl;
        this.deviceType = cam.deviceType;
        this.camStatus = cam.status;
        this.location = cam.location;
        this.feature = cam.feature;

        var rawImages = JSON.parse(sessionStorage.getItem('rawImages'));

        if (rawImages === null) {
            console.log("no raw image stored");
            isRawImageStored = false;
        }
        else {
            this.rawImageArray = rawImages;
            this.rawImageArray.forEach(function (item) {
                if (!isRawImageStored) {
                    if (cam.streamingUrl === item.streamingUrl) {
                        previewSrc = item.imgBase64;
                        isRawImageStored = true;
                    }
                    else {
                        isRawImageStored = false;
                        //console.log(isRawImageStored);
                    }
                }
            })
        }
        if (isRawImageStored === false) {
            //console.log("call raw image");
            this.getRawImage(cam);
        }
        else {
            var selectedCam = JSON.parse(sessionStorage.getItem("camdetails"));
            this.previewSrc = previewSrc;
            setTimeout(() => {
                this.draw(selectedCam);
            }, 25);
        }



        //to get aggregator name, compute engine name, floor map
        this.http.get<any>(this.vmUrl + '/cameras/' + cam.camId
        ).subscribe(
            res => {
                console.log("res :: ", res);
                if (res.aggregator != null || res.aggregator != undefined) {
                    sessionStorage.setItem("camdetails", JSON.stringify(res));
                    this.aggregatorName = res.aggregator.name;
                    this.computeEngineName = res.computeEngine.name;
                }
                else {
                    this.toastrService.Error("Camera not assigned to any aggregator.");
                }

            },
            err => {
                console.log("Error occured");
            });
    };

    getRawImage(cam) {
        this.storeImage = true;

        var previewData = {
            "deviceType": cam.deviceType,
            "streamingUrl": cam.streamingUrl,
            "cameraId": cam.camId,
            "aggregatorId": cam.aggregator,
            "computeEngineId": cam.computeEngine
        };

        this.http.post(this.vmUrl + '/cameras/raw', previewData)
            .subscribe(
            res => {
                console.log(res);
            },
            err => {
                console.log("error response", err);
            });
    }

    connectCamera() {
        sessionStorage.setItem("cameraId", null);
        let navigationExtrasDash: NavigationExtras = {
            queryParams: {
                webUrl: 'dashCamera',
                cameraType: this.filter
            }
        }

        this.http.get<any[]>(this.vmUrl + '/aggregators?status=0,2'
        ).subscribe(data => {
            console.log("Aggregators:", data);
            var aggrLength = data.length;
            this.http.get<any[]>(this.vmUrl + '/computeengines?status=0,2'
            ).subscribe(data => {
                console.log("Compute engines:", data);
                var compLength = data.length;
                if (aggrLength != 0 && compLength != 0) {
                    this.router.navigate(["/layout/deviceManagement/connectCameraDashboard"], navigationExtrasDash);

                }
                else {
                    this.toastrService.Error("", "Please add aggregator/compute engine before connecting the camera.");

                }
            });

        });


    }

    addcamera() {
        var addCam = JSON.parse(sessionStorage.getItem('camdetails'));
        if (addCam.aggregator && addCam.computeEngine) {
            let navigationExtras: NavigationExtras = {
                queryParams: {
                    webUrl: 'editCamera',
                    streamingUrl: addCam.streamingUrl,
                    deviceName: addCam.deviceName,
                    deviceType: addCam.deviceType,
                    floorMap: addCam.location,
                    aggregatorName: addCam.aggregator._id,
                    computeEngineName: addCam.computeEngine._id,
                    cameraType: this.filter
                }
            }
            this.router.navigate(["/layout/deviceManagement/connectCameraDashboard"], navigationExtras);
        }
        else {
            let navigationExtras: NavigationExtras = {
                queryParams: {
                    webUrl: 'editCamera',
                    streamingUrl: addCam.streamingUrl,
                    deviceName: addCam.deviceName,
                    deviceType: addCam.deviceType,
                    floorMap: addCam.location,
                    aggregatorName: '',
                    computeEngineName: '',
                    cameraType: this.filter
                }
            }
            this.router.navigate(["/layout/deviceManagement/connectCameraDashboard"], navigationExtras);
        }

    };

    removeCam() {
        var removeCam = JSON.parse(sessionStorage.getItem('camdetails'));
        sessionStorage.setItem("selectedCamIndex", "0");
        sessionStorage.setItem("selectedAggrIndex", "0");
        this.http.delete(this.vmUrl + '/cameras/' + removeCam._id,
            { observe: 'response' }
        ).subscribe(
            (res: any) => {
                if (res.status == 204) {
                    this.substring = '';
                    if (this.checkboxAll) {
                        this.checkboxAll = false;
                        this.checkSelect = false;
                        this.hideOptions = false;
                        this.toggleCheckbox = false;

                    }
                    this.camDisplay(this.filter, this.substring);
                }
            },
            err => {
                console.log("Error response", err);
                if (err.status == 500) {
                    this.toastrService.Error("", "Error 500: internal server error");
                }
            })

    };
    selectMultiple() {
        if (this.checkSelect) {
            console.log("UNSELECT");
            this.checkSelect = false;
            this.hideOptions = false;
            this.checkboxAll = false;
            this.toggleCheckbox = false;
        }
        else {
            console.log("SELECT");
            this.hideOptions = true;
            this.checkSelect = true;
            this.checkboxAll = true;
            this.toggleCheckbox = true;
        }


        this.abcd();
        console.log("this :: ", this.toggleCheckbox, this.checkboxCamArr);
    }

    checkboxCams(e) {
        var checked = false;
        if (this.checkboxCamArr.length === 0) {
            this.checkboxCamArr.push(e);
            console.log("Arr null: ", this.checkboxCamArr);
        }
        else {
            var _self = this;
            this.checkboxCamArr.forEach(function (item, index) {
                if (!checked) {
                    if (item === e) {
                        _self.checkboxCamArr.splice(index, 1);
                        checked = true;
                        console.log("Arr repeated: ", _self.checkboxCamArr);
                    }
                    else {
                        checked = false;
                    }
                }
            });
            if (!checked) {
                this.checkboxCamArr.push(e);
                console.log("Arr new entry: ", this.checkboxCamArr);
            }
            else {
                checked = false;
            }
        }
    }

    callStopStreaming() {
        if (this.checkboxCamArr.length === 0) {
            this.stopCamera(JSON.parse(sessionStorage.getItem('camdetails')));
        }
        else {
            this.toastrService.Error("", "Unselect multiple selected cameras");
        }
    }
    abcd() {
        this.checkboxCamArr = [];
        console.log("abcdefghijklmnopqrstuvwxyz", this.checkboxCamArr);
    }
    initStopStreaming() {
        console.log(this.checkboxCamArr);
        if (this.checkboxCamArr.length === 0) {
            this.toastrService.Error("", "Select cameras to continue");
        }
        else {
            var selectedCamId = sessionStorage.getItem("cameraId");
            var _self = this;
            if (this.checkboxCamArr.length === 0) {
                this.startStreaming(JSON.parse(sessionStorage.getItem('camdetails')));
            }
            else {
                this.checkboxCamArr.forEach(function (camIndex) {
                    _self.cameras.forEach(function (filters) {
                        filters.cameras.forEach(function (camDetail) {
                            if (camDetail.camId === camIndex) {
                                _self.http.get<any>(_self.vmUrl + '/cameras/' + camDetail.camId
                                ).subscribe(
                                    res => {
                                        console.log(res);
                                        _self.stopCamera(res);
                                        return false;
                                    },
                                    err => {
                                        console.log("Error occured");
                                        return false;
                                    });
                            } else {
                            }
                        })
                    })
                })
            }
            console.log("before null: ", this.checkboxCamArr);
            this.checkboxCamArr = [];
            console.log("after null: ", this.checkboxCamArr);
        }
    }

    callStartStreaming(flag) {
        this.checkFlag = flag;
        if (this.checkboxCamArr.length === 0) {
            this.startStreaming(JSON.parse(sessionStorage.getItem('camdetails')));
        }
        else {
            this.toastrService.Error("", "Unselect multiple selected cameras");
        }
    }

    initStartStreaming() {
        if (this.checkboxCamArr.length === 0) {
            this.toastrService.Error("", "Select cameras to continue");
        }
        else {
            var selectedCamId = sessionStorage.getItem("cameraId");
            var _self = this;
            if (this.checkboxCamArr.length === 0) {
                this.startStreaming(JSON.parse(sessionStorage.getItem('camdetails')));
            }
            else {
                this.checkboxCamArr.forEach(function (camIndex) {
                    _self.cameras.forEach(function (filters) {
                        filters.cameras.forEach(function (camDetail, index) {
                            if (camDetail.camId === camIndex) {
                                _self.http.get<any>(_self.vmUrl + '/cameras/' + camDetail.camId
                                ).subscribe(
                                    res => {
                                        console.log(res.deviceName);
                                        if (res.status === "0") {
                                            _self.startStreaming(res);
                                            return false;
                                        }
                                        else {
                                            _self.toastrService.Success("", res.deviceName + " is already Streaming!");
                                            return false;
                                        }
                                    },
                                    err => {
                                        console.log("Error occured");
                                        return false;
                                    });
                            } else {
                            }
                        })
                    })
                })
            }
            console.log("before null: ", this.checkboxCamArr);
            // this.checkboxCamArr = [];
            // console.log("after null: ", this.checkboxCamArr);
        }
    }

    addRetentionTime() {
        this.addRetention = true;
        this.calculateCost(0);
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
        this.showCost = true;
    }

    clearFlag() {
        if (this.clear) {

            this.clear = false;
            this.addRetention = false;

        }
        else {

            this.addRetention = false;
            this.clear = true;
        }
    }

    goBack() {
        this.addRetention = false;
        this.clear = false;
    }


    startStreaming(CamData) {
        sessionStorage.setItem("selectedItems", JSON.stringify([]));
        console.log("++++++ CAM STARTED FOR :: +++++++++++++++++", CamData.deviceName);
        var imageWidth = this.jetsonWidth;
        var imageHeight = this.jetsonHeight;
        if (this.retentionDuration == undefined) {
            this.retentionDuration = 1;
        }
        if (CamData.aggregator && CamData.computeEngine) {
            imageWidth = CamData.imageWidth;
            imageHeight = CamData.imageHeight;
            this.frameWidth = CamData.frameWidth;
            this.frameHeight = CamData.frameHeight;
            this.featureName = CamData.feature;
            this.bboxes = CamData.boundingBox;
            // this.cloudServiceUrl = sessionStorage.getItem('cloudServiceUrl');

            if (CamData.boundingBox.length == 0) {
                this.featureName = CamData.computeEngine.detectionAlgorithms[0].featureName;
                this.bboxes = [{ "shape": 'Rectangle', "x": 1, "y": 1, "x2": 99, "y2": 99, "detectionObjects": ["person"], "markerName": CamData.deviceName + ' default', "tagName": CamData.deviceName + ' default', "featureName": this.featureName }];

                this.frameWidth = 100;
                this.frameHeight = 100;
                imageHeight = 720;
                imageWidth = 1280;
                // this.cloudServiceUrl = CamData.computeEngine.detectionAlgorithms[0].cloudServiceUrl;
            }

            var updateStatus = {};


            if (this.featureName == 'faceRecognition') {
                if (this.checkFlag == 0) {
                    updateStatus = {
                        "status": 1,
                        "camId": CamData._id,
                        "aggregatorId": CamData.aggregator._id,
                        "computeEngineId": CamData.computeEngine._id,
                        "deviceType": CamData.deviceType,
                        "sendImagesFlag": true,
                        "videoName": this.videoName
                    };

                }
                else {
                    updateStatus = {
                        "status": 1,
                        "camId": CamData._id,
                        "aggregatorId": CamData.aggregator._id,
                        "computeEngineId": CamData.computeEngine._id,
                        "deviceType": CamData.deviceType,
                        "sendImagesFlag": true,
                        "retentionPeriod": this.retentionDuration,
                        "videoName": this.videoName
                    };
                }

            }
            else {
                if (this.checkFlag == 0) {
                    updateStatus = {
                        "status": 1,
                        "camId": CamData._id,
                        "aggregatorId": CamData.aggregator._id,
                        "computeEngineId": CamData.computeEngine._id,
                        "deviceType": CamData.deviceType,
                        "sendImagesFlag": true,
                        "videoName": this.videoName
                    };

                }
                else {
                    updateStatus = {
                        "status": 1,
                        "camId": CamData._id,
                        "aggregatorId": CamData.aggregator._id,
                        "computeEngineId": CamData.computeEngine._id,
                        "deviceType": CamData.deviceType,
                        "sendImagesFlag": true,
                        "retentionPeriod": this.retentionDuration,
                        "videoName": this.videoName
                    };
                }
            }
            console.log("update: ", updateStatus);

            var vmData = {
                "Coords": this.bboxes,
                "frameWidth": { "width": this.frameWidth, "height": this.frameHeight },
                "imageHeight": imageHeight,
                "imageWidth": imageWidth,
                "feature": this.featureName,
                "deviceType": CamData.deviceType,
                "camId": CamData._id,
                "streamingUrl": CamData.streamingUrl,
                "deviceName": CamData.deviceName,
                "aggregatorId": CamData.aggregator._id,
                "computeEngineId": CamData.computeEngine._id,
                "jetsonCamFolderLocation": CamData.computeEngine.jetsonCamFolderLocation
                // "cloudServiceUrl": this.cloudServiceUrl
            };
            console.log("data to send:", vmData);

            this.http.put(this.vmUrl + '/cameras/aoi', vmData).subscribe(
                res => {
                    console.log(res);
                    this.http.put(this.vmUrl + '/cameras/status', updateStatus)
                        .subscribe(
                        res => {
                            console.log("In update status", JSON.stringify(res));
                            this.toastrService.Success("", "Camera streaming will start in 5-10 seconds");
                            this.router.navigate(["layout/dashboard"]);
                        },
                        err => {
                            console.log("error response", err);
                            if (err = 429) {
                                this.toastrService.Error("ERROR 429", "Please use another Compute Engine");
                            }
                        });
                },
                err => {
                    console.log("error response", err);
                });
        }
        else {
            this.toastrService.Error("", "Please check aggregator/compute engine details");
        }

    }

    stopCamera(stopCam) {
        //var stopCam = JSON.parse(sessionStorage.getItem('camdetails'));
        sessionStorage.setItem("selectedItems", JSON.stringify([]));
        var data = { "camId": stopCam._id, "deviceName": stopCam.deviceName, "camIdArray": [stopCam._id], "status": "0", "aggregatorId": stopCam.aggregator._id, "computeEngineId": stopCam.computeEngine._id, "deviceType": stopCam.deviceType, "retentionPeriod": this.retentionDuration };
        this.http.put(this.vmUrl + '/cameras/status', data)
            .subscribe(
            res => {
                console.log(res);
                //this.router.navigate(["/layout/devices/cameras"]);
                this.camDisplay(this.filter, this.substring);
            },
            err => {
                console.log("error response", err);
            });
    };

    draw(cam) {
        console.log("camcam :: ", cam);
        if (cam != null) {
            this.jetsonWidth = cam.imageWidth;
            this.jetsonHeight = cam.imageHeight;
            this.dataBoundBox = cam.boundingBox;
            var imageDiv = document.getElementById('imageDiv');
            var frameDimensions = imageDiv.getBoundingClientRect();
            var width = frameDimensions.width / 100;
            var height = frameDimensions.height / 100;

            if (document.getElementsByClassName('rectangle1')) {
                var elements = document.getElementsByClassName('rectangle1');
                while (elements.length > 0) {
                    elements[0].parentNode.removeChild(elements[0]);
                }
            }
            var j = 0;
            this.dataBoundBox.forEach(function (item) {
                if (item.shape === 'Line') {
                    var l1 = (item.x2 - item.x) * width;
                    var l2 = (item.y2 - item.y) * height;
                    var length = Math.sqrt((l1 * l1) + (l2 * l2));
                    var angle = Math.atan2(l2, l1) * 180 / Math.PI;
                    var transform = 'rotate(' + angle + 'deg)';
                    var line = {
                        x: item.x * width, //width
                        y: item.y * height, //height
                    };
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
                    imageDiv.appendChild(element);
                    j = j + 1;
                }

                if (item.shape === 'Rectangle') {
                    var rect = {
                        x1: item.x * width, //width
                        y1: item.y * height, //height
                        width: (item.x2 - item.x) * width, //width x2-x1
                        height: (item.y2 - item.y) * height //height y2-y1
                    };
                    var element = document.createElement('div');
                    element.id = "rectangle";
                    element.className = 'rectangle1';
                    element.style.left = rect.x1 + 'px';
                    element.style.top = rect.y1 + 'px';
                    element.style.width = rect.width + 'px';
                    element.style.height = rect.height + 'px';
                    element.style.border = "2px solid lawngreen";
                    element.style.borderColor = '#e38e68';
                    element.style.position = "absolute";
                    imageDiv.appendChild(element);
                    j = j + 1;
                }

                if (item.shape === 'Circle') {
                    var circle = {
                        x: item.startX * width,
                        y: item.startY * height,
                        x2: item.radiusX * 2 * width,
                        y2: item.radiusY * 2 * height
                    };
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
                    imageDiv.appendChild(element);
                    j = j + 1;
                }

                if (item.shape === 'Triangle') {
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
                    imageDiv.appendChild(element);
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
                    imageDiv.appendChild(element);
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
                    imageDiv.appendChild(element);
                    j = j + 1;
                }
            });
        }

    }
}
