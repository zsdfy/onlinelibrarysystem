package com.example.demo.pojo;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("reader")
public class Reader {
    private Integer id;
    private String name;
    private String password;
    private String phone;
    private String email;
    private String type;
    private String rimage;
}
