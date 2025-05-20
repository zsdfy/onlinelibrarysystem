package com.example.demo.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.demo.mapper.ReaderBookMapper;
import com.example.demo.pojo.MainMenu;
import com.example.demo.pojo.ReaderBook;
import com.example.demo.service.ReaderBookService;
import com.github.pagehelper.PageInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReaderBookServiceImpl extends ServiceImpl<ReaderBookMapper, ReaderBook> implements ReaderBookService {

    @Autowired
    private ReaderBookMapper readerBookMapper;
    @Override
    public PageInfo<ReaderBook> listAll(String readerName) {
        List<ReaderBook> list=readerBookMapper.listAll(readerName);
        return new PageInfo<>(list);
    }

    @Override
    public List<MainMenu> queryAll() {
        return readerBookMapper.queryAll();
    }

    @Override
    public PageInfo<ReaderBook> myBookList(Integer userId) {
        List<ReaderBook>list=readerBookMapper.myBookList(userId);
        return new PageInfo<>(list);
    }
}
