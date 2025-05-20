package com.example.demo.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.example.demo.pojo.Type;

import java.util.List;

public interface TypeService extends IService<Type> {
    List<Type> getAllTypes();
}
