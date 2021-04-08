import { Component, OnInit } from "@angular/core";
import { ThemeService } from "../theme/theme.service";

@Component({
  selector: "app-nav",
  templateUrl: "./nav.component.html",
  styleUrls: ["./nav.component.css"]
})
export class NavComponent implements OnInit {

  constructor(
    private themeService: ThemeService
  ) {}

  ngOnInit() {
  }

  

  toggleTheme() {
    if (this.themeService.isDarkTheme()) {
      this.themeService.setLightTheme();
    } else {
      this.themeService.setDarkTheme();
    }

  }
}