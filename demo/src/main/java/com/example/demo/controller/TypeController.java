package com.example.demo.controller;

import com.example.demo.dto.Result;
import com.example.demo.pojo.Type;
import com.example.demo.service.TypeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/types")
@CrossOrigin(origins = "*")
public class TypeController {

    @Autowired
    private TypeService typeService;

    @GetMapping
    public ResponseEntity<Result<List<Type>>> getAllTypes() {
        List<Type> types = typeService.list();
        return ResponseEntity.ok(Result.success(types, null));
//        return Result.success(types, null);
    }
}
