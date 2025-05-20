package com.example.demo.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.example.demo.pojo.MainMenu;
import com.example.demo.pojo.ReaderBook;
import com.github.pagehelper.PageInfo;

import java.util.List;

public interface ReaderBookService extends IService<ReaderBook> {
    PageInfo<ReaderBook> listAll(String readerName);

    List<MainMenu> queryAll(); // 此处MainMenu需新建

    PageInfo<ReaderBook> myBookList(Integer userId);
}
