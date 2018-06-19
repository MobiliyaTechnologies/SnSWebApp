import { Component, OnInit, Renderer, ViewChild, ElementRef } from '@angular/core';

import { ROUTES } from '../../sidebar/sidebar.component';
import { Router, ActivatedRoute } from '@angular/router';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { MsalService }  from '../../services/msal.service';
import { Socket } from 'ng-socket-io';
import * as io from 'socket.io-client';
import * as data from '../../../../config'
import { ToastrService } from '../../services/toastr.service';
@Component({
    moduleId: module.id,
    selector: 'navbar-cmp',
    templateUrl: 'navbar.component.html'
})

export class NavbarComponent implements OnInit{
    private listTitles: any[];
    location: Location;
    private nativeElement: Node;
    private toggleButton;
    private sidebarVisible: boolean;
    socket: SocketIOClient.Socket;
    vmUrl: string;
    userId: string;
    role: string;
    redLogo: boolean;
    @ViewChild("navbar-cmp") button;

    constructor(public router: Router,location:Location, private renderer : Renderer, private element : ElementRef, private toastrService: ToastrService, private msalService: MsalService) {
        var session = JSON.parse(localStorage.getItem('sessionConfiguration'));
        console.log("@@@@@@@@@",session);
        if(session != null){
          this.vmUrl = session.vmUrl;
        }
        this.userId = localStorage.getItem('userId');
        this.role = localStorage.getItem("role");
        this.location = location;
        this.nativeElement = element.nativeElement;
        this.sidebarVisible = false;
        this.redLogo = false;
        this.socket = io.connect(this.vmUrl, { secure: true });
    }

    ngOnInit(){
        // this.listTitles = ROUTES.filter(listTitle => listTitle);
        var navbar : HTMLElement = this.element.nativeElement;
        this.toggleButton = navbar.getElementsByClassName('navbar-toggle')[0];
        this.socketConnection();
    }
    // getTitle(){
    //     var titlee = window.location.pathname;
    //     titlee = titlee.substring(1);
    //     for(var item = 0; item < this.listTitles.length; item++){
    //         if("layout/"+this.listTitles[item].path === titlee){
    //             return this.listTitles[item].title;
    //         }
    //     }
    //     return 'Configuration';
    // }
    socketConnection(){
        this.socket.on('notification', (msg: any) => {
            console.log("!!!!!!!!!!!!!!!!!Notifications:", msg);  
            this.redLogo = true;
            if (msg.type == 'videoIndexing') {
                this.toastrService.Success("", "Video Indexing completed");
            }
            if (msg.type == 'faceRecognition') {
                this.toastrService.Success("", "Camera Streaming Has Stopped For Face Recognition");
            }
            if (msg.type == 'faceIdentified') {
                this.toastrService.Info("", ""+msg.message);
            }

          });
    };

    sidebarToggle(){
        var toggleButton = this.toggleButton;
        var body = document.getElementsByTagName('body')[0];

        if(this.sidebarVisible == false){
            setTimeout(function(){
                toggleButton.classList.add('toggled');
            },500);
            body.classList.add('nav-open');
            this.sidebarVisible = true;
        } else {
            this.toggleButton.classList.remove('toggled');
            this.sidebarVisible = false;
            body.classList.remove('nav-open');
        }
    }
    
    showNotifications(){
        this.redLogo = false;
        this.router.navigate(["layout/notifications"]);
    };
    logoutModal() {
           document.getElementById("logoutModal1").click();
    };

    logout():void
    {
       // this.router.navigate(["/login"]);
        var session = localStorage.getItem("sessionConfiguration");
        sessionStorage.clear();
        localStorage.clear();
        localStorage.setItem("sessionConfiguration",session);
        this.msalService.logout();
        
    }
}
