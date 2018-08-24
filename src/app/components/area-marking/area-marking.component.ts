import { Component, OnInit, NgZone, ElementRef, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, NavigationExtras, ActivatedRoute } from '@angular/router';

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
    selector: 'areaMarking',
    templateUrl: './area-marking.component.html',
    styleUrls: ['./area-marking.component.css']
})
export class AreaMarkingComponent implements OnInit {
    vmUrl: string;
    socket: SocketIOClient.Socket;
    userId: string;
    previewSrc: string;
    cameraId: string;
    deviceName: string;
    computeEngineId: string;
    previewSrcFlag: Boolean;
    imgResWidth: number;
    imgResHeight: number;
    width: number;
    height: number;
    featureName: string;
    // feature: string;
    ShapeName: string;
    objectName: string;
    objectType: string;
    featureSelectionIndex: number;
    featureSelectionMarkerIndex: number;
    compFeatureNames: any[] = [];
    seleCamArr: any[] = [];
    count: number = 0;
    markerName: string;
    TagName: string;
    X1: number;
    Y1: number;
    X2: number;
    Y2: number;
    lineDir: string;
    startX: number = null;
    startY: number = null;
    endX: string = null;
    endY: string = null;
    drag: Boolean = false;
    RectPoint: any[] = [];
    rawBbarray: any[] = [];
    rawbbarray: any[] = [];
    navigationParam;
    isBackFromDashboard: boolean;
    isBackFromUpdate: boolean;
    isOnboarding: boolean;

    markerArr: any[];
    storedMarkerArr: any[];
    public loading;
    rawImageArray: any[] = [];
    storeImage: boolean;
    objects: any[];
    object: any;
    apiCount;
    isTripline: boolean = true;
    navigationExtrasCancel: NavigationExtras;
    navigationExtrasCancel2: NavigationExtras;
    filter: any;
    retentionDuration: number;
    addRetention: boolean;
    showCost: boolean;
    storageCost: any;
    finalCost: any;
    clear: boolean;
    videoName: string;
    oneHourCost: any;
    checkFlag: any;
    timeoutVar: any;


    constructor(private toastrService: ToastrService, public router: Router, private http: HttpClient, public domSanitizer: DomSanitizer, private zone: NgZone, private route: ActivatedRoute) {
        this.isBackFromDashboard = false;
        this.apiCount = 0;
        this.isBackFromUpdate = false;
        this.route.queryParams.subscribe(params => {
            this.navigationParam = params;
        });

        if (this.navigationParam) {
            if (this.navigationParam.webUrl == 'dashCamera') {

                this.isBackFromUpdate = false;
                this.isBackFromDashboard = true;
                this.filter = this.navigationParam.cameraType;

            }
            else if (this.navigationParam.webUrl == 'editCamera') {
                this.isBackFromUpdate = true;
                this.isBackFromDashboard = false;
                this.filter = this.navigationParam.cameraType;
            }
            else if (this.navigationParam.webUrl == 'cameraMapping') {
                this.isOnboarding = true;
                this.isBackFromUpdate = false;
                this.isBackFromDashboard = false;
            }
        }

        var session = JSON.parse(localStorage.getItem('sessionConfiguration'));
        console.log("@@@@@@@@@", session);
        if (session != null) {
            this.vmUrl = session.vmUrl;
        }
        this.previewSrc = data.configData.rawImgSrc;
        this.userId = localStorage.getItem('userId');
        this.cameraId = sessionStorage.getItem('cameraId');
        this.deviceName = this.navigationParam.deviceName;
        this.computeEngineId = this.navigationParam.computeEngineName;
        this.socket = io.connect(this.vmUrl, { secure: true });
        this.previewSrcFlag = false;
        this.objectName = 'person';
        this.ShapeName = '';
        this.lineDir = 'left';
        this.apiCount = 0;
        this.addRetention = false;
        this.showCost = false;
        // this.storageCost=0.00019;
        this.finalCost = 0.00;
        this.clear = false;
        this.videoName = '';
        this.checkFlag = 0;
    }

    ngOnInit() {
        this.loading = true;
        this.forRawImage();
        this.getRetentionCost();
        this.width = document.getElementById('canvasRow').offsetWidth;
        this.height = this.width * 0.4;
        sessionStorage.setItem("markerArr", null);
        //this.getRawImage();
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
            },
            err => {
                this.toastrService.Error("", "No Data Available");
                console.log("Error occured: ", err);
            });
    }

    socketConnection() {
        this.socket.on('rawImage/' + this.userId, (msg: any) => {
            clearTimeout(this.timeoutVar);
            console.log('TIMEOUT CLEARED : ', this.timeoutVar);
            console.log("socketRESPONSE: ", JSON.parse(msg.message));
            //this.previewSrc = data.configData.rawImgSrc;
            var data = JSON.parse(msg.message);

            if (this.storeImage === true) {
                this.rawImageArray.push({ "streamingUrl": JSON.parse(msg.message).streamingUrl, "imgBase64": JSON.parse(msg.message).imgBase64 });
                sessionStorage.setItem("rawImages", JSON.stringify(this.rawImageArray));
                this.storeImage = false;
            }

            this.zone.run(() => {
                this.previewSrc = data.imgBase64;
                this.apiCount++;
                if (this.apiCount == 2) {
                    this.loading = false;
                }
                //this.loading = true;
                this.loadImage();
            });
        });
    }

    context;
    @ViewChild("myCanvas") myCanvas: ElementRef;
    mdEvent(e) {
        if (this.ShapeName === 'Rectangle' || this.ShapeName === 'Line' || this.ShapeName === 'Circle' || this.ShapeName === 'Triangle') {
            if (this.isTripline == true) {
                this.startX = e.clientX;
                this.startY = e.clientY;
                this.drag = true;
            }
            else {
                this.drag = false;
            }
        }
        else {
            this.toastrService.Error("", "Select a shape to continue!");
        }
    };

    mmEvent(e) {
        if (this.drag) {
            this.applyImage();
            this.context.lineWidth = 2;
            this.context.strokeStyle = 'red';
            this.context.stroke();

            if (this.ShapeName === 'Rectangle') {
                let x = Math.round(this.startX - this.myCanvas.nativeElement.getBoundingClientRect().left);
                let y = Math.round(this.startY - this.myCanvas.nativeElement.getBoundingClientRect().top);
                let w = Math.round(e.clientX - this.myCanvas.nativeElement.getBoundingClientRect().left - x);
                let h = Math.round(e.clientY - this.myCanvas.nativeElement.getBoundingClientRect().top - y);

                this.context.beginPath();
                this.context.setLineDash([]);
                this.context.strokeRect(x, y, w, h);
                this.context.closePath();
                this.context.stroke();
            }

            if (this.ShapeName === 'Line') {
                let x1 = Math.round(this.startX - this.myCanvas.nativeElement.getBoundingClientRect().left);
                let y1 = Math.round(this.startY - this.myCanvas.nativeElement.getBoundingClientRect().top);
                let x2 = Math.round(e.clientX - this.myCanvas.nativeElement.getBoundingClientRect().left);
                let y2 = Math.round(e.clientY - this.myCanvas.nativeElement.getBoundingClientRect().top);

                this.context.beginPath();
                this.context.setLineDash([]);
                this.context.moveTo(x1, y1);
                this.context.lineTo(x2, y2);
                this.context.closePath();
                this.context.stroke();
            }

            if (this.ShapeName === 'Circle') {
                var CenterX = Math.abs(this.startX - this.myCanvas.nativeElement.getBoundingClientRect().left);
                var CenterY = Math.abs(this.startY - this.myCanvas.nativeElement.getBoundingClientRect().top);

                var x2 = Math.abs(e.clientX - this.myCanvas.nativeElement.getBoundingClientRect().left);
                var y2 = Math.abs(e.clientY - this.myCanvas.nativeElement.getBoundingClientRect().top);
                var RadiusX = Math.abs(e.clientX - this.startX);
                var RadiusY = Math.abs(e.clientY - this.startY);
                var radius = Math.sqrt((RadiusX * RadiusX) + (RadiusY * RadiusY));
                this.context.beginPath();
                this.context.setLineDash([]);
                this.context.arc(CenterX, CenterY, radius, 0, 2 * Math.PI);
                this.context.closePath();
                this.context.stroke();
            }

            if (this.ShapeName === 'Triangle') {
                let X2, Y2;
                if (this.count == 0) {
                    let x1 = Math.round(this.startX - this.myCanvas.nativeElement.getBoundingClientRect().left);
                    let y1 = Math.round(this.startY - this.myCanvas.nativeElement.getBoundingClientRect().top);
                    let x2 = Math.round(e.clientX - this.myCanvas.nativeElement.getBoundingClientRect().left);
                    let y2 = Math.round(e.clientY - this.myCanvas.nativeElement.getBoundingClientRect().top);
                    this.context.beginPath();
                    this.context.setLineDash([]);
                    this.context.moveTo(x1, y1);
                    this.context.lineTo(x2, y2);
                    this.context.stroke();
                    X2 = x2; Y2 = x2;
                }
                else if (this.count == 1) {
                    let x3 = Math.round(e.clientX - this.myCanvas.nativeElement.getBoundingClientRect().left);
                    let y3 = Math.round(e.clientY - this.myCanvas.nativeElement.getBoundingClientRect().top);
                    this.context.beginPath();
                    this.context.setLineDash([]);
                    this.context.moveTo(this.X1, this.Y1);
                    this.context.lineTo(this.X2, this.Y2);
                    this.context.lineTo(x3, y3);
                    this.context.closePath();
                    this.context.stroke();
                }
            }
        }
    };

    muEvent(e) {
        this.myCanvas.nativeElement.getContext("2d").lineWidth = 2;
        this.myCanvas.nativeElement.getContext("2d").strokeStyle = 'red';
        this.myCanvas.nativeElement.getContext("2d").stroke();

        this.endX = e.clientX + 'px'
        this.endY = e.clientY + 'px'

        if (this.ShapeName === 'Rectangle' && this.isTripline == true) {
            let x = Math.round(this.startX - this.myCanvas.nativeElement.getBoundingClientRect().left);
            let y = Math.round(this.startY - this.myCanvas.nativeElement.getBoundingClientRect().top);
            let w = Math.round(e.clientX - this.myCanvas.nativeElement.getBoundingClientRect().left - x);
            let h = Math.round(e.clientY - this.myCanvas.nativeElement.getBoundingClientRect().top - y);

            this.myCanvas.nativeElement.getContext("2d").beginPath();
            this.myCanvas.nativeElement.getContext("2d").strokeRect(x, y, w, h);
            this.myCanvas.nativeElement.getContext("2d").closePath();
            this.RectPoint.push({ "x": x, "y": y, "w": w, "h": h });

            this.drawRects();
            this.drawLines();
            this.drawCircles();
            this.drawTriangles();

            if (w > 0) {
                if (h > 0) {
                    this.rawBbarray.push({ "shape": 'Rectangle', "x": x * 100 / this.width, "y": y * 100 / this.height, "x2": (w + x) * 100 / this.width, "y2": (h + y) * 100 / this.height });
                }
                else {
                    this.rawBbarray.push({ "shape": 'Rectangle', "x": x * 100 / this.width, "y": (y + h) * 100 / this.width, "x2": (w + x) * 100 / this.width, "y2": y * 100 / this.height });
                }
            }
            else if (w < 0) {
                if (h > 0) {
                    this.rawBbarray.push({ "shape": 'Rectangle', "x": (w + x) * 100 / this.width, "y": y * 100 / this.height, "x2": x * 100 / this.width, "y2": (h + y) * 100 / this.height });
                }
                else {
                    this.rawBbarray.push({ "shape": 'Rectangle', "x": (w + x) * 100 / this.width, "y": (h + y) * 100 / this.height, "x2": x * 100 / this.width, "y2": y * 100 / this.height });
                }
            }
        }

        if (this.ShapeName == 'Line' && this.isTripline == true) {
            let x = Math.round(this.startX - this.myCanvas.nativeElement.getBoundingClientRect().left);
            let y = Math.round(this.startY - this.myCanvas.nativeElement.getBoundingClientRect().top);
            let x2 = Math.round(e.clientX - this.myCanvas.nativeElement.getBoundingClientRect().left);
            let y2 = Math.round(e.clientY - this.myCanvas.nativeElement.getBoundingClientRect().top);

            this.context.beginPath();
            this.context.setLineDash([10, 0]);
            this.context.moveTo(x, y);
            this.context.lineTo(x2, y2);
            this.context.closePath();
            this.context.stroke();

            // this.RectPoint.push({ "x": x, "y": y, "x2": x2, "y2": y2, "direction": this.lineDir });
            this.RectPoint.push({ "x": x, "y": y, "x2": x2, "y2": y2 });

            this.drawLines();
            this.drawTriangles();
            this.drawRects();
            this.drawCircles();

            this.rawBbarray.push({ "shape": 'Line', "x": x * 100 / this.width, "y": y * 100 / this.height, "x2": x2 * 100 / this.width, "y2": y2 * 100 / this.height });
            this.LineDirection('left');

        }

        if (this.ShapeName === 'Triangle' && this.isTripline == true) {
            if (this.count == 0) {
                let x1 = Math.round(this.startX - this.myCanvas.nativeElement.getBoundingClientRect().left);
                let y1 = Math.round(this.startY - this.myCanvas.nativeElement.getBoundingClientRect().top);
                let x2 = Math.round(e.clientX - this.myCanvas.nativeElement.getBoundingClientRect().left);
                let y2 = Math.round(e.clientY - this.myCanvas.nativeElement.getBoundingClientRect().top);
                this.context.beginPath();
                this.context.moveTo(x1, y1);
                this.context.lineTo(x2, y2);

                this.X1 = x1;
                this.Y1 = y1;
                this.X2 = x2;
                this.Y2 = y2;
            }
            if (this.count == 1) {
                let x3 = Math.round(e.clientX - this.myCanvas.nativeElement.getBoundingClientRect().left);
                let y3 = Math.round(e.clientY - this.myCanvas.nativeElement.getBoundingClientRect().top);

                this.context.moveTo(this.X1, this.Y1);
                this.context.lineTo(this.X2, this.Y2);
                this.context.moveTo(this.X1, this.Y1);
                this.context.lineTo(this.X2, this.Y2);
                this.context.lineTo(x3, y3);
                this.context.closePath();
                this.RectPoint.push({ "x": this.X1, "y": this.Y1, "x2": this.X2, "y2": this.Y2, "x3": x3, "y3": y3 });
                var arrX = [this.X1, this.X2, x3];
                var arrY = [this.Y1, this.Y2, y3];
                var s1, s2, s3, t1, t2, t3;
                var max = arrX.indexOf(Math.max(...arrX));
                s3 = arrX[max]; t3 = arrY[max];
                var min = arrX.indexOf(Math.min(...arrX));
                s1 = arrX[min]; t1 = arrY[min];
                arrX.splice(max, 1); arrY.splice(max, 1);
                var mid = arrX.indexOf(Math.max(...arrX));
                s2 = arrX[mid]; t2 = arrY[mid];
                this.rawBbarray.push({ "shape": 'Triangle', "x": s1 * 100 / this.width, "y": t1 * 100 / this.height, "x2": s2 * 100 / this.width, "y2": t2 * 100 / this.height, "x3": s3 * 100 / this.width, "y3": t3 * 100 / this.height })
            }
            this.count++;

            this.drawTriangles();
            this.drawRects();
            this.drawLines();
            this.drawCircles();
        }

        if (this.ShapeName === 'Circle' && this.isTripline == true) {
            var CenterX = Math.abs(this.startX - this.myCanvas.nativeElement.getBoundingClientRect().left);
            var CenterY = Math.abs(this.startY - this.myCanvas.nativeElement.getBoundingClientRect().top);

            var x2 = Math.abs(e.clientX - this.myCanvas.nativeElement.getBoundingClientRect().left);
            var y2 = Math.abs(e.clientY - this.myCanvas.nativeElement.getBoundingClientRect().top);
            var RadiusX = Math.abs(e.clientX - this.startX);
            var RadiusY = Math.abs(e.clientY - this.startY);
            var radius = Math.sqrt((RadiusX * RadiusX) + (RadiusY * RadiusY));
            this.context.beginPath();
            this.context.arc(CenterX, CenterY, radius, 0, 2 * Math.PI);
            this.context.closePath();

            this.RectPoint.push({ "x": CenterX, "y": CenterY, "radius": radius });
            this.drawRects();
            this.drawLines();
            this.drawCircles();
            this.drawTriangles();
            this.rawBbarray.push({ "shape": 'Circle', "x": CenterX * 100 / this.width, "y": CenterY * 100 / this.height, "x2": x2 * 100 / this.width, "y2": y2 * 100 / this.height, "radiusX": radius * 100 / this.width, "radiusY": radius * 100 / this.height, "startX": (CenterX - radius) * 100 / this.width, "startY": (CenterY - radius) * 100 / this.height })
        }

        if ((!(this.ShapeName === 'Triangle')) && this.isTripline == true) {
            //this.ShapeName = null;
            this.drag = false;
            //this.feature = this.compFeatureNames[0].featureName;
            this.markerName = '';
            this.TagName = '';
            document.getElementById("markerbtn").click();
        }
        else {
            if (this.count == 1) {
                this.ShapeName = this.ShapeName;
            }
            else if (this.count == 2 && this.isTripline == true) {
                this.ShapeName = null;
                this.count = 0;
                this.drag = false;
                //this.feature = this.compFeatureNames[0].featureName;
                this.markerName = '';
                this.TagName = '';
                document.getElementById("markerbtn").click();
            }
        }
    }

    addRetentionTime() {
        this.addRetention = true;
        this.calculateCost(0);
    }

    applyImage() {
        let base_image = new Image();
        base_image.src = this.previewSrc;

        this.context = this.myCanvas.nativeElement.getContext("2d");
        let context: CanvasRenderingContext2D = this.myCanvas.nativeElement.getContext("2d");
        base_image.onload = () => {

            context.drawImage(base_image, 0, 0
                , base_image.width, base_image.height, 0, 0, context.canvas.width, context.canvas.height);
        };
    }

    loadImage() {

        let base_image = new Image();
        base_image.src = this.previewSrc;

        this.context = this.myCanvas.nativeElement.getContext("2d");
        let context: CanvasRenderingContext2D = this.myCanvas.nativeElement.getContext("2d");
        base_image.onload = () => {
            context.drawImage(base_image, 0, 0
                , base_image.width, base_image.height, 0, 0, context.canvas.width, context.canvas.height);
            this.loading = false;
            this.imgResWidth = base_image.width;
            this.imgResHeight = base_image.height;
            this.ShapeName = 'Rectangle';
            this.storedBBox();
        };
    }

    ReloadImage() {
        let base_image = new Image();
        base_image.src = this.previewSrc;

        this.context = this.myCanvas.nativeElement.getContext("2d");
        let context: CanvasRenderingContext2D = this.myCanvas.nativeElement.getContext("2d");
        base_image.onload = () => {
            context.drawImage(base_image, 0, 0
                , base_image.width, base_image.height, 0, 0, context.canvas.width, context.canvas.height);

            this.drawTriangles();
            this.drawCircles();
            this.drawRects();
            this.drawLines();
        };
    }

    drawRects() {
        let canvasref = this.myCanvas;
        this.RectPoint.forEach(function (item) {

            canvasref.nativeElement.getContext("2d").lineWidth = 2;
            canvasref.nativeElement.getContext("2d").strokeStyle = 'red';
            canvasref.nativeElement.getContext("2d").stroke();

            canvasref.nativeElement.getContext("2d").beginPath();
            canvasref.nativeElement.getContext("2d").setLineDash([]);
            canvasref.nativeElement.getContext("2d").strokeRect(item.x, item.y, item.w, item.h);
            canvasref.nativeElement.getContext("2d").closePath();
            canvasref.nativeElement.getContext("2d").stroke();
        })
    };

    drawLines() {
        let canvasref = this.myCanvas;
        var Width = this.width;
        var Height = this.height;
        this.RectPoint.forEach(function (item) {
            canvasref.nativeElement.getContext("2d").lineWidth = 2;
            canvasref.nativeElement.getContext("2d").strokeStyle = 'red';
            canvasref.nativeElement.getContext("2d").stroke();

            canvasref.nativeElement.getContext("2d").beginPath();
            canvasref.nativeElement.getContext("2d").setLineDash([]);
            canvasref.nativeElement.getContext("2d").moveTo(item.x, item.y);
            canvasref.nativeElement.getContext("2d").lineTo(item.x2, item.y2);
            canvasref.nativeElement.getContext("2d").closePath();
            canvasref.nativeElement.getContext("2d").stroke();

        })
    };

    drawCircles() {
        let canvasref = this.myCanvas;
        this.RectPoint.forEach(function (item) {
            canvasref.nativeElement.getContext("2d").lineWidth = 2;
            canvasref.nativeElement.getContext("2d").strokeStyle = 'red';
            canvasref.nativeElement.getContext("2d").stroke();

            canvasref.nativeElement.getContext("2d").beginPath();
            canvasref.nativeElement.getContext("2d").setLineDash([]);
            canvasref.nativeElement.getContext("2d").arc(item.x, item.y, item.radius, 0, 2 * Math.PI);
            canvasref.nativeElement.getContext("2d").closePath();
            canvasref.nativeElement.getContext("2d").stroke();
        })
    };

    drawTriangles() {
        let canvasref = this.myCanvas;
        this.RectPoint.forEach(function (item) {
            canvasref.nativeElement.getContext("2d").lineWidth = 2;
            canvasref.nativeElement.getContext("2d").strokeStyle = 'red';
            canvasref.nativeElement.getContext("2d").stroke();

            canvasref.nativeElement.getContext("2d").beginPath();
            canvasref.nativeElement.getContext("2d").setLineDash([]);
            canvasref.nativeElement.getContext("2d").moveTo(item.x, item.y);
            canvasref.nativeElement.getContext("2d").lineTo(item.x2, item.y2);
            canvasref.nativeElement.getContext("2d").lineTo(item.x3, item.y3);
            canvasref.nativeElement.getContext("2d").closePath();
            canvasref.nativeElement.getContext("2d").stroke();
        })
    };

    LineDirection(e) {

        var index = (this.RectPoint.length) - 1;
        var x = this.RectPoint[index].x;
        var y = this.RectPoint[index].y;
        var x2 = this.RectPoint[index].x2;
        var y2 = this.RectPoint[index].y2;

        this.rawBbarray.splice(index, 1);
        if (this.lineDir === 'left' || this.lineDir === 'right') {
            if (y > y2) {
                let Y = y2; let X = x2; let Y2 = y; let X2 = x;
                this.rawBbarray.push({ "shape": 'Line', "x": X * 100 / this.width, "y": Y * 100 / this.height, "x2": X2 * 100 / this.width, "y2": Y2 * 100 / this.height });
            }
            else {
                this.rawBbarray.push({ "shape": 'Line', "x": x * 100 / this.width, "y": y * 100 / this.height, "x2": x2 * 100 / this.width, "y2": y2 * 100 / this.height });
            }
        }
        if (this.lineDir === 'top' || this.lineDir === 'bottom') {
            if (x > x2) {
                let Y = y2; let X = x2; let Y2 = y; let X2 = x;
                this.rawBbarray.push({ "shape": 'Line', "x": X * 100 / this.width, "y": Y * 100 / this.height, "x2": X2 * 100 / this.width, "y2": Y2 * 100 / this.height });
            }
            else {
                this.rawBbarray.push({ "shape": 'Line', "x": x * 100 / this.width, "y": y * 100 / this.height, "x2": x2 * 100 / this.width, "y2": y2 * 100 / this.height });
            }
        }

    }
    storedBBox() {
        var canvasWidth = this.width;
        var canvasHeight = this.height;
        var canvascoors = [];
        var bboxcoors = [];
        var markerArr = [];

        var rawbb = JSON.parse(sessionStorage.getItem('camdetails'));

        if (rawbb != null) {

            rawbb.boundingBox.forEach(function (item) {
                markerArr.push(item.markerName);
                if (item.shape === 'Rectangle') {
                    var rect = {
                        x: item.x * canvasWidth / 100,
                        y: item.y * canvasHeight / 100,
                        w: (item.x2 - item.x) * canvasWidth / 100,
                        h: (item.y2 - item.y) * canvasHeight / 100
                    };
                    canvascoors.push(rect);

                    var raw = {
                        shape: 'Rectangle',
                        x: item.x,
                        y: item.y,
                        x2: item.x2,
                        y2: item.y2,
                        markerName: item.markerName,
                        tagName: item.tagName
                    };
                    bboxcoors.push(raw);
                }

                if (item.shape === 'Line') {
                    var line = {
                        // direction: item.direction,
                        x: item.x * canvasWidth / 100,
                        y: item.y * canvasHeight / 100,
                        x2: item.x2 * canvasWidth / 100,
                        y2: item.y2 * canvasHeight / 100
                    };
                    canvascoors.push(line);

                    var raw1 = {
                        shape: 'Line',
                        x: item.x,
                        y: item.y,
                        x2: item.x2,
                        y2: item.y2,
                        direction: item.direction,
                        markerName: item.markerName,
                        tagName: item.tagName
                    };
                    bboxcoors.push(raw1);
                }

                if (item.shape === 'Circle') {
                    var radiusX = ((item.x2 - item.x) / 100) * canvasWidth;
                    var radiusY = ((item.y2 - item.y) / 100) * canvasHeight;
                    var radius = Math.sqrt((radiusX * radiusX) + (radiusY * radiusY));

                    var circle = {
                        x: item.x * canvasWidth / 100,
                        y: item.y * canvasHeight / 100,
                        radius: radius
                    };
                    canvascoors.push(circle);

                    var rawC = {
                        shape: 'Circle',
                        x: item.x,
                        y: item.y,
                        x2: item.x2,
                        y2: item.y2,
                        startX: item.startX,
                        startY: item.startY,
                        radiusX: item.radiusX,
                        radiusY: item.radiusY,
                        markerName: item.markerName,
                        tagName: item.tagName
                    };
                    bboxcoors.push(rawC);
                }

                if (item.shape === 'Triangle') {
                    var triangle = {
                        x: item.x * canvasWidth / 100,
                        y: item.y * canvasHeight / 100,
                        x2: item.x2 * canvasWidth / 100,
                        y2: item.y2 * canvasHeight / 100,
                        x3: item.x3 * canvasWidth / 100,
                        y3: item.y3 * canvasHeight / 100
                    };
                    canvascoors.push(triangle);

                    var raw2 = {
                        shape: 'Triangle',
                        x: item.x,
                        y: item.y,
                        x2: item.x2,
                        y2: item.y2,
                        x3: item.x3,
                        y3: item.y3,
                        markerName: item.markerName,
                        tagName: item.tagName
                    };
                    bboxcoors.push(raw2);
                }
            })
        }

        sessionStorage.setItem("markerArr", JSON.stringify(markerArr));
        sessionStorage.setItem("storedMarkerArr", JSON.stringify(markerArr));
        this.RectPoint = [...canvascoors];
        this.rawBbarray = [...bboxcoors];
        this.drawTriangles();
        this.drawCircles();
        this.drawRects();
        this.drawLines();
    };

    triplineCondn() {

        if (this.rawBbarray != null) {
            var _self = this;
            this.rawBbarray.forEach(function (item) {

                if (item.shape === 'Rectangle' || item.shape === 'Triangle' || item.shape === 'Circle') {
                    _self.isTripline = false;
                }
                else {
                    _self.isTripline = true;
                }
            })
            if (this.isTripline === false) {
                _self.toastrService.Error("", "Please Reset other Shapes to use Tripline");
            }
            else {
            }
        }
    }

    OtherShapes() {

        if (this.rawBbarray != null) {
            var _self = this;
            this.rawBbarray.forEach(function (item) {

                if (item.shape === 'Line') {
                    _self.isTripline = false;
                }
                else {
                    _self.isTripline = true;
                }
            })
            if (this.isTripline === false) {
                _self.toastrService.Error("", "Please Reset Tripline to use other Shapes");
            }
            else {

            }
        }
    }

    markerProp() {
        var isName = false;
        var storeName = false;
        this.markerArr = JSON.parse(sessionStorage.getItem('markerArr'));
        this.storedMarkerArr = JSON.parse(sessionStorage.getItem('storedMarkerArr'));
        var _self = this;
        var marker = this.markerName;

        if (this.markerArr === null || this.markerArr.length == 0) {
            this.markerArr = [];

            if (this.storedMarkerArr === null || this.storedMarkerArr.length == 0) {
                isName = false;
                storeName = false;
            }
            else {
                this.storedMarkerArr.forEach(function (item) {
                    if (!storeName) {
                        if (marker === item) {
                            isName = false;
                            storeName = true;
                        }
                        else {
                            isName = false;
                            storeName = false;
                        }
                    }
                })
            }
        }

        else {
            this.markerArr.forEach(function (item) {
                if (!isName) {
                    if (marker === item) {
                        isName = true;
                    }
                    else {
                        if (_self.storedMarkerArr === null || _self.storedMarkerArr.length == 0) {
                            isName = false;
                            storeName = false;
                        }
                        else {
                            _self.storedMarkerArr.forEach(function (item) {
                                if (!storeName) {
                                    if (marker === item) {
                                        isName = false;
                                        storeName = true;
                                    }
                                    else {
                                        isName = false;
                                        storeName = false;
                                    }
                                }
                            })
                        }
                    }
                }
            })
        }

        if (isName === false) {
            if (!storeName) {
                this.markerArr.push(marker);
                sessionStorage.setItem("markerArr", JSON.stringify(this.markerArr));
                this.checkMarkerName();
            }
            else {
                this.markerArr.push(marker);
                sessionStorage.setItem("markerArr", JSON.stringify(this.markerArr));
                this.acceptMarkerName();
            }
        }
        else {
            this.toastrService.Error("", "Please use a different Marker Name");
        }
    }

    checkMarkerName() {
        this.http.get<any>(this.vmUrl + '/cameras/markers?marker=' + this.markerName)
            .subscribe(
            res => {
                this.acceptMarkerName();
            },

            err => {
                console.log("error", err);
                if (err = 409) {
                    this.toastrService.Error("", "Please use a different Marker Name");
                }
            });
    }

    acceptMarkerName() {
        var arrIndex = this.rawBbarray.length - 1;
        var tempBbArr = this.rawBbarray[arrIndex];
        //tempBbArr.featureName = this.feature;
        tempBbArr.markerName = this.markerName;
        tempBbArr.tagName = this.TagName;
        if (this.ShapeName === 'Line') {
            tempBbArr.direction = this.lineDir;
        }
        if (this.featureName === 'objectDetection') {
            tempBbArr.detectionObjects = [this.objectType];
        }
        else {
            tempBbArr.detectionObjects = ["person"];
        }
        this.rawBbarray[arrIndex] = tempBbArr;

        document.getElementById("closemarkerbtn").click();
        this.ShapeName = null;
        this.toastrService.Success("", "Successfully added area of interest");
    }

    deleteBbox() {
        this.ShapeName = null;
        this.markerArr = JSON.parse(sessionStorage.getItem('markerArr'));
        var arrIndex = this.rawBbarray.length - 1;
        if (this.markerArr != null) {
            this.markerArr.splice(arrIndex, 1);
            sessionStorage.setItem("markerArr", JSON.stringify(this.markerArr));
        }
        this.rawBbarray.splice(arrIndex, 1);
        this.RectPoint.splice(arrIndex, 1);
        this.ReloadImage();
    }

    onReset() {
        this.RectPoint = [];
        this.rawBbarray = [];
        var markerArr = [];
        this.isTripline = true;
        this.OtherShapes();
        this.triplineCondn();
        this.applyImage();
        this.drawRects();
        this.drawLines();
        this.drawCircles();
        this.drawTriangles();

        var rawbb = JSON.parse(sessionStorage.getItem('camdetails')).boundingBox;
        rawbb.forEach(function (item) {
            markerArr.push(item.markerName);
        })
        sessionStorage.setItem("storedMarkerArr", JSON.stringify(markerArr));
        sessionStorage.setItem("markerArr", null);
    }

    forRawImage() {
        var isRawImageStored = false;
        var previewSrc = '';
        var streamingUrl = this.navigationParam.streamingUrl;

        var rawImages = JSON.parse(sessionStorage.getItem('rawImages'));
        if (rawImages === null) {
            // console.log("No raw images");
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
                        // console.log(isRawImageStored);
                    }
                }
            })
        }
        if (isRawImageStored === false) {
            this.getRawImage();
        }
        else {
            this.previewSrc = previewSrc;
            this.loadImage();
        }

        this.http.get<any>(this.vmUrl + '/computeengines/' + this.computeEngineId
        ).subscribe(data => {

            sessionStorage.setItem("jetsonCamFolderLocation", data.jetsonCamFolderLocation);
            data.detectionAlgorithms.forEach(item => {
                var result = item.featureName.replace(/([A-Z])/g, " $1");
                var finalResult = result.charAt(0).toUpperCase() + result.slice(1);
                item["displayAlgo"] = finalResult;
                //console.log(item1);
            });

            this.compFeatureNames = data.detectionAlgorithms;
            // sessionStorage.setItem("cloudServiceUrl", data.detectionAlgorithms[0].cloudServiceUrl);
            this.featureName = data.detectionAlgorithms[0].featureName;

            this.apiCount++;
            if (this.apiCount == 2) {
                this.loading = false;
            }

            //this.feature = data.detectionAlgorithms[0].featureName;
            //this.loading = false;
        },
            err => {
                this.loading = false;
                this.toastrService.Error("", "Unable to load data : Server Error");
                console.log("error", err);
            });

        this.http.get<any>(this.vmUrl + '/cameras/' + this.cameraId)
            .subscribe(
            res => {
                this.seleCamArr = res;
            },
            err => {
                console.log("error", err);
            });
    }

    getRawImage() {
        this.storeImage = true;
        var data = {
            "deviceType": this.navigationParam.deviceType,
            "streamingUrl": this.navigationParam.streamingUrl,
            "cameraId": sessionStorage.getItem('cameraId'),
            "aggregatorId": this.navigationParam.aggregatorName,
            "computeEngineId": this.navigationParam.computeEngineName
        }

        this.http.post(this.vmUrl + '/cameras/raw', data)
            .subscribe(
            res => {
                console.log("get raw image : ", res);

                var r1 = JSON.stringify(res);
                var r2 = JSON.parse(r1);
                if (r2.status == 200) {
                    this.waitForRawImage();
                    console.log("TIMEOUT STARTED");
                }

            },
            err => {
                this.toastrService.Error("", "Something went wrong!!! Please check after sometime.");
                console.log("error response", err);
            });

    }

    waitForRawImage() {
        this.timeoutVar = setTimeout(() => {
            this.toastrService.Error("", "Couldn't get Reference Image !!! Please check after sometime.");
            this.goToCameras();
        }, 30000);
    }

    shapeSelected(shapeName) {
        this.ShapeName = shapeName;
        this.count = 0;
        this.drag = false;
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

    FeatureSelected(event) {
        if (this.RectPoint.length != 0) {
            this.toastrService.Info("", "Selected Feature Name will be reflected in all the areas of interest drawn!");
        }
        this.featureSelectionIndex = this.compFeatureNames.indexOf(this.compFeatureNames.filter(item => item.featureName === this.featureName)[0]);
        // sessionStorage.setItem("cloudServiceUrl", this.compFeatureNames[this.featureSelectionIndex].cloudServiceUrl);
        sessionStorage.setItem("computeEngineFps", this.compFeatureNames[this.featureSelectionIndex].fps);
        if (this.featureName === 'objectDetection') {
            this.objects = this.compFeatureNames[this.featureSelectionIndex].objectSupported;
            this.objects.sort();
            this.objectType = this.objects[0];
            //this.object = {"Type": this.objects[0]}
            //console.log(this.objectType, this.objects, this.featureSelectionIndex);
        }
    }

    goBackFromUpdate() {
        var addCam = JSON.parse(sessionStorage.getItem('camdetails'));
        let navigationBackFromUpdate: NavigationExtras =
            {
                queryParams: {
                    webUrl: 'editCameraBack',
                    streamingUrl: this.navigationParam.streamingUrl,
                    deviceName: this.navigationParam.deviceName,
                    deviceType: this.navigationParam.deviceType,
                    floorMap: this.navigationParam.location,
                    aggregatorName: this.navigationParam.aggregatorName,
                    computeEngineName: this.navigationParam.computeEngineName,
                    cameraType: this.filter
                }
            }
        this.router.navigate(["/layout/deviceManagement/connectCameraDashboard"], navigationBackFromUpdate);
    }

    goBackToFromConnectCam() {
        var addCam = JSON.parse(sessionStorage.getItem('camdetails'));
        let navigationBackFromConnectCam: NavigationExtras =
            {
                queryParams: {
                    webUrl: 'dashCameraBack',
                    streamingUrl: this.navigationParam.streamingUrl,
                    deviceName: this.navigationParam.deviceName,
                    deviceType: this.navigationParam.deviceType,
                    floorMap: this.navigationParam.location,
                    aggregatorName: this.navigationParam.aggregatorName,
                    computeEngineName: this.navigationParam.computeEngineName,
                    cameraType: this.filter
                }
            }
        this.router.navigate(["/layout/deviceManagement/connectCameraDashboard"], navigationBackFromConnectCam);
    }

    goBackFromSlider() {

        var addCam = JSON.parse(sessionStorage.getItem('camdetails'));
        let navigationBackFromSLider: NavigationExtras =
            {
                queryParams: {
                    webUrl: 'areaMappingBack',
                    streamingUrl: this.navigationParam.streamingUrl,
                    deviceName: this.navigationParam.deviceName,
                    deviceType: this.navigationParam.deviceType,
                    floorMap: this.navigationParam.location,
                    aggregatorName: this.navigationParam.aggregatorName,
                    computeEngineName: this.navigationParam.computeEngineName
                }
            }
        this.router.navigate(["/cameraMappingSlider"], navigationBackFromSLider);
    }

    MarkAndFinish() {
        this.loading = true;

        this.rawBbarray.forEach((item, index) => {
            if (item.x2 <= 0 || item.y2 <= 0) {
                this.rawBbarray.splice(index, 1);
            }
        });

        this.rawBbarray.map((obj) => {
            obj.featureName = this.featureName;
            return obj;
        })
        this.rawbbarray = this.rawBbarray;
        if (this.rawbbarray.length == 0) {
            this.toastrService.Info("", "Camera is configured with total area shown");
            this.rawbbarray = [{ "shape": 'Rectangle', "x": 1, "y": 1, "x2": 99, "y2": 99, "detectionObjects": ["person"], "markerName": this.navigationParam.deviceName + ' default', "tagName": this.navigationParam.deviceName + ' default', "featureName": this.featureName }]
        }
        if (!(this.featureName === 'objectDetection')) {
            this.rawbbarray.map((obj) => {
                obj.detectionObjects = ["person"];
                return obj;
            })
        }
        else {
        }

        var vmData = {
            "Coords": this.rawbbarray,
            "frameWidth": { "width": this.width, "height": this.height },
            "imageHeight": this.imgResHeight,
            "imageWidth": this.imgResWidth,
            "feature": this.featureName,
            "deviceType": this.navigationParam.deviceType,
            "camId": sessionStorage.getItem('cameraId'),
            "streamingUrl": this.navigationParam.streamingUrl,
            "deviceName": this.navigationParam.deviceName,
            "aggregatorId": this.navigationParam.aggregatorName,
            "computeEngineId": this.navigationParam.computeEngineName,
            "jetsonCamFolderLocation": sessionStorage.getItem('jetsonCamFolderLocation')
            // "cloudServiceUrl": sessionStorage.getItem('cloudServiceUrl')
        };
        this.http.put(this.vmUrl + '/cameras/aoi', vmData)
            .subscribe(
            res => {
                this.loading = false;
                this.router.navigate(["/cameraAdded"]);
            },
            err => {
                this.loading = false;
                console.log("error response", err);
            });
    }

    MarkArea() {
        this.loading = true;

        this.rawBbarray.forEach((item, index) => {
            if (item.x2 <= 0 || item.y2 <= 0) {
                this.rawBbarray.splice(index, 1);
            }
        });
        this.rawBbarray.map((obj) => {
            obj.featureName = this.featureName;
            return obj;
        })
        this.rawbbarray = this.rawBbarray;
        if (this.rawbbarray.length == 0) {
            this.toastrService.Info("", "Camera is configured with total area shown");
            this.rawbbarray = [{ "shape": 'Rectangle', "x": 1, "y": 1, "x2": 99, "y2": 99, "detectionObjects": ["person"], "markerName": this.navigationParam.deviceName + ' default', "tagName": this.navigationParam.deviceName + ' default', "featureName": this.featureName }]
        }

        if (!(this.featureName === 'objectDetection')) {
            this.rawbbarray.map((obj) => {
                obj.detectionObjects = ["person"];
                return obj;
            })
        }
        else {
        }

        var vmData = {
            "Coords": this.rawbbarray,
            "frameWidth": { "width": this.width, "height": this.height },
            "imageHeight": this.imgResHeight,
            "imageWidth": this.imgResWidth,
            "feature": this.featureName,
            "deviceType": this.navigationParam.deviceType,
            "camId": sessionStorage.getItem('cameraId'),
            "streamingUrl": this.navigationParam.streamingUrl,
            "deviceName": this.navigationParam.deviceName,
            "aggregatorId": this.navigationParam.aggregatorName,
            "computeEngineId": this.navigationParam.computeEngineName,
            "jetsonCamFolderLocation": sessionStorage.getItem('jetsonCamFolderLocation')
            // "cloudServiceUrl": sessionStorage.getItem('cloudServiceUrl')
        };

        this.http.put(this.vmUrl + '/cameras/aoi', vmData)
            .subscribe(
            res => {
                this.loading = false;

                this.navigationExtrasCancel2 = {
                    queryParams: {
                        webUrl: 'cancelCamera',
                        cameraType: this.filter
                    }
                }
                this.router.navigate(["layout/devices/Cameras"], this.navigationExtrasCancel2);
            },
            err => {
                this.loading = false;
                console.log("error response", err);
            });
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

    calculateCost(element) {
        var time = 0;

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
        this.showCost = true;
    }
    startStreaming(flag) {

        this.checkFlag = flag;
        this.loading = true;
        this.rawBbarray.forEach((item, index) => {
            if (item.x2 <= 0 || item.y2 <= 0) {
                this.rawBbarray.splice(index, 1);
            }
        });
        this.rawBbarray.map((obj) => {
            obj.featureName = this.featureName;
            return obj;
        })

        this.rawbbarray = this.rawBbarray;
        var frameWidth = this.context.canvas.width;
        var frameHeight = this.context.canvas.height;
        if (this.rawbbarray.length == 0) {
            this.toastrService.Info("", "Camera is configured with total area shown");
            this.rawbbarray = [{ "shape": 'Rectangle', "x": 1, "y": 1, "x2": 99, "y2": 99, "detectionObjects": ["person"], "markerName": this.navigationParam.deviceName + ' default', "tagName": this.navigationParam.deviceName + ' default', "featureName": this.featureName }]
        }
        if (!(this.featureName === 'objectDetection')) {
            this.rawbbarray.map((obj) => {
                obj.detectionObjects = ["person"];
                return obj;
            })
        }
        else {
        }

        var vmData = {
            "Coords": this.rawbbarray,
            "frameWidth": { "width": frameWidth, "height": frameHeight },
            "imageHeight": this.imgResHeight,
            "imageWidth": this.imgResWidth,
            "feature": this.featureName,
            "deviceType": this.navigationParam.deviceType,
            "camId": sessionStorage.getItem('cameraId'),
            "streamingUrl": this.navigationParam.streamingUrl,
            "deviceName": this.navigationParam.deviceName,
            "aggregatorId": this.navigationParam.aggregatorName,
            "computeEngineId": this.navigationParam.computeEngineName,
            "jetsonCamFolderLocation": sessionStorage.getItem('jetsonCamFolderLocation')
            // "cloudServiceUrl": sessionStorage.getItem('cloudServiceUrl')
        };


        var updateStatus = {};
        if (this.featureName == 'faceRecognition') {

            if (this.checkFlag == 0) {
                updateStatus = {
                    "status": 1,
                    "camId": sessionStorage.getItem('cameraId'),
                    "aggregatorId": this.navigationParam.aggregatorName,
                    "computeEngineId": this.navigationParam.computeEngineName,
                    "deviceType": this.navigationParam.deviceType,
                    "sendImagesFlag": true,
                    "videoName": this.videoName
                };
            }
            else {
                updateStatus = {
                    "status": 1,
                    "camId": sessionStorage.getItem('cameraId'),
                    "aggregatorId": this.navigationParam.aggregatorName,
                    "computeEngineId": this.navigationParam.computeEngineName,
                    "deviceType": this.navigationParam.deviceType,
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
                    "camId": sessionStorage.getItem('cameraId'),
                    "aggregatorId": this.navigationParam.aggregatorName,
                    "computeEngineId": this.navigationParam.computeEngineName,
                    "deviceType": this.navigationParam.deviceType,
                    "sendImagesFlag": true,
                    "videoName": this.videoName
                };
            }
            else {
                updateStatus = {
                    "status": 1,
                    "camId": sessionStorage.getItem('cameraId'),
                    "aggregatorId": this.navigationParam.aggregatorName,
                    "computeEngineId": this.navigationParam.computeEngineName,
                    "deviceType": this.navigationParam.deviceType,
                    "sendImagesFlag": true,
                    "retentionPeriod": this.retentionDuration,
                    "videoName": this.videoName
                };
            }
        }

        this.http.put(this.vmUrl + '/cameras/aoi', vmData)
            .subscribe(
            res => {

                this.http.put(this.vmUrl + '/cameras/status', updateStatus)
                    .subscribe(
                    res => {

                        this.loading = false;
                        this.router.navigate(["layout/dashboard"]);
                    },
                    err => {
                        console.log("error response", err);
                        if (err = 429) {
                            this.loading = false;
                            this.toastrService.Error("", "Please use another Compute Engine");
                        }
                    });
            },
            err => {
                console.log("error response", err);
            });
    }


    startStreamingAndFinish() {

        this.loading = true;
        this.rawBbarray.forEach((item, index) => {
            if (item.x2 <= 0 || item.y2 <= 0) {
                this.rawBbarray.splice(index, 1);
            }
        });
        this.rawBbarray.map((obj) => {
            obj.featureName = this.featureName;
            return obj;
        })

        this.rawbbarray = this.rawBbarray;
        var frameWidth = this.context.canvas.width;
        var frameHeight = this.context.canvas.height;
        if (this.rawbbarray.length == 0) {
            this.toastrService.Info("", "Camera is configured with total area shown");
            this.rawbbarray = [{ "shape": 'Rectangle', "x": 1, "y": 1, "x2": 99, "y2": 99, "detectionObjects": ["person"], "markerName": this.navigationParam.deviceName + ' default', "tagName": this.navigationParam.deviceName + ' default', "featureName": this.featureName }]
        }
        if (!(this.featureName === 'objectDetection')) {
            this.rawbbarray.map((obj) => {
                obj.detectionObjects = ["person"];
                return obj;
            })
        }
        else {
        }

        var vmData = {
            "Coords": this.rawbbarray,
            "frameWidth": { "width": frameWidth, "height": frameHeight },
            "imageHeight": this.imgResHeight,
            "imageWidth": this.imgResWidth,
            "feature": this.featureName,
            "deviceType": this.navigationParam.deviceType,
            "camId": sessionStorage.getItem('cameraId'),
            "streamingUrl": this.navigationParam.streamingUrl,
            "deviceName": this.navigationParam.deviceName,
            "aggregatorId": this.navigationParam.aggregatorName,
            "computeEngineId": this.navigationParam.computeEngineName,
            "jetsonCamFolderLocation": sessionStorage.getItem('jetsonCamFolderLocation')
            // "cloudServiceUrl": sessionStorage.getItem('cloudServiceUrl')
        };

        var updateStatus = {};
        if (this.featureName == 'faceRecognition') {
            updateStatus = {
                "status": 1,
                "camId": sessionStorage.getItem('cameraId'),
                "aggregatorId": this.navigationParam.aggregatorName,
                "computeEngineId": this.navigationParam.computeEngineName,
                "deviceType": this.navigationParam.deviceType,
                "sendImagesFlag": true,
                "retentionPeriod": this.retentionDuration,
                "videoName": this.videoName
            };
        }
        else {
            updateStatus = {
                "status": 1,
                "camId": sessionStorage.getItem('cameraId'),
                "aggregatorId": this.navigationParam.aggregatorName,
                "computeEngineId": this.navigationParam.computeEngineName,
                "deviceType": this.navigationParam.deviceType,
                "retentionPeriod": this.retentionDuration,
                "videoName": this.videoName
            };
        }

        this.http.put(this.vmUrl + '/cameras/aoi', vmData)
            .subscribe(
            res => {

                this.http.put(this.vmUrl + '/cameras/status', updateStatus)
                    .subscribe(
                    res => {
                        this.loading = false;
                        this.router.navigate(["/cameraAdded"]);
                    },
                    err => {
                        console.log("error response", err);
                        if (err = 429) {
                            this.loading = false;
                            this.toastrService.Error("", "Please use another Compute Engine");
                        }
                    });
            },
            err => {
                console.log("error response", err);
            });

    }
}
