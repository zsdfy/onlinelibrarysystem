package com.example.demo.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.demo.mapper.TypeMapper;
import com.example.demo.pojo.Type;
import com.example.demo.service.TypeService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TypeServiceImpl extends ServiceImpl<TypeMapper,Type> implements TypeService{
    @Override
    public List<Type> getAllTypes() {
        return this.list();
    }
}