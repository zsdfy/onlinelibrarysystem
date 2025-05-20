package com.example.demo.controller;

//import com.baomidou.mybatisplus.extension.activerecord.Model;

import com.example.demo.service.ReaderService;
import com.example.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import javax.xml.ws.RequestWrapper;

import static com.fasterxml.jackson.databind.type.LogicalType.Map;
import java.util.HashMap;
import java.util.Map;



@RestController
@RequestMapping("/api/auth")
public class AccountController {
    @Autowired
    private UserService userService;
    @Autowired
    private ReaderService readerService;

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request, // 使用DTO接收参数
            HttpSession session
    ) {
        // 统一处理管理员和普通用户
        boolean isAdmin = "admin".equals(request.getUsername()) && "12345678".equals(request.getPassword());

        boolean loginSuccess = isAdmin ? true : userService.login(request.getUsername(), request.getPassword());

        Map<String, Object> response = new HashMap<>();
        if (loginSuccess) {
            session.setAttribute("currentUser", request.getUsername());
            response.put("success", true);
            response.put("redirect", isAdmin ? "/图书管理.html" : "/推荐图书.html");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "用户名或密码错误");
            return ResponseEntity.status(401).body(response);
        }
    }
}



//@Controller
//@RequestMapping("/api/auth")
//public class AccountController {
//
//    @Autowired
//    private UserService userService;
//    @Autowired
//    private ReaderService readerService;
////    @GetMapping("/toRegister")
////    public String toRegister() {
////        return "index";
////    }
////
////    @GetMapping("/toLogin")
////    public String toLogin() {
////        return "图书管理";
////    }
//
//    //处理登录提交
//    @PostMapping("/login")
//    public String toLogin(String Username, String Password, Model model, HttpSession session) {
//        if(Username.equals("admin") && Password.equals("12345678")) {
//            boolean i = userService.login(Username, Password);
//            if(i) {
//                session.setAttribute("currentUsername", Username);
//                return "图书管理";
//            } else {
//                model.addAttribute("msg","用户名或密码错误！");
//                return "index";
//            }
//        } else {
//            boolean i = readerService.login(Username, Password);
//            if(i) {
//                session.setAttribute("currentUsername", Username);
//                return "推荐图书";
//            } else {
//                model.addAttribute("msg", "用户名或密码错误！");
//                return "index";
//            }
//        }
//    }
//}
