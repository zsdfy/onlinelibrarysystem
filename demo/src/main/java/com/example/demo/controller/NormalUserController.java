package com.example.demo.controller;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.demo.pojo.Book;
import com.example.demo.pojo.Reader;
import com.example.demo.pojo.ReaderBook;
import com.example.demo.service.BookService;
import com.example.demo.service.ReaderBookService;
import com.example.demo.service.ReaderService;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.util.ArrayList;
import java.util.List;

@Controller
@RequestMapping("normalUser")

public class NormalUserController {

    @Autowired
    private BookService bookService;
    @Autowired
    private ReaderBookService readerBookService; // 新增一系列ReaderBook相关文件
    @Autowired
    private ReaderService readerService;
    @RequestMapping("myBookList")
    public String myBookList(HttpServletRequest request,
                             @RequestParam(required = false, defaultValue = "1", value = "pageNum")Integer pageNum,
                             @RequestParam(required = false, defaultValue = "10", value = "pageSize")Integer pageSize, Model model, HttpSession session) {

        if (pageNum <= 0 || pageNum.equals("") || pageNum == null) {
            pageNum = 1;
        }

        if (pageSize <= 0 || pageSize.equals("") || pageSize == null) {
            pageSize = 10;
        }
        PageHelper.startPage(pageNum, pageSize);
        Integer userId = (Integer) session.getAttribute("userId"); // 可能无法获取id
        PageInfo<ReaderBook>pageInfo=readerBookService.myBookList(userId); // 此处在target-classes-templates-library文件夹中新建文件myBookList.html文件
        model.addAttribute("pageInfo",pageInfo);
        return "myBookList";
    }

    @RequestMapping("returnBook/{id}")
    public String returnBook(@PathVariable Integer id, HttpSession session) {
        Integer userId = (Integer) session.getAttribute("userId");
        ReaderBook readerBook = new ReaderBook();
        readerBook.setStatus(1);
        QueryWrapper<ReaderBook>qw=new QueryWrapper<>();
        qw.eq("rid", userId);
        qw.eq("bid", id);
        boolean update = readerBookService.update(readerBook, qw);
        Book byId = bookService.getById(id);
        byId.setStock(byId.getStock()+1);
        bookService.updateById(byId);
        return "redirect:/normalUser/myBookList";
    }

    @RequestMapping("listBook")
    public String listBook(@RequestParam(required = false,value = "pageNum", defaultValue = "1")Integer pageNum,
                           @RequestParam(required = false, value = "pageSize",defaultValue = "12")Integer pageSize, Model model, Book book) {
        if(pageNum<0 || pageNum.equals("") || pageNum==null) { // BookController
            pageNum = 1;
        }
        if(pageSize<0 || pageSize.equals("") || pageSize==null) {
            pageSize = 12;
        }
        PageHelper.startPage(pageNum, pageSize);
        QueryWrapper<Book> qw = new QueryWrapper<>();
        if(book.getBname() != null) {
            qw.like("bname",book.getBname());

        }
        List<Book> list = bookService.list(qw);
        PageInfo<Book> pageInfo = new PageInfo<>(list);
        model.addAttribute("pageInfo", pageInfo);
        return "normalUserBookList";
    }

    @RequestMapping("borrowBook/{id}")
    public String borrowBook(@PathVariable Integer id, HttpSession session, Reader reader) {
        Integer userId = (Integer)session.getAttribute("userId");
        ReaderBook readerBook = new ReaderBook();
        readerBook.setBid(id);
        readerBook.setRid(userId);
        readerBookService.save(readerBook);
        Book byId = bookService.getById(id);
        byId.setStock(byId.getStock()-1);
        bookService.updateById(byId);
        return "redirect:/normalUser/myBookList";
    }

    @RequestMapping("recommendBookList")
    public String recommendBookList(HttpSession session, @RequestParam(required = false,value = "pageNum", defaultValue = "1")Integer pageNum,
                                    @RequestParam(required = false, value = "pageSize",defaultValue = "12")Integer pageSize, Model model) {
        Integer userId = (Integer) session.getAttribute("userId");
        Reader reader = readerService.getById(userId);
        String type = reader.getType();
        String[] split = StrUtil.split(type, ",").toArray(new String[0]); // 增加类型转换.toArray(new String[0])
        List<String>list=new ArrayList<>();
        for (String s : split) {
            if (!s.isEmpty()) {
                list.add(s);
            }
        }
        QueryWrapper<Book>qw=new QueryWrapper<>();
        qw.in("type", list);
        List<Book> list1 = bookService.list(qw);
        PageInfo<Book>pageInfo=new PageInfo<>(list1);
        model.addAttribute("pageInfo",pageInfo);
        return "recommendBookList";
    }
}
