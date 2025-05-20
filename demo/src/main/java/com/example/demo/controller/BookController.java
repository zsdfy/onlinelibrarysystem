package com.example.demo.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.demo.dto.Result;
import com.example.demo.pojo.Book;
import com.example.demo.service.BookService;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/books")
@CrossOrigin(origins = "*")
public class BookController {

    @Autowired
    private BookService bookService;

//    // 获取所有书籍
//    @GetMapping
//    public Result<List<Book>> getAllBooks() {
//        List<Book> books = bookService.list();
//        return Result.success(books, null);
//    }
//
//    // 创建书籍
//    @PostMapping
//    public Result<Book> createBook(@RequestBody Book book) {
//        bookService.save(book);
//        return Result.success(book, null);
//    }
    @GetMapping
    public ResponseEntity<Result<List<Book>>> listBooks(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize) {

        // 参数校验
        if (pageNum < 1) pageNum = 1;
        if (pageSize < 1) pageSize = 10;

        // 构建查询条件
        QueryWrapper<Book> qw = new QueryWrapper<>();
        if (StringUtils.hasText(keyword)) {
            qw.like("bname", keyword)
                    .or()
                    .like("author", keyword);
        }



        // MyBatis-Plus 分页查询
        Page<Book> page = new Page<>(pageNum, pageSize);
        IPage<Book> bookPage = bookService.page(page, qw);

        // 直接返回分页结果
//        return ResponseEntity.ok(
//                Result.success(
//                        bookPage.getRecords(),
//                        new PageInfo<>(bookPage.getRecords(), (int) bookPage.getPages())
//                )
//        );

        // 构造自定义分页信息
        PageInfo<Book> pageInfo = new PageInfo<>();
        pageInfo.setPageNum(pageNum);
        pageInfo.setPageSize(pageSize);
        pageInfo.setTotal(bookPage.getTotal());
        pageInfo.setPages((int) bookPage.getPages());

        // 分页查询
//        PageHelper.startPage(pageNum, pageSize);
//        List<Book> books = bookService.list(qw);
//        PageInfo<Book> pageInfo = new PageInfo<>(books);

        // 返回统一响应
        return ResponseEntity.ok(
                Result.success(bookPage.getRecords(), pageInfo)
        );
//        return ResponseEntity.ok(
//                Result.success(books, pageInfo)
//        );
    }
}

//@Controller
//@RequestMapping("book")
//public class BookController {
//    @Autowired
//    private BookService bookService;
//
//    @RequestMapping("listBook")
//    public String listBook(@RequestParam(required = false, value = "pageNum", defaultValue = "1")Integer pageNum,
//                           @RequestParam(required = false, value = "pageSize", defaultValue = "10")Integer pageSize,
//                           Model model, Book book) {
//        if(pageNum<0 || pageNum.equals("") || pageNum==null) {
//            pageNum = 1;
//        }
//        if(pageSize<0 || pageSize.equals("") || pageSize==null) {
//            pageSize = 10;
//        }
//        PageHelper.startPage(pageNum, pageSize);
//        QueryWrapper<Book> qw = new QueryWrapper<>();
//        if(book.getBname() != null) {
//            qw.like("bname",book.getBname());
//
//        }
//        List<Book> list = bookService.list(qw);
//        PageInfo<Book> pageInfo = new PageInfo<>(list);
//        model.addAttribute("pageInfo", pageInfo);
//        return "图书管理";
//
//    }
//}
