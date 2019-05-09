

const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');
const app = express();

// 连接数据库
const db = require('../models/db.js')
const user_security = require('../models/user_security.js')
const user_info = require('../models/user_info.js')

// 用于加密签名的变量
app.set('superSecret', "superSecret");

router.post('/checkUserName', (req, res) => {
    let userName = req.body.userName;
    if (!userName || / /g.test(userName)) {
        res.json({
            userNameTip: "用户名不能有空格",
            isRegisterName: false
        })
        return
    }

    user_security.findOne({ userName }, (err, msg) => {
        if (msg) {
            res.json({
                userName,
                userNameTip: "该用户已注册",
                isRegisterName: false
            });
        } else {
            res.json({
                userName,
                userNameTip: "该用户可以注册",
                isRegisterName: true
            });
        }
    })
})
router.post('/register', (req, res) => {
    let userName = req.body.userName;
    let password = req.body.password;
    let twoPassword = req.body.twoPassword;
    let token = "";
    if (password !== twoPassword ||
        / /g.test(password + twoPassword)) {
        res.json({
            passwordTip: "两次密码不一致",
            isPassword: false
        })
        return;
    }
    if (!userName || / /g.test(userName)) {
        res.json({
            userNameTip: "用户名不能有空格",
            isRegisterName: false
        })
        return
    }
    user_security.findOne({ userName }, (err, msg) => {
        if (msg) {
            res.json({
                userName,
                userNameTip: "该用户已注册",
                isRegisterName: false
            });
        } else {
            // 新建用户
            token = jwt.sign({ userName, password }, app.get('superSecret'), {
                expiresIn: 60 * 60 * 24
            });
            user_security.create({ userName, password, token }, (err, msg) => {
                let userId = msg._id;
                user_info.create({
                    user: msg._id,
                }, (err, msg) => {
                    res.json({
                        userId: userId,
                        isLogin: true,
                        token
                    })
                })
            })
        }
    })
})

router.post('/login', (req, res) => {
    let userName = req.body.userName;
    let password = req.body.password;
    let token = ""
    user_security.findOne({ userName }, (err, msg) => {
        if (!msg) {
            res.json({ userName, userNameTip: "该用户未注册", isRegisterName: false });
        } else if (msg.password !== password) {
            res.json({ passwordTip: "密码错误", isPassword: false });
        } else {
            token = jwt.sign({ userName, password }, app.get("superSecret"), {
                expiresIn: 60 * 60 * 24
            });
            let userId = msg._id;
            // 登录成功后 更新token
            user_security.update({ userName }, { token }, function (err, msg) {
                res.json({
                    token,
                    userId,
                    isLogin: true
                })
            })
        }
    })
})
router.post('/islogin', (req, res) => {
    let token = req.body.token;
    user_security.findOne({
        token
    }, (err, msg) => {
        // console.log(msg)
        if (!msg) {
            res.json({
                isLogin: false,
            });
            return;
        }
        jwt.verify(token, app.get('superSecret'), function (err, decoded) {
            if (err) {
                res.json({
                    isLogin: false,
                });
            } else {
                user_security.findOne({
                    userName: decoded.userName,
                    password: decoded.password
                }, (err, msg) => {
                    if (err || !msg) {
                        res.json({
                            isLogin: false,
                        })
                    } else {
                        res.json({
                            isLogin: true,
                            token,
                            userId: msg._id,
                            userName: msg.userName
                        })
                    }
                })
            }
        });
    })
})

module.exports = router;
