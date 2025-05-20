package com.example.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.demo.pojo.MainMenu;
import com.example.demo.pojo.ReaderBook;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReaderBookMapper extends BaseMapper<ReaderBook> {
    List<ReaderBook> listAll(String readerName);

    List<MainMenu> queryAll();

    List<ReaderBook> myBookList(Integer userId);
}
