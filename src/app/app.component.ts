import { Component, OnInit,EventEmitter } from '@angular/core';
import { MsalService } from './services/msal.service';

import { environment } from '../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RequestOptions } from '@angular/http';
declare var $:any;

declare var $:any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent{
  navchange: EventEmitter<number> = new EventEmitter();
  constructor(private http: HttpClient,private msalService: MsalService) {

    this.http.get('configs.json',    {
        headers: new HttpHeaders().set('Content-Type','application/json'),
        }
      ).subscribe((data: any) => {
            console.log('[Info] :: Config Loaded', JSON.parse(JSON.stringify(data)));
            localStorage.setItem('sessionConfiguration',JSON.stringify(data));
            //adalService.init(JSON.parse(JSON.stringify(data)).config);
            //this.navchange.emit(1);

        },
        err => this.logError(err)
        );
     //
      //adalService.init(environment.config);
    }
    getNavChangeEmitter() {
      return this.navchange;
    }
    logError(err: any) {
      sessionStorage.setItem("HELLO","HEY ITS AN URL");
      console.log("[Error]", err);
    }
}