package com.example.demo.dto;

import com.github.pagehelper.PageInfo;
import lombok.Data;

@Data
public class Result<T> {
    private int code;
    private String msg;
    private T data;
    private PageInfo<?> pageInfo; // 分页信息

    public static <T> Result<T> success(T data, PageInfo<?> pageInfo) {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMsg("success");
        result.setData(data);
        result.setPageInfo(pageInfo);
        return result;
    }

    public static Result<?> error(int code, String msg) {
        Result<?> result = new Result<>();
        result.setCode(code);
        result.setMsg(msg);
        return result;
    }
}
