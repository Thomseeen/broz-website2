import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface MCServerStatus {
  status: string;
  online?: boolean;
  description?: string;
  players?: {
    max?: number;
    now?: number;
  };
  version?: number;
}

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css']
})
export class OverviewComponent implements OnInit {
  fullMCServerStatus: MCServerStatus = { status: "unknown", online: false, players: { max: 0, now: 0 } };
  mcapiAnswer;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.getMCServerStatus().subscribe(val => {
      this.mcapiAnswer = val;
      this.fullMCServerStatus.status = this.mcapiAnswer.status;
      this.fullMCServerStatus.online = this.mcapiAnswer.online;
      this.fullMCServerStatus.description = this.mcapiAnswer.motd;
      this.fullMCServerStatus.version = this.mcapiAnswer.server.name;
      this.fullMCServerStatus.players = this.mcapiAnswer.players;
      console.log('overview: MCServerStatus');
      console.log(val);
    })
  }

  getMCServerStatus() {
    return this.http.get('https://mcapi.us/server/status?ip=broz.wtf')
  }
}
