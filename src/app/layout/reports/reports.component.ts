import { Component, OnInit, NgZone, NgModule } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import * as Chartist from 'chartist';
declare var $: any;
import * as data from '../../../../config'
import * as  pbi from 'powerbi-client';
import { IEmbedConfiguration, models, factories, } from 'powerbi-client';
import { ToastrService } from '../../services/toastr.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  vmUrl: string;
  public loading = false;
  token: string;
  accessToken: string;
  dId: any;
  embedUrl: string;
  isReport: boolean = false;
  isConfig: boolean = false;
  isMsg: boolean = false;
  grantType: any;
  userName: string;
  password: string;
  clientId: string;
  clientSecret: string;
  resource: string;
  oAuthUrl: string;
  cth: string;
  role: string;
  configName: string;

  constructor(private toastrService: ToastrService, public router: Router, private http: HttpClient, private zone: NgZone, public domSanitizer: DomSanitizer) {
    var session = JSON.parse(localStorage.getItem('sessionConfiguration'));
    if (session != null) {
      this.vmUrl = session.vmUrl;
    }

    this.token = localStorage.getItem('accesstoken');
    this.accessToken = '';
    this.userName = '';
    this.password = '';
    this.clientId = '';
    this.clientSecret = '';
    this.embedUrl = '';
    this.dId = '';
    this.role = '';
    this.configName = '';
  }

  ngOnInit() {
    this.loading = true;
    this.isReport = false;
    this.isConfig = false;
    this.isMsg = true;
    sessionStorage.setItem("selectedCamIndex", "0");
    sessionStorage.setItem("selectedAggrIndex", "0");
    this.role = localStorage.getItem('role');
    this.grantType = "password";
    this.resource = "https://analysis.windows.net/powerbi/api";
    this.oAuthUrl = "https://login.microsoftonline.com/common/oauth2/token";
    this.cth = "application/x-www-form-urlencoded";
    this.getToken();
  }


  onChangeConfigName(configName) {
    console.log('config name  :: ', configName);
    this.configName = configName;
  }


  getToken() {
    var data = {};
    this.http.get<any>(this.vmUrl + '/powerbi/auth?confName=Reports', )
      .subscribe(
      res => {
        
        console.log("Powerbi token:", res);
        this.accessToken = res.access_token;
        this.embedUrl = res.embed_url;
        this.dId = res.dId;
        this.userName = res.username;
        this.clientId = res.client_id;
        this.clientSecret = res.client_secret;
        this.isConfig = false;
        this.isMsg = false;
        this.isReport = true;
        var _self = this;
        setTimeout(function () {
          _self.loading = false;
          _self.showReport();
        }, 400);
      },
      err => {
        this.loading = false;
        if (err.status == '404') {
          this.isConfig = false;
          this.isMsg = true;
          this.isReport = false;
        }
        console.log("error response", err);
      });
  };

  showReport() {

    let conf: IEmbedConfiguration = {
      accessToken: this.accessToken,
      dashboardId: this.dId,
      embedUrl: this.embedUrl,
      tokenType: 0,
      settings: {
        filterPaneEnabled: false,
        navContentPaneEnabled: false
      },
      type: 'report'
    };

    let reportContainer = <HTMLElement>document.getElementById('reportContainer1');

    let powerbi = new pbi.service.Service(pbi.factories.hpmFactory, pbi.factories.wpmpFactory, pbi.factories.routerFactory);
    let report = powerbi.embed(reportContainer, conf);

    console.log("powerbi", powerbi);
    console.log("report", report);

    report.on("loaded", function () {
      console.log("Loaded");
      this._validate = true;
    });
    report.on("error", function (er) {
      console.log("error", er);
    });
  };

  reportConfig() {
    this.isConfig = true;
    this.isMsg = false;
    this.isReport = false;
  }

  sendData() {
    

    if (this.configName == '') {
      this.toastrService.Error("", "Please Select the Configuration Name");
    }
    else {
      this.loading = true;
      var data = {
        "grant_type": this.grantType,
        "username": this.userName,
        "password": this.password,
        "client_id": this.clientId,
        "client_secret": this.clientSecret,
        "resource": this.resource,
        "oauthUrl": this.oAuthUrl,
        "contentTypeHeader": this.cth,
        "embed_url": this.embedUrl,
        "dId": this.dId,
        "confName": this.configName
      }
      console.log(data);

      this.http.post<any>(this.vmUrl + '/powerbi', data)
        .subscribe(
          res => {
            this.loading = false;
            console.log("In take preview", res);
            this.isConfig = false;
            this.isMsg = false;
            this.isReport = true;
            this.getToken();
          },
          err => {
            this.loading = false;
            this.toastrService.Error("","Error Occurred While Adding the Configurations.");
            console.log("error response", err);
          });
    }

  }

  cancel() {
    this.isConfig = false;
    this.isMsg = false;
    this.isReport = true;
    this.loading = true;
    this.getToken();
  }
}
