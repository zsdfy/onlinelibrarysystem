package com.example.demo.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.example.demo.pojo.User;

public interface UserService extends IService<User> {
    boolean login(String username, String password);
}
