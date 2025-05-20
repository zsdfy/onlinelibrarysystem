package com.example.demo.service.impl;

import cn.hutool.crypto.digest.DigestUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.demo.mapper.UserMapper;
import com.example.demo.pojo.User;
import com.example.demo.service.UserService;
import org.springframework.stereotype.Service;

import javax.management.Query;

@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {
    @Override
    public boolean login(String Username, String Password) {
        QueryWrapper<User> qw = new QueryWrapper<>();  //条件构造器
        qw.eq("username", Username);
        User user = this.baseMapper.selectOne(qw);
        if(user == null){
            return false;
        }
        String s = DigestUtil.md5Hex(Password);
        if(s.equals(user.getPassword())){
            return true;
        } else {
            return false;
        }

    }
}
