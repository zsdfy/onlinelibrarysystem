package com.example.demo.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.example.demo.pojo.Reader;

public interface ReaderService extends IService<Reader> {
    boolean login(String username, String password);
}
