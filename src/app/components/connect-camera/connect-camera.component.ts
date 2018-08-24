import { Component, OnInit, NgZone, NgModule, ElementRef, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';

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
    selector: 'connectCamera',
    templateUrl: './connect-camera.component.html',
    styleUrls: ['./connect-camera.component.css']
})
export class ConnectCameraComponent implements OnInit {
    vmUrl: string;
    userId: string;
    streamingUrl: string;
    deviceType: string;
    token: string;
    aggrType: string;
    compType: string;
    socket: SocketIOClient.Socket;
    previewSrc: string;
    previewSrcFlag: boolean;
    computeengines: any[];
    aggregators: any[];
    deviceName: string;
    floorMap: string;
    navigationParam;
    isUpdate: boolean;
    isConnectCam: boolean;
    navigationExtrasUpdate: NavigationExtras;
    navigationExtrasConnect: NavigationExtras;
    navigationExtrasPush: NavigationExtras;
    navigationExtrasCancel: NavigationExtras;
    IsTakePreview: Boolean;
    public loading;
    rawImageArray: any[] = [];
    storeImage: Boolean;
    isSearchOn: boolean;
    filter: any;
    addCamResp: any;
    timeoutVar: any;

    constructor(private toastrService: ToastrService, private route: ActivatedRoute, public router: Router, private http: HttpClient, private zone: NgZone, public domSanitizer: DomSanitizer) {
        this.isUpdate = false;
        this.isConnectCam = false;
        this.storeImage = false;
        this.route.queryParams.subscribe(params => {
            this.navigationParam = params;
        });

        this.isSearchOn = false;
        var session = JSON.parse(localStorage.getItem('sessionConfiguration'));
        console.log("@@@@@@@@@", session);
        if (session != null) {
            this.vmUrl = session.vmUrl;
        }
        this.userId = localStorage.getItem('userId');
        this.socket = io.connect(this.vmUrl, { secure: true });
        this.token = localStorage.getItem('accesstoken');
        this.streamingUrl = '';
        this.previewSrc = '';
        this.deviceName = '';
        this.deviceType = '';
        this.previewSrcFlag = false;
        this.IsTakePreview = false;
        sessionStorage.setItem("boundingbox", null);
        if (this.navigationParam) {
            if (this.navigationParam.webUrl == 'dashCamera') {
                this.isUpdate = false;
                this.isConnectCam = true;
                this.filter = this.navigationParam.cameraType;

            }
            else if (this.navigationParam.webUrl == 'dashCameraBack') {
                this.isSearchOn = true;
                this.streamingUrl = this.navigationParam.streamingUrl;
                this.deviceType = this.navigationParam.deviceType;
                this.deviceName = this.navigationParam.deviceName;
                this.floorMap = this.navigationParam.floorMap;
                this.aggrType = this.navigationParam.aggregatorName;
                this.compType = this.navigationParam.computeEngineName;
                this.filter = this.navigationParam.cameraType;

                if (this.aggrType == undefined && this.streamingUrl == undefined)
                    this.isUpdate = false;
                else
                    this.isUpdate = true;
            }
            else if (this.navigationParam.webUrl == 'editCamera') {

                this.isSearchOn = true;
                this.streamingUrl = this.navigationParam.streamingUrl;
                this.deviceType = this.navigationParam.deviceType;
                this.deviceName = this.navigationParam.deviceName;
                this.floorMap = this.navigationParam.floorMap;
                this.aggrType = this.navigationParam.aggregatorName;
                this.compType = this.navigationParam.computeEngineName;
                this.filter = this.navigationParam.cameraType;

                if (this.aggrType == undefined && this.streamingUrl == undefined)
                    this.isUpdate = false;
                else
                    this.isUpdate = true;
            }
            else if (this.navigationParam.webUrl == 'editCameraBack') {
                this.isSearchOn = true;
                this.streamingUrl = this.navigationParam.streamingUrl;
                this.deviceType = this.navigationParam.deviceType;
                this.deviceName = this.navigationParam.deviceName;
                this.floorMap = this.navigationParam.floorMap;
                this.aggrType = this.navigationParam.aggregatorName;
                this.compType = this.navigationParam.computeEngineName;
                this.filter = this.navigationParam.cameraType;

                if (this.aggrType == undefined && this.streamingUrl == undefined)
                    this.isUpdate = false;
                else
                    this.isUpdate = true;

            }
            else if (this.navigationParam.webUrl == 'areaMappingBack') {
                this.isSearchOn = true;
                this.streamingUrl = this.navigationParam.streamingUrl;
                this.deviceType = this.navigationParam.deviceType;
                this.deviceName = this.navigationParam.deviceName;
                this.floorMap = this.navigationParam.floorMap;
                this.aggrType = this.navigationParam.aggregatorName;
                this.compType = this.navigationParam.computeEngineName;


                if (this.aggrType == undefined && this.streamingUrl == undefined)
                    this.isUpdate = false;
                else
                    this.isUpdate = true;

            }
            else if (this.navigationParam.webUrl == 'cameraMappingBack') {
                this.isSearchOn = true;
                this.streamingUrl = this.navigationParam.streamingUrl;
                this.deviceType = this.navigationParam.deviceType;
                this.deviceName = this.navigationParam.deviceName;
                this.floorMap = this.navigationParam.floorMap;
                this.aggrType = this.navigationParam.aggregatorName;
                this.compType = this.navigationParam.computeEngineName;


                this.isUpdate = true;
                this.isConnectCam = false;
            }
            else {
                this.isUpdate = false;
                this.isConnectCam = false;
            }

        }

    }

    ngOnInit() {
        this.loading = true;
        sessionStorage.setItem("storedMarkerArr", null);
        this.getDetails();
        this.socketConnection();
    }

    onChangeDeviceType(deviceType) {

        if (deviceType == '') {
            this.isSearchOn = false;
        }
        else {
            this.isSearchOn = true;
        }
    }


    socketConnection() {
        this.socket.on('rawImage/' + this.userId, (msg: any) => {
            clearTimeout(this.timeoutVar);
            console.log("TIMEOUT CLEARED");
            this.previewSrc = '';
            var data = JSON.parse(msg.message);
            this.previewSrcFlag = true;

            if (this.storeImage === true) {
                this.rawImageArray.push({ "streamingUrl": JSON.parse(msg.message).streamingUrl, "imgBase64": JSON.parse(msg.message).imgBase64 });
                sessionStorage.setItem("rawImages", JSON.stringify(this.rawImageArray));
                this.storeImage = false;
            }

            this.zone.run(() => {
                this.previewSrc = data.imgBase64;
            });
        });

        this.socket.on('addCameraResponse/' + this.userId, (data: any) => {
            clearTimeout(this.timeoutVar);
            console.log("TIMEOUT CLEARED");
            console.log("Add cam Response:");
            this.addCamResp = data.message;
            console.log(data.message);
            if (data.message.status === 1) {
                sessionStorage.setItem("cameraId", data.message.cameraId);

                if (this.isUpdate === false && this.isConnectCam === false) {
                    this.router.navigate(["/cameraMappingSlider"], this.navigationExtrasPush);
                }
                if (this.isUpdate === true && this.isConnectCam === false) {
                    this.router.navigate(["/layout/deviceManagement/areaMarkingDashboard"]);
                }
                if (this.isConnectCam === true && this.isUpdate === false) {
                    this.router.navigate(["/layout/deviceManagement/areaMarkingDashboard"], this.navigationExtrasConnect);
                }

            }
            else {
                this.toastrService.Error("", "camera added not valid");
            }
        });
    };

    takePreview() {
        this.IsTakePreview = true;
        var isRawImageStored = false;
        var streamingUrl = this.streamingUrl;
        var previewSrc = '';

        if (this.deviceType == '') {
            this.toastrService.Error('', 'Please Select Device Type');
        }
        else {
            var rawImages = JSON.parse(sessionStorage.getItem('rawImages'));
            console.log("SESSION STORAGE RAW IMAGE ARRAY: ", rawImages);
            if (rawImages === null) {
                console.log("No raw images");
                isRawImageStored = false;
            }
            else {
                this.rawImageArray = rawImages;
                this.rawImageArray.forEach(function (item) {
                    if (!isRawImageStored) {
                        if (streamingUrl === item.streamingUrl) {
                            previewSrc = item.imgBase64;
                            isRawImageStored = true;
                        }
                        else {
                            isRawImageStored = false;
                        }
                    }
                })
            }
            if (isRawImageStored === false) {
                this.getRawImage();
            }
            else {
                this.previewSrcFlag = true;
                this.previewSrc = previewSrc;
            }
        }
    };

    getRawImage() {
        this.storeImage = true;
        var previewData = {};
        var cameraId = sessionStorage.getItem('cameraId');
        if (cameraId != "null") {
            previewData = {
                "deviceType": this.deviceType,
                "streamingUrl": this.streamingUrl,
                "cameraId": cameraId,
                "aggregatorId": this.aggrType,
                "computeEngineId": this.compType
            };
        }
        else {
            previewData = {
                "deviceType": this.deviceType,
                "streamingUrl": this.streamingUrl,
                "cameraId": "temp",
                "aggregatorId": this.aggrType,
                "computeEngineId": this.compType
            };
        }
        this.http.post(this.vmUrl + '/cameras/raw', previewData)
            .subscribe(
            res => {
                console.log(res);
            },
            err => {
                console.log("error response", err);
            });
    }

    getDetails() {
        this.computeengines = [];
        this.aggregators = [];
        this.http.get<any[]>(this.vmUrl + '/computeengines?status=0,2'
        ).subscribe(data => {
            console.log("Compute engines:", data);
            data.forEach(item => {
                this.computeengines.push({ 'deviceName': item.name, 'deviceType': item.deviceType, "_id": item._id, "Ipaddress": item.ipAddress, "macId": item.macId, "jetsonCamFolderLocation": item.jetsonCamFolderLocation, "status": item.status });
            });
            if (this.isUpdate) {
                this.compType = this.navigationParam.computeEngineName;
            }
            else {
                this.compType = this.computeengines[0]._id;
            }
        });
        this.http.get<any[]>(this.vmUrl + '/aggregators?status=0,2'
        ).subscribe(data => {
            console.log("Aggregators:", data);
            this.loading = false;
            data.forEach(item => {
                this.aggregators.push({ 'deviceName': item.name, 'streamingUrl': item.url, "_id": item._id, "Ipaddress": item.ipAddress, "macId": item.macId, "status": item.status });
            });
            if (this.isUpdate) {
                this.aggrType = this.navigationParam.aggregatorName;
            }
            else {
                this.aggrType = this.aggregators[0]._id;
            }

        });
        //this.deviceType = "DVR";
    };

    PushCamData() {
        let imgId: NavigationExtras = {
            queryParams: {
                step: 2
            }
        }
        var data = {
            deviceType: this.deviceType,
            deviceName: this.deviceName,
            aggregatorId: this.aggrType,
            computeEngineId: this.compType,
            streamingUrl: this.streamingUrl,
            location: this.floorMap
        };

        var updateReq = {
            'status': 1
        };

        this.loading = true;
        //Aggr update
        this.http.put(this.vmUrl + '/aggregators/' + data.aggregatorId, updateReq)
            .subscribe(
            res => {
                console.log("Aggregator updated");
                //Comp update
                this.http.put(this.vmUrl + '/computeengines/' + data.computeEngineId, updateReq)
                    .subscribe(
                    res => {
                        console.log("Compute engine updated");
                        this.http.post(this.vmUrl + '/cameras', data
                        )
                            .subscribe(
                            res => {
                                this.loading = false;
                                //this.router.navigate(["/cameraMappingSlider"], imgId);
                                var r1 = JSON.stringify(res);
                                var r2 = JSON.parse(r1);
                                if (r2.status == 201) {
                                    this.waitForRawImage();
                                    console.log("TIMEOUT STARTED");
                                }
                                this.navigationExtrasPush = {
                                    queryParams: {
                                        deviceType: this.deviceType,
                                        deviceName: this.deviceName,
                                        aggregatorName: this.aggrType,
                                        computeEngineName: this.compType,
                                        streamingUrl: this.streamingUrl,
                                        location: this.floorMap,
                                        cameraType: this.filter

                                        // webUrl:'cameraMapping'
                                    }
                                }

                                sessionStorage.setItem("camdetails", null);
                            },
                            err => {
                                this.loading = false;
                                if (err.status === 409) {
                                    this.toastrService.Error("", "Device already present");
                                }
                            });
                    },
                    err => {
                        console.log("error response", err);
                        setTimeout(() => {
                            this.loading = false;
                            this.toastrService.Error("", "Compute engine falied to update");
                            this.goToCameras();
                        }, 2000);
                    });

            },
            err => {
                console.log("error response", err);
                setTimeout(() => {
                    this.loading = false;
                    this.toastrService.Error("", "Aggregator failed to update");
                    this.goToCameras();
                }, 2000);
            });

    };

    waitForRawImage() {
        this.timeoutVar = setTimeout(() => {
            this.toastrService.Error("", "Couldn't get Reference Image !!! Please check after sometime.");
            this.goToCameras();
        }, 30000);
    }

    connectCameraPushData() {

        var data = {
            deviceType: this.deviceType,
            deviceName: this.deviceName,
            aggregatorId: this.aggrType,
            computeEngineId: this.compType,
            streamingUrl: this.streamingUrl,
            location: this.floorMap
        };

        var aggrStatus;
        var agg = this.aggrType;
        this.aggregators.forEach(function (item, index) {
            if (agg === item._id) {
                aggrStatus = item.status;
            }
        })

        var compStatus;
        var comp = this.compType;
        this.computeengines.forEach(function (item, index) {
            if (comp === item._id) {
                compStatus = item.status;
            }
        })


        if (aggrStatus == 0 || compStatus == 0) {
            var updateReq = {
                'status': 1
            };

            //Aggr update
            this.loading = true;
            this.http.put(this.vmUrl + '/aggregators/' + data.aggregatorId, updateReq)
                .subscribe(
                res1 => {
                    console.log("Aggregator updated");
                    //Comp update
                    this.http.put(this.vmUrl + '/computeengines/' + data.computeEngineId, updateReq)
                        .subscribe(
                        res2 => {
                            console.log("Compute engine updated");
                            this.http.post(this.vmUrl + '/cameras', data
                            )
                                .subscribe(
                                res3 => {
                                    this.loading = false;

                                    var r1 = JSON.stringify(res3);
                                    var r2 = JSON.parse(r1);
                                    if (r2.status == 201) {

                                        this.waitForRawImage();
                                        console.log("TIMEOUT STARTED");
                                    }
                                    this.navigationExtrasConnect = {
                                        queryParams: {
                                            deviceType: this.deviceType,
                                            deviceName: this.deviceName,
                                            aggregatorName: this.aggrType,
                                            computeEngineName: this.compType,
                                            streamingUrl: this.streamingUrl,
                                            location: this.floorMap,
                                            webUrl: 'dashCamera',
                                            cameraType: this.filter
                                        }
                                    }

                                    sessionStorage.setItem("camdetails", null);
                                    //this.router.navigate(["/layout/deviceManagement/areaMarkingDashboard"], this.navigationExtrasConnect);
                                },
                                err => {
                                    this.loading = false;
                                    if (err.status === 409) {
                                        this.toastrService.Error("", "Device already present");
                                    }
                                });

                        },
                        err => {
                            console.log("error response", err);
                            setTimeout(() => {
                                this.loading = false;
                                this.toastrService.Error("", "Compute engine falied to update");
                                this.goToCameras();
                            }, 2000);
                        });

                },
                err => {
                    console.log("error response", err);
                    setTimeout(() => {
                        this.loading = false;
                        this.toastrService.Error("", "Aggregator failed to update");
                        this.goToCameras();
                    }, 2000);
                });
        }
        else {
            this.http.post(this.vmUrl + '/cameras', data)
                .subscribe(
                res3 => {
                    this.loading = false;

                    var r1 = JSON.stringify(res3);
                    var r2 = JSON.parse(r1);
                    if (r2.status == 201) {
                        this.waitForRawImage();
                        console.log("TIMEOUT STARTED");
                    }

                    this.navigationExtrasConnect = {
                        queryParams: {
                            deviceType: this.deviceType,
                            deviceName: this.deviceName,
                            aggregatorName: this.aggrType,
                            computeEngineName: this.compType,
                            streamingUrl: this.streamingUrl,
                            location: this.floorMap,
                            webUrl: 'dashCamera',
                            cameraType: this.filter
                        }
                    }
                    sessionStorage.setItem("camdetails", null);

                    //this.router.navigate(["/layout/deviceManagement/areaMarkingDashboard"], this.navigationExtrasConnect);
                },
                err => {
                    this.loading = false;
                    if (err.status === 409) {
                        this.toastrService.Error("", "Device already present");
                    }
                });
        }

    }
    UpdatePushCamData() {
        var data = {
            deviceType: this.deviceType,
            deviceName: this.deviceName,
            aggregator: this.aggrType,
            computeEngine: this.compType,
            streamingUrl: this.streamingUrl,
            location: this.floorMap
        };

        var cam = sessionStorage.getItem('cameraId');
        var aggrStatus;
        var agg = this.aggrType;
        this.aggregators.forEach(function (item, index) {
            if (agg === item._id) {
                aggrStatus = item.status;
            }
        })

        var compStatus;
        var comp = this.compType;
        this.computeengines.forEach(function (item, index) {
            if (comp === item._id) {
                compStatus = item.status;
            }
        })

        this.loading = true;

        if ((data.streamingUrl != this.navigationParam.streamingUrl) || (data.deviceName != this.navigationParam.deviceName) || (data.deviceType != this.navigationParam.deviceType) || (data.aggregator != this.navigationParam.aggregatorName) || (data.computeEngine != this.navigationParam.computeEngineName) || (data.location != this.navigationParam.floorMap)) {

            if (aggrStatus != 2 || compStatus != 2) {

                var updateReq = {
                    'status': 1
                };
                //Aggr update
                this.http.put(this.vmUrl + '/aggregators/' + data.aggregator, updateReq)
                    .subscribe(
                    res => {

                        //Comp update
                        this.http.put(this.vmUrl + '/computeengines/' + data.computeEngine, updateReq)
                            .subscribe(
                            res => {

                                this.http.put(this.vmUrl + '/cameras/' + cam, data)
                                    .subscribe(
                                    res => {
                                        this.loading = false;
                                        this.navigationExtrasUpdate = {
                                            queryParams: {
                                                deviceType: this.deviceType,
                                                deviceName: this.deviceName,
                                                aggregatorName: this.aggrType,
                                                computeEngineName: this.compType,
                                                streamingUrl: this.streamingUrl,
                                                location: this.floorMap,
                                                webUrl: 'editCamera',
                                                cameraType: this.filter
                                            }
                                        }

                                        this.router.navigate(["/layout/deviceManagement/areaMarkingDashboard"], this.navigationExtrasUpdate);
                                    },
                                    err => {
                                        this.loading = false;
                                        if (err.status == 409) {
                                            this.toastrService.Error("", err.data.deviceName + "already present");
                                        }
                                    }
                                    );

                            },
                            err => {
                                console.log("error response", err);
                                setTimeout(() => {
                                    this.loading = false;
                                    this.toastrService.Error("", "Compute engine falied to update");
                                    this.goToCameras();
                                }, 2000);
                            });

                    },
                    err => {
                        console.log("error response", err);
                        setTimeout(() => {
                            this.loading = false;
                            this.toastrService.Error("", "Aggregator failed to update");
                            this.goToCameras();
                        }, 2000);
                    });


            }
            else {

                this.http.put(this.vmUrl + '/cameras/' + cam, data)
                    .subscribe(
                    res => {
                        this.loading = false;
                        this.navigationExtrasUpdate = {
                            queryParams: {
                                deviceType: this.deviceType,
                                deviceName: this.deviceName,
                                aggregatorName: this.aggrType,
                                computeEngineName: this.compType,
                                streamingUrl: this.streamingUrl,
                                location: this.floorMap,
                                webUrl: 'editCamera',
                                cameraType: this.filter
                            }
                        }

                        this.router.navigate(["/layout/deviceManagement/areaMarkingDashboard"], this.navigationExtrasUpdate);
                    },
                    err => {
                        this.loading = false;
                        if (err.status == 409) {
                            this.toastrService.Error("", err.data.deviceName + "already present");
                        }
                    }
                    );
            }
        }
        else {
            // this.toastrService.Warning('', 'No Parameter Updated');
            this.loading = false;
            this.navigationExtrasUpdate = {
                queryParams: {
                    deviceType: this.deviceType,
                    deviceName: this.deviceName,
                    aggregatorName: this.aggrType,
                    computeEngineName: this.compType,
                    streamingUrl: this.streamingUrl,
                    location: this.floorMap,
                    webUrl: 'editCamera',
                    cameraType: this.filter
                }
            }

            this.router.navigate(["/layout/deviceManagement/areaMarkingDashboard"], this.navigationExtrasUpdate);
        }
    }


    goToCameras() {
        this.navigationExtrasCancel = {
            queryParams: {
                webUrl: 'cancelCamera',
                cameraType: this.filter
            }
        }
        this.router.navigate(["/layout/devices/Cameras"], this.navigationExtrasCancel);
    }

    goToHome() {
        this.router.navigate(["/layout/dashboard"]);
    }

}
