package com.example.demo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class AccountController {

    @RequestMapping("toRegister")
    public String toRegister() {
        return "register";
    }

    @RequestMapping("toRegister")
    public String toRegister() {}

}
