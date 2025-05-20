package com.example.demo.pojo;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("reader_book")
public class ReaderBook {
    private Integer id;
    private Integer rid;
    private Integer bid;
    private Integer status;
    private date borrow_time;
    private date return_time;
}
