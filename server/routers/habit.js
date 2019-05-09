const express = require('express');
const socket_io = require('socket.io');
const mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;

// 设置存储上传文件名和路径的配置
const multer = require('multer')
// const upload = multer({dest:'static/upload/'})
const multerConfig = {
    // https://segmentfault.com/a/1190000004636572
    // 文档写得不清不楚的，该链接让我知道了fileFilter应该写在哪里，怎样起作用，
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'static/upload/')
        },
        filename: (req, file, cb) => {
            cb(null, req.body.userId + '-' + Date.now() + file.originalname)
        }
    }),
    fileFilter: (req, file, cb) => {
        // console.log(file)
        // 允许上传
        cb(null, true)
        // 不允许上传
        // cb(null,false)
    },
    // 一些过滤配置
    limits: {
        // 限制文件大小不能超过5M，单位字节。
        fileSize: 5242880
    }
}

const imageUpload = multer(multerConfig)
const router = express.Router();
// 连接students数据库
const db = require('../models/db.js')
const habit_all = require('../models/habit_all.js')
const habit_record = require('../models/habit_record.js')
const user_collect = require('../models/user_collect.js')
const user_habit = require('../models/user_habit.js')


// 获取个人加入的习惯
router.get('/getHabits', (req, res) => {
    let userId = req.query.userId;
    user_habit.find({
        user: userId
    }).populate({
        path: "user"
    }).populate({
        path: "habit"
    }).exec((err, result) => {
        res.json({
            habitInfo: result
        })
    })
})

// 搜索习惯
router.get('/search', (req, res) => {
    let habitName = req.query.habitName;
    let userId = req.query.userId;
    // let reg = new RegExp('^'+habitName+'$','i');
    let reg = new RegExp(habitName, 'i');

    if (!habitName) {
        res.json({
            searchResult: [],
            isUpdate: false
        })
        return;
    }

    habit_all.find({
        habitName: {
            $regex: reg
        }
    },
        null,
        (err, allHabit) => {
            if (err) return;

            user_habit.find({
                user: userId
            }).populate({
                path: 'habit'
            }).exec((err, msg) => {
                // 确保习惯是唯一的
                habit_all.findOne({
                    habitName
                }, (err, oneResult) => {
                    // 获取已经加入的习惯
                    let myHabits = msg.map((item) => {
                        return {
                            habitName: item.habit.habitName,
                            stateName: '已加入',
                        }
                    })
                    // 把精确匹配的结果搬到列表最上面，如果没有精确匹配的结果就按数据库读取顺序显示
                    let topResult = allHabit.find((item) => {
                        return item.habitName === habitName
                    })
                    let topIndex = allHabit.findIndex((item) => {
                        return item.habitName === habitName
                    })
                    if (topIndex !== -1) {
                        allHabit.splice(topIndex, 1)
                        allHabit.unshift(topResult);
                    }
                    // 初始化搜索出来的结果
                    let searchHaibts = allHabit.map((item, i) => {
                        return {
                            habitId: item._id,
                            thum: item.thum,
                            habitName: item.habitName,
                            userCount: item.userCount,
                            stateName: '加入',
                        }
                    })
                    // 合并搜索出的习惯和自己已加入的习惯
                    searchResult = searchHaibts.map((item, index) => {
                        let update = myHabits.find(
                            (el) => {
                                return el.habitName === item.habitName
                            });
                        return update ? { ...item, ...update } : item
                    })
                    // 把未创建的习惯搬到结果的最上面
                    if (!oneResult && habitName !== '') {
                        searchResult.unshift({
                            userCount: '未创建',
                            stateName: '创建',
                            habitName
                        })
                    }
                    res.json({
                        searchResult,
                        isUpdate: false
                    })
                })
            })
            return;
        })
})
// 创建新习惯
router.get('/createHabit', (req, res) => {
    let habitName = req.query.habitName;
    let userId = req.query.userId;

    habit_all.findOne({
        habitName
    }, (err, msg) => {
        if (err) {
            res.json(err)
            return;
        }
        if (msg) {
            res.json({ msg: "习惯已存在" })
            return;
        }
        habit_all.create({
            habitName,
            userCount: 1,
            thum: "/images/default_habit.jpg",
            userArr: [userId],
        }, (err, msg) => {
            let {
                _id: habitId,
                userCount
            } = msg;
            user_habit.create({
                user: userId,
                habit: habitId
            }, (err, result) => {
                res.json({
                    isUpdate: true,
                    searchResult: [
                        {
                            habitName,
                            userCount,
                            stateName: '已加入'
                        }
                    ]
                })
            })
        })
    })
})


// 添加个人习惯
router.get('/addHabit', (req, res) => {
    let habitId = req.query.habitId;
    let userId = req.query.userId;
    user_habit.findOne({
        user: userId,
        habit: habitId
    }, (err, msg) => {
        if (msg) {
            res.json({ msg: "您已添加该习惯" })
            return;
        }
        user_habit.create({
            user: userId,
            habit: habitId
        }, (err, result) => {
            habit_all.findOneAndUpdate({
                _id: habitId
            }, {
                $inc: {
                    "userCount": +1
                },
                $push: {
                    "userArr": userId
                },
            }, {
                new: true
            }, (err, msg) => {
                res.json({
                    isUpdate: true,
                    searchResult: [
                        {
                            habitId: msg._id,
                            userCount: msg.userCount,
                            stateName: '已加入'
                        }
                    ]
                })
            })

        })
    })
})
// 删除个人的习惯
router.post('/delHabit', (req, res) => {

    let habitId = req.body.habitId;
    let userId = req.body.userId;

    user_habit.remove({
        user: userId,
        habit: habitId
    }, (err, msg) => {
        if (!msg) {
            res.json({
                msg: "您还没添加该习惯"
            })
            return;
        }
        habit_record.remove({
            user: userId
        }, (err, msg) => {
            user_collect.remove({
                author: userId
            }, (err, r) => { })
        })

        habit_all.findOneAndUpdate({
            _id: habitId
        }, {
                $inc: { "userCount": -1 },
                $pull: { "userArr": userId }
            }, (err, msg) => {
                res.json({
                    isDel: true,
                    habitInfo: [{
                        habit: habitId
                    }]
                })
            })
    })
})

// 签到
router.get('/clockIn', (req, res) => {
    let habitId = req.query.habitId;
    let userId = req.query.userId;

    user_habit.findOne({
        user: userId,
        habit: habitId
    }).exec((err, msg) => {
        if (!msg) {
            user_habit.create({
                user: userId,
                habit: habitId,
                isClockIn: true,
                date: [new Date()],
                lastDate: new Date()
            }, (err, result) => {
                res.json({
                    habitInfo: result
                })
            })
        } else if (msg.isClockIn) {
            res.json({
                isUpdate: true,
                habitInfo: [msg]
            })
        } else {
            user_habit.findOneAndUpdate({
                user: userId,
                habit: habitId
            }, {
                    $set: {
                        isClockIn: true,
                        date: [new Date()],
                        lastDate: new Date()
                    },
                    $inc: { "count": +1 }
                }, { new: true }).
                populate({ path: 'habit' }).
                exec((err, result) => {
                    res.json({
                        isUpdate: true,
                        habitInfo: [result]
                    })
                })
        }
    })
})

// 发布图文记录
router.post('/record', imageUpload.array('recordImage'), (req, res) => {

    let habitId = req.body.habitId;
    let userId = req.body.userId;
    let text = req.body.text;

    let urls = []
    req.files.map((item, index) => {
        let url = item.path.replace(/static\//, "").replace("\\", "/");
        return urls.push(`http://localhost:3008/${url}`);
        // return urls.push(`http://123.206.31.228:3008/${url}`);
    })

    habit_record.create({
        user: userId,
        habit: habitId,
        image: urls,
        text,
        praise: [],
        praiseCount: 0,
        comment: [],
        commentCount: 0
    }, (err, msg) => {
        habit_record.find({
            user: userId,
            habit: habitId
        }).populate({
            path: 'user'
        }).populate({
            path: 'habit'
        }).sort({ '_id': -1 }).limit(1).exec((err, msg) => {
            res.json({
                type: 'issue',
                recordList: msg
            })
        })
    })
})


// 删除图文记录
// 删除了自己的图文，别人要是收藏过就会查不到，解决办法除了这里使用的直接也删掉收藏者的图文，
// 还可以只是删掉这条图文的数据，保留该图文的ID不变，这样可以避免查询关联的图文时出错。
router.post('/delRecord', (req, res) => {
    let userId = req.body.userId;
    let recordId = req.body.recordId;

    habit_record.remove({
        user: userId,
        _id: recordId
    }, (err, msg) => {
        user_collect.remove({
            recordId
        }, (err, removeInfo) => {
            msg.n === 1 ?
                res.json({
                    type: 'del',
                    recordList: [{
                        _id: recordId
                    }]
                }) :
                res.json(msg)
        })
    })
})

// 查找图文记录
router.get('/getRecord', (req, res) => {
    let userId = req.query.userId;
    let habitId = req.query.habitId;
    // 用客户端最后一条ID作为下一条的开始
    let lastRecord = req.query.lastRecord;
    let type = req.query.type;

    // 让该ObjectId成为当前全局最新最大的，然后返回没它大的ObjectId对应的数据到客户端
    let id = mongoose.Types.ObjectId();
    /**
     * 这里可以根据用户、习惯、日期来进行分别查询
     */
    let findObj = {}
    switch (type) {
        case 'getUserHabitRecord':
            // 找某个人的某个习惯的图文
            findObj = {
                user: userId,
                habit: habitId,
                _id: { $lt: lastRecord ? lastRecord : id }
            }
            break;
        case 'getHabitRecord':
            // 找某个习惯的所有人的图文
            findObj = {
                habit: habitId,
                _id: { $lt: lastRecord ? lastRecord : id }
            }
            break;
        case 'getNewRecord':
            findObj = {
                _id: { $lt: lastRecord ? lastRecord : id }
            }
            break;
    }
    if (type === 'getHotRecord') {
        habit_all.find({},(err, msg) => {
            if (msg) {
                // 所有用户都存在这个数组里
                let allUserLikeArr = [];
                // 临时变量
                let tempUserArr = [];
                // 判断当前用户是否在习惯中的标志
                let userIndex = -1;
                for (let i=0; i<msg.length; i++) {
                    // indexOf 获取在当前习惯用户数组中当前用户的 index，没有就是-1
                    userIndex = msg[i].userArr.indexOf(userId);
                    // 大于-1说明这个习惯有当前用户
                    if (userIndex > -1) {
                        // 临时数组存的是把当前用户去掉的数组
                        tempUserArr = msg[i].userArr;
                        tempUserArr.splice(userIndex, 1);
                        // 然后把没有当前用户的数组拼接起来
                        allUserLikeArr = allUserLikeArr.concat(tempUserArr);
                    }
                }
                // 出现次数统计
                // console.log('-------allUserLikeArr--------\n', allUserLikeArr);
                let targetUserLike = allUserLikeArr.reduce((p, k) => (p[k]++ || (p[k] = 1), p), {});
                // console.log('-------result--------\n', targetUserLike);
                // 在排序一下
                let MostUserLikeArr = Object.keys(targetUserLike).sort((a,b)=>{
                    return targetUserLike[b]-targetUserLike[a];
                });
                // console.log('-------MostUserLikeArr--------\n', MostUserLikeArr);
                console.log('-------MostUserLikeArr[0]--------\n', MostUserLikeArr[0]);
                console.log(typeof(userId), typeof(MostUserLikeArr[0]))
                habit_record.find({
                    user: ObjectID(MostUserLikeArr[0]),
                    _id: { $lt: lastRecord ? lastRecord : id }
                }).populate({
                    path: 'user'
                }).populate({
                    path: 'habit'
                }).populate({
                    path: 'comment.user'
                }).sort({ '_id': -1 }).limit(3).exec((err, msg) => {
                    if (msg.length === 0) {
                        findObj = {
                            praiseCount: { $gt: 1 },
                            _id: { $lt: lastRecord ? lastRecord : id }
                        }
                        habit_record.find(findObj).populate({
                            path: 'user'
                        }).populate({
                            path: 'habit'
                        }).populate({
                            path: 'comment.user'
                        }).sort({ '_id': -1 }).limit(3).exec((err, msg) => {
                            console.log('msg:', msg)
                            let isHaveDate = '';
                            if (msg.length > 0) {
                                isHaveDate = '1';
                            } else {
                                isHaveDate = '0'
                            }
                            // 最新的评论在最上面，最早的评论在下面
                            let margeComment = msg.map((item) => {
                                if (item.comment[0]) {
                                    item.comment.sort((n1, n2) => {
                                        return n2.time - n1.time
                                    })
                                }
                                return item
                            })
                            let isJoinHabit = '';
                            let lastId = msg.length > 0 ? msg[msg.length - 1]._id : lastRecord;
                            res.json({
                                userId,
                                habitId,
                                isJoinHabit,
                                isHaveDate,
                                lastRecord: lastId,
                                type: lastRecord ? 'up' : 'list',
                                recordList: margeComment
                            })
                        })
                    } else {
                        let isHaveDate = '';
                        if (msg.length > 0) {
                            isHaveDate = '1';
                        } else {
                            isHaveDate = '0'
                        }
                        let margeComment = msg.map((item) => {
                            if (item.comment[0]) {
                                item.comment.sort((n1, n2) => {
                                    return n2.time - n1.time
                                })
                            }
                            return item
                        })
                        let isJoinHabit = '';
                        let lastId = msg.length > 0 ? msg[msg.length - 1]._id : lastRecord;
                        res.json({
                            userId,
                            habitId,
                            isJoinHabit,
                            isHaveDate,
                            lastRecord: lastId,
                            type: lastRecord ? 'up' : 'list',
                            recordList: margeComment
                        })
                    }
                })    
            }
        })
    } else if (type === 'myCollect') {
        // 收藏的图文
        user_collect.find({
            user: userId,
            _id: { '$lt': lastRecord ? lastRecord : id }
        }).populate({
            path: 'user'
        }).populate({
            path: 'recordId',
            populate: {
                path: 'user'
            },
        }).populate({
            path: 'recordId',
            populate: {
                path: 'habit'
            }
        }).populate({
            path: 'recordId',
            populate: {
                path: 'comment.user'
            }
        }).sort({ '_id': -1 }).limit(3).exec((err, msg) => {

            let isHaveDate = '';
            if (msg.length > 0) {
                isHaveDate = '1';
            } else {
                isHaveDate = '0'
            }
            // 最新的评论在最上面，最早的评论在下面
            let margeComment = msg.map((item, index) => {
                if (item.recordId.comment[0]) {
                    item.recordId.comment.sort((n1, n2) => {
                        return n2.time - n1.time
                    })
                }
                // 为了方便前端统一处理数据格式，所以统一返回相同格式
                return item.recordId
            })
            // 如果上拉还有数据就继续取最后一个id，如果没有数据就取最后一次加载的最后一个id
            let lastId = msg.length > 0 ? msg[msg.length - 1]._id : lastRecord
            res.json({
                isHaveDate,
                type: lastRecord ? 'up' : 'list',
                recordList: margeComment,
                lastRecord: lastId
            })
        })

    } else {
        habit_record.find(findObj).populate({
            path: 'user'
        }).populate({
            path: 'habit'
        }).populate({
            path: 'comment.user'
        }).sort({ '_id': -1 }).limit(3).exec((err, msg) => {
            // console.log('msg:', msg)
            let isHaveDate = '';
            if (msg.length > 0) {
                isHaveDate = '1';
            } else {
                isHaveDate = '0'
            }
            // 最新的评论在最上面，最早的评论在下面
            let margeComment = msg.map((item) => {
                if (item.comment[0]) {
                    item.comment.sort((n1, n2) => {
                        return n2.time - n1.time
                    })
                }
                return item
            })
            let isJoinHabit = '';
            let lastId = msg.length > 0 ? msg[msg.length - 1]._id : lastRecord

            if (type === 'getHabitRecord') {
                user_habit.findOne({
                    user: userId,
                    habit: findObj.habit
                }, (err, msg) => {
                    // 查询自己有没有加入这个习惯
                    isJoinHabit = msg ? false : true;
                    res.json({
                        userId,
                        habitId,
                        isJoinHabit,
                        isHaveDate,
                        lastRecord: lastId,
                        type: lastRecord ? 'up' : 'list',
                        recordList: margeComment
                    })
                })
            } else {
                res.json({
                    userId,
                    habitId,
                    isJoinHabit,
                    isHaveDate,
                    lastRecord: lastId,
                    type: lastRecord ? 'up' : 'list',
                    recordList: margeComment
                })
            }
        })
    }

})

// 点赞
router.get('/like', (req, res) => {
    let userId = req.query.userId;
    let author = req.query.author;
    let recordId = req.query.recordId;

    habit_record.findOne({
        _id: recordId,
        praise: userId
    }, (err, msg) => {
        if (msg) {
            habit_record.findOneAndUpdate({ _id: recordId },
                {
                    $pull: {
                        praise: userId
                    },
                    $inc: {
                        praiseCount: -1
                    }
                }, {
                    new: true
                }, (err, msg) => {
                    // 取消用户点赞过的图文
                    user_collect.remove({
                        user: userId,
                        recordId
                    }, (err, removeInfo) => {
                        removeInfo.n === 1 ?
                            res.json({
                                type: 'update',
                                recordList: [msg]
                            }) :
                            res.json(err)
                    })
                })
        } else {
            habit_record.findOneAndUpdate({ _id: recordId },
                {
                    $push: {
                        praise: [userId]
                    },
                    $inc: {
                        praiseCount: +1
                    }
                }, {
                    new: true
                }, (err, msg) => {
                    // 记录用户点赞过的图文
                    user_collect.create({
                        author,
                        user: userId,
                        recordId
                    }, (err) => {
                        err ?
                            res.json(err) :
                            res.json({
                                type: 'update',
                                recordList: [msg]
                            })
                    });

                })
        }
    })
})

// 评论/回复
router.post('/comment', (req, res) => {
    let userId = req.body.userId;
    let recordId = req.body.recordId;
    let content = req.body.content;
    let otherUserComment = req.body.otherUserComment;

    habit_record.findOneAndUpdate({ _id: recordId }, {
        $push: {
            comment: [{
                otherUserComment,
                user: userId,
                content,
            }]
        },
        $inc: { commentCount: +1 },
        $set: { "time": new Date() },
    }, { new: true }).
        populate({ path: 'comment.user' }).
        populate({ path: 'user' }).
        exec((err, msg) => {
            // 最新的评论在最上面，最早的评论在下面
            if (msg.comment[0]) {
                msg.comment.sort((n1, n2) => {
                    return n2.time - n1.time
                })
            }
            res.json({
                type: 'update',
                recordList: [msg]
            })
        })
})

// 删除评论/回复
router.post('/delComment', (req, res) => {
    let userId = req.body.userId;
    let recordId = req.body.recordId;
    let commentId = req.body.commentId;

    habit_record.findOneAndUpdate({
        _id: recordId
    }, {
            $pull: {
                "comment": {
                    _id: commentId,
                    user: userId
                }
            },
            $inc: {
                commentCount: -1
            }
        }, { new: true }).populate({
            path: 'comment.user'
        }).populate({
            path: 'user'
        }).exec((err, msg) => {
            // 最新的评论在最上面，最早的评论在下面
            if (msg.comment[0]) {
                msg.comment.sort((n1, n2) => {
                    return n2.time - n1.time
                })
            }
            res.json({
                type: 'update',
                recordList: [msg]
            })
        })
})

module.exports = router