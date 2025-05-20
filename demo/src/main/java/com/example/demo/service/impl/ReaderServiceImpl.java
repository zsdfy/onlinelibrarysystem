package com.example.demo.service.impl;

import cn.hutool.crypto.digest.DigestUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.demo.mapper.ReaderMapper;
import com.example.demo.pojo.Reader;
import com.example.demo.pojo.User;
import com.example.demo.service.ReaderService;
import org.springframework.stereotype.Service;

@Service
public class ReaderServiceImpl extends ServiceImpl<ReaderMapper, Reader> implements ReaderService {
    @Override
    public boolean login(String Username, String Password) {
        QueryWrapper<Reader> qw = new QueryWrapper<>();  //条件构造器
        qw.eq("name", Username);
        Reader reader = this.baseMapper.selectOne(qw);
        if(reader == null){
            return false;
        }
        String s = DigestUtil.md5Hex(Password);
        if(s.equals(reader.getPassword())){
            return true;
        } else {
            return false;
        }

    }
}
